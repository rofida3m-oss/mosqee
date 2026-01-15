import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import Database from './database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const db = new Database();
const PORT = process.env.PORT || 5000;
import { Server } from 'socket.io';
import { createServer } from 'http';

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Store waiting players for live matching: { socketId, userId, name, category, questionsCount }
let waitingPlayers = [];
const activeGames = {}; // { roomId: { [userId]: { score, finished } } }

// Track online users globally
const onlineUsers = new Set(); // Set of user IDs

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Register user to personal room for invites
    socket.on('register_user', (userId) => {
        const sid = String(userId);
        socket.join(`user_${sid}`);
        socket.userId = sid; // Store for easy access
        onlineUsers.add(sid);
        io.emit('user_status_change', { userId: sid, isOnline: true });
        console.log(`User ${sid} registered to socket (Online: ${onlineUsers.size})`);
    });

    // ---- ASYNC CHALLENGE ROOMS ----
    socket.on('join_challenge', (challengeId) => {
        socket.join(challengeId);
        console.log(`Socket ${socket.id} joined challenge ${challengeId}`);
    });

    socket.on('challenge_update', (data) => {
        // Broadcast update to others in the room
        socket.to(data.challengeId).emit('challenge_updated', data);
    });

    // ---- LIVE CHALLENGE LOGIC ----
    socket.on('get_online_friends', (friendIds, callback) => {
        const onlineIds = friendIds.filter(id => {
            const room = io.sockets.adapter.rooms.get(`user_${id}`);
            return room && room.size > 0;
        });
        callback(onlineIds);
    });

    socket.on('send_invite', (data) => {
        // data: { fromId, fromName, toId, category, questionsCount }
        console.log(`Invite from ${data.fromName} to ${data.toId}`);
        io.to(`user_${data.toId}`).emit('invite_received', data);
    });

    socket.on('invite_response', async (data) => {
        // data: { accepted: boolean, inviteData: { ... }, roomId? }
        if (data.accepted) {
            const roomId = `live_invite_${Date.now()}`;
            const { fromId, toId, category, questionsCount, fromName } = data.inviteData;

            // Join both to room
            const joinSocketToRoom = (userId, room) => {
                const sockets = io.sockets.adapter.rooms.get(`user_${userId}`);
                if (sockets) {
                    sockets.forEach(socketId => {
                        const s = io.sockets.sockets.get(socketId);
                        if (s) s.join(room);
                    });
                }
            };

            joinSocketToRoom(fromId, roomId);
            joinSocketToRoom(toId, roomId);

            // Fetch questions
            const questions = await db.getQuestions(questionsCount, category);

            // Get Names (assuming inviter sent theirs)
            const acceptorName = data.acceptorName || 'Friend';

            const matchData = {
                roomId,
                questions,
                players: {
                    [fromId]: { name: fromName, score: 0 },
                    [toId]: { name: acceptorName, score: 0 }
                }
            };

            io.to(roomId).emit('game_start', matchData);
            console.log(`Invite Match started ${roomId}`);
        } else {
            // Notify sender of rejection
            io.to(`user_${data.inviteData.fromId}`).emit('invite_rejected', {
                name: data.acceptorName
            });
        }
    });

    socket.on('join_live_lobby', async (data) => {
        // data: { userId, name, category, questionsCount }
        console.log(`[Queue] ${data.name} searching for ${data.category} (${data.questionsCount} questions)`);

        // Ensure socket is in user room
        socket.join(`user_${data.userId}`);
        socket.userId = data.userId;

        // Validation: Ensure the user is not already in the queue from another stale socket
        waitingPlayers = waitingPlayers.filter(p => p.userId !== data.userId);

        // Find match
        const opponentIndex = waitingPlayers.findIndex(p => {
            if (p.userId === data.userId) return false;

            // CRITICAL: Verify the opponent is actually still connected
            const oppSocket = io.sockets.sockets.get(p.socketId);
            if (!oppSocket || !oppSocket.connected) return false;

            return p.category === data.category && p.questionsCount === data.questionsCount;
        });

        if (opponentIndex > -1) {
            // Match found!
            const opponent = waitingPlayers[opponentIndex];
            waitingPlayers.splice(opponentIndex, 1); // Remove from queue

            const roomId = `live_${Date.now()}`;
            socket.join(roomId);
            const opponentSocket = io.sockets.sockets.get(opponent.socketId);
            if (opponentSocket) opponentSocket.join(roomId);

            // Fetch questions
            const questions = await db.getQuestions(data.questionsCount, data.category);

            // Fetch players for status/streak
            const [userFull, oppFull] = await Promise.all([
                db.getUser(data.userId),
                db.getUser(opponent.userId)
            ]);

            const matchData = {
                roomId,
                questions,
                players: {
                    [data.userId]: { name: data.name, score: 0, streak: userFull?.winningStreak || 0 },
                    [opponent.userId]: { name: opponent.name, score: 0, streak: oppFull?.winningStreak || 0 }
                }
            };

            io.to(roomId).emit('game_start', matchData);
            console.log(`Match started in ${roomId}: ${data.name} vs ${opponent.name}`);

        } else {
            // No match, add to waiting list
            waitingPlayers.push({
                socketId: socket.id,
                joinedAt: Date.now(),
                ...data
            });
            socket.emit('waiting_for_opponent');
        }
    });

    // Cleanup stale players periodically (every 30s)
    setInterval(() => {
        const now = Date.now();
        const initial = waitingPlayers.length;
        waitingPlayers = waitingPlayers.filter(p => {
            const s = io.sockets.sockets.get(p.socketId);
            return s && s.connected && (now - p.joinedAt < 120000); // 2 minute timeout
        });
        if (waitingPlayers.length < initial) {
            console.log(`[Queue] Cleaned up ${initial - waitingPlayers.length} stale players.`);
        }
    }, 30000);

    // Track live scores and handle completion
    socket.on('submit_live_score', async (data) => {
        // data: { roomId, userId, score, isFinal, currentQuestionIndex }

        // Initialize room state if not exists
        if (!activeGames[data.roomId]) {
            activeGames[data.roomId] = {
                players: {},
                currentQuestionIndex: 0,
                answeredCount: 0
            };
        }

        const room = activeGames[data.roomId];

        // Register player if not already
        if (!room.players[data.userId]) {
            room.players[data.userId] = { score: 0, finished: false, lastAnsweredIndex: -1 };
        }

        const player = room.players[data.userId];
        player.score = data.score;
        player.finished = data.isFinal;

        // Broadcast progress for UI (real-time score bars)
        socket.to(data.roomId).emit('opponent_progress', {
            userId: data.userId,
            score: data.score,
            isFinal: data.isFinal
        });

        // Synchronized progression logic
        // If the player is submitting an answer for the CURRENT question index
        if (data.currentQuestionIndex === room.currentQuestionIndex && player.lastAnsweredIndex < room.currentQuestionIndex) {
            player.lastAnsweredIndex = room.currentQuestionIndex;
            room.answeredCount++;

            // If both players have answered the current question
            const playerIds = Object.keys(room.players);
            if (playerIds.length === 2 && room.answeredCount >= 2) {
                // Both answered! Reset counter and tell both to advance after 2s delay
                room.answeredCount = 0;
                room.currentQuestionIndex++;
                if (!data.isFinal) {
                    setTimeout(() => {
                        io.to(data.roomId).emit('next_question', {
                            nextIndex: room.currentQuestionIndex
                        });
                    }, 2000);
                }
            }
        }

        if (data.isFinal) {
            const playerIds = Object.keys(room.players);

            if (playerIds.length === 2 && room.players[playerIds[0]].finished && room.players[playerIds[1]].finished) {
                // Both finished! Determine winner
                const p1Id = playerIds[0];
                const p2Id = playerIds[1];
                const p1 = room.players[p1Id];
                const p2 = room.players[p2Id];

                console.log(`Game ${data.roomId} Finished. Scores: ${p1Id}=${p1.score}, ${p2Id}=${p2.score}`);

                // Emit final results to both
                io.to(data.roomId).emit('live_game_over', {
                    scores: {
                        [p1Id]: p1.score,
                        [p2Id]: p2.score
                    }
                });

                // Create a challenge record for history
                const challengeId = data.roomId.includes('live_') ? data.roomId : `live_h_${Date.now()}`;
                await db.createChallenge({
                    id: challengeId,
                    challengerId: p1Id,
                    opponentId: p2Id,
                    questionIds: [],
                    status: 'pending',
                    type: 'live'
                });
                // Update final scores in challenge record
                await db.updateChallengeScore(challengeId, p1Id, p1.score);
                await db.updateChallengeScore(challengeId, p2Id, p2.score);

                // Signal both players to refresh their history
                io.to(data.roomId).emit('challenge_history_update');

                // Clean up memory
                delete activeGames[data.roomId];
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        waitingPlayers = waitingPlayers.filter(p => p.socketId !== socket.id);

        const userId = socket.userId;
        if (userId) {
            // Check if user has other tabs/sockets still open
            const userRoom = io.sockets.adapter.rooms.get(`user_${userId}`);
            if (!userRoom || userRoom.size === 0) {
                onlineUsers.delete(userId);
                io.emit('user_status_change', { userId, isOnline: false });
                console.log(`User ${userId} is now completely offline`);
            }
            Object.keys(activeGames).forEach(roomId => {
                const room = activeGames[roomId];
                if (room.players[userId]) {
                    io.to(roomId).emit('opponent_disconnected', { userId });
                    // Optionally cleanup game after some time or immediately
                    // delete activeGames[roomId];
                }
            });
        }
    });
});

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Initialize database
await db.init();

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

console.log('✅ Database initialized');

// ==================== USER ENDPOINTS ====================
app.get('/api/users/search', async (req, res) => {
    try {
        const { q } = req.query;
        console.log(`[API] GET /users/search?q=${q}`);
        if (!q) return res.json([]);

        const users = await db.searchUsers(q);

        // Enrich with online status
        const enrichedUsers = users.map(u => {
            const sid = String(u.id);
            const isOnline = onlineUsers.has(sid);
            return {
                ...u,
                isOnline
            };
        });

        console.log(`[API] Found ${users ? users.length : 0} users for query: ${q}`);
        res.json(enrichedUsers || []);
    } catch (error) {
        console.error('[API] Search error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/online-status', (req, res) => {
    const { ids } = req.query;
    if (!ids) return res.json({});

    const idArray = ids.split(',');
    const statuses = {};
    idArray.forEach(id => {
        statuses[id] = onlineUsers.has(id);
    });
    res.json(statuses);
});
app.post('/api/users/login', async (req, res) => {
    try {
        const { name, phone, isAdmin } = req.body;
        let user = await db.getUserByPhone(phone);

        if (user) {
            if (isAdmin) {
                user.role = 'admin';
                user.isActive = true;
                if (name) user.name = name;
                await db.updateUser(user);
            } else if (!user.isActive) {
                return res.status(403).json({ error: 'User account is disabled' });
            }
        } else {
            user = {
                id: isAdmin ? 'admin_' + Date.now() : 'u_' + Date.now(),
                name: name || (isAdmin ? 'System Admin' : 'New User'),
                phone,
                role: isAdmin ? 'admin' : 'user',
                isActive: true,
                location: { lat: 30.0444, lng: 31.2357 },
                followingMosques: [],
                registeredLessons: []
            };
            await db.addUser(user);
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users/register', async (req, res) => {
    try {
        const { name, phone, role, managedMosqueId } = req.body;
        const user = {
            id: 'u_' + Date.now(),
            name,
            phone,
            role: role || 'user',
            managedMosqueId: managedMosqueId || null,
            isActive: true,
            location: { lat: 30.0444, lng: 31.2357 },
            followingMosques: [],
            registeredLessons: []
        };
        await db.addUser(user);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await db.getUser(req.params.id);
        if (user) {
            user.isOnline = onlineUsers.has(String(user.id));
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/:id/full-profile', async (req, res) => {
    try {
        const userId = String(req.params.id);
        const [user, followers, following, challenges, khatmas, allMosques] = await Promise.all([
            db.getUser(userId),
            db.getFollowers(userId),
            db.getFollowing(userId),
            db.getUserChallenges(userId),
            db.getUserKhatmas(userId),
            db.getMosques()
        ]);

        if (!user) return res.status(404).json({ error: 'User not found' });

        const followedMosques = allMosques.filter(m => user.followingMosques?.includes(m.id));

        const fullProfile = {
            ...user,
            isOnline: onlineUsers.has(userId),
            followers: followers.map(f => ({ ...f, isOnline: onlineUsers.has(String(f.id)) })),
            following: following.map(f => ({ ...f, isOnline: onlineUsers.has(String(f.id)) })),
            followedMosques,
            challenges: challenges || [],
            khatmas: khatmas || [],
            stats: {
                followersCount: followers.length,
                followingCount: following.length,
                challengesCount: (challenges || []).length,
                khatmasCount: (khatmas || []).length,
                mosquesCount: followedMosques.length
            }
        };

        res.json(fullProfile);
    } catch (error) {
        console.error('Error fetching full profile:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const user = req.body;
        await db.updateUser(user);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await db.getAllUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/:id/blocked', async (req, res) => {
    try {
        const user = await db.getUser(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const blockedUsers = (user.blockedUsers || []).map(id => db.getUser(id)).filter(u => u);
        res.json(blockedUsers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== MOSQUE ENDPOINTS ====================
app.post('/api/mosques', async (req, res) => {
    try {
        const mosque = req.body;
        await db.addMosque(mosque);
        res.json(mosque);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/mosques', async (req, res) => {
    try {
        const mosques = await db.getMosques();
        res.json(mosques);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/mosques/:id', async (req, res) => {
    try {
        const mosque = req.body;
        await db.updateMosque(mosque);
        res.json(mosque);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== MOSQUE FOLLOWING ====================
app.post('/api/users/:userId/follow-mosque', async (req, res) => {
    try {
        const userId = req.params.userId;
        const { mosqueId } = req.body;

        // Get the current user data
        const user = await db.getUser(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if already following
        if (user.followingMosques.includes(mosqueId)) {
            return res.status(400).json({ error: 'Already following this mosque' });
        }

        // Add mosque to following list
        user.followingMosques.push(mosqueId);
        await db.updateUser(user);

        // Update mosque followers count
        const mosque = await db.getMosqueById(mosqueId);
        if (mosque) {
            mosque.followersCount = (mosque.followersCount || 0) + 1;
            await db.updateMosque(mosque);
        }

        res.json({ success: true, followingMosques: user.followingMosques });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/users/:userId/follow-mosque/:mosqueId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const mosqueId = req.params.mosqueId;

        // Get the current user data
        const user = await db.getUser(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Remove mosque from following list
        user.followingMosques = user.followingMosques.filter(id => id !== mosqueId);
        await db.updateUser(user);

        // Update mosque followers count
        const mosque = await db.getMosqueById(mosqueId);
        if (mosque && mosque.followersCount > 0) {
            mosque.followersCount = mosque.followersCount - 1;
            await db.updateMosque(mosque);
        }

        res.json({ success: true, followingMosques: user.followingMosques });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== LESSON ENDPOINTS ====================
app.post('/api/lessons', async (req, res) => {
    try {
        const lesson = req.body;
        await db.addLesson(lesson);
        res.json(lesson);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/lessons', async (req, res) => {
    try {
        const lessons = await db.getLessons();
        res.json(lessons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== POST ENDPOINTS ====================
app.post('/api/posts', async (req, res) => {
    try {
        const post = req.body;
        await db.addPost(post);
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/posts', async (req, res) => {
    try {
        const userId = req.query.userId;
        const posts = await db.getPosts(userId);
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/posts/:id', async (req, res) => {
    try {
        const post = req.body;
        await db.updatePost(post);
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== POST LIKES ====================
app.post('/api/posts/:postId/like', async (req, res) => {
    try {
        const { userId } = req.body;
        await db.addLike(req.params.postId, userId);
        const likes = await db.getPostLikes(req.params.postId);
        res.json({ success: true, likes });
    } catch (error) {
        // Handle duplicate like gracefully
        if (error?.message?.includes('Already liked')) {
            const likes = await db.getPostLikes(req.params.postId).catch(() => 0);
            return res.status(409).json({ success: false, error: 'Already liked', likes });
        }
        console.error('Error adding like:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/posts/:postId/unlike', async (req, res) => {
    try {
        const { userId } = req.body;
        await db.removeLike(req.params.postId, userId);
        const likes = await db.getPostLikes(req.params.postId);
        res.json({ success: true, likes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/posts/:postId/like', async (req, res) => {
    try {
        const { userId } = req.body;
        await db.removeLike(req.params.postId, userId);
        const likes = await db.getPostLikes(req.params.postId);
        res.json({ success: true, likes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/posts/:postId/likes', async (req, res) => {
    try {
        const likes = await db.getPostLikes(req.params.postId);
        res.json({ count: likes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/posts/:postId/like/:userId', async (req, res) => {
    try {
        const liked = await db.hasUserLiked(req.params.postId, req.params.userId);
        res.json({ liked });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== POST COMMENTS ====================
app.post('/api/posts/:postId/comments', async (req, res) => {
    try {
        const postId = req.params.postId;
        const payload = req.body || {};

        // Normalize payload to server-side comment shape
        const commentId = payload.id || 'c_' + Date.now();
        const userId = payload.userId;
        const content = payload.content || payload.text || '';

        if (!userId) return res.status(400).json({ error: 'Missing userId' });
        if (!content) return res.status(400).json({ error: 'Empty content' });

        // Try to get user name for a proper record
        let userName = payload.userName;
        if (!userName) {
            const user = await db.getUser(payload.userId).catch(() => null);
            userName = user?.name || 'مستخدم';
        }
        // Create structured comment object
        const comment = {
            id: payload.id || 'c_' + Date.now(),
            postId: postId,
            userId: payload.userId,
            userName: userName, // Use the resolved userName
            content: payload.content || payload.text || '',
            parentId: payload.parentId || null,
            createdAt: payload.createdAt || new Date().toISOString(),
            likes: payload.likes || 0 // Keep likes if present in payload
        };

        if (!comment.userId) {
            return res.status(400).json({ error: 'Missing userId' });
        }
        if (!comment.content) {
            return res.status(400).json({ error: 'Empty content' });
        }

        console.log('POST /api/posts/:postId/comments saving:', comment);

        await db.addComment(comment);

        // Return the saved comment (authoritative)
        res.json(comment);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/posts/:postId/comments', async (req, res) => {
    try {
        const comments = await db.getComments(req.params.postId);
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/posts/:postId/comments/:commentId', async (req, res) => {
    try {
        await db.deleteComment(req.params.commentId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/comments/:commentId', async (req, res) => {
    try {
        await db.deleteComment(req.params.commentId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== POST SHARES ====================
app.post('/api/posts/:postId/share', async (req, res) => {
    try {
        const { userId } = req.body;
        await db.addShare(req.params.postId, userId);
        const shares = await db.getShareCount(req.params.postId);
        res.json({ success: true, shares });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/posts/:postId/shares', async (req, res) => {
    try {
        const shares = await db.getShareCount(req.params.postId);
        res.json({ shares });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== POST FAVORITES ====================
app.post('/api/posts/:postId/favorite', async (req, res) => {
    try {
        const { userId } = req.body;
        await db.addFavorite(req.params.postId, userId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/posts/:postId/unfavorite', async (req, res) => {
    try {
        const { userId } = req.body;
        await db.removeFavorite(req.params.postId, userId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/posts/:postId/favorited/:userId', async (req, res) => {
    try {
        const favorited = await db.hasUserFavorited(req.params.postId, req.params.userId);
        res.json({ favorited });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/:userId/favorites', async (req, res) => {
    try {
        const posts = await db.getUserFavorites(req.params.userId);
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get shareable URL for a post
app.get('/api/posts/:postId/share-url', async (req, res) => {
    try {
        const postId = req.params.postId;
        const post = await db.getPost(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Generate shareable URL - you can customize this based on your domain
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const shareUrl = `${baseUrl}/post/${postId}`;

        res.json({ shareUrl, postId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== PRAYER LOG ENDPOINTS ====================
app.post('/api/prayer-logs', async (req, res) => {
    try {
        const log = req.body;
        await db.savePrayerLog(log);
        res.json(log);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/prayer-logs/:userId/:date', async (req, res) => {
    try {
        const log = await db.getPrayerLog(req.params.userId, req.params.date);
        res.json(log);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== TASBIH LOG ENDPOINTS ====================
app.get('/api/tasbih-logs/:userId/:date', async (req, res) => {
    try {
        const log = await db.getTasbihLog(req.params.userId, req.params.date);
        res.json(log);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/tasbih-logs/recent/:userId', async (req, res) => {
    try {
        const limit = req.query.limit || 7;
        const logs = await db.getRecentTasbihLogs(req.params.userId, limit);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/tasbih-logs/clear/:userId', async (req, res) => {
    try {
        await db.clearTasbihLogs(req.params.userId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ==================== KHATMA ENDPOINTS ====================
app.get('/api/khatma', async (req, res) => {
    try {
        const khatma = await db.getKhatma();
        res.json(khatma);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/khatma/:id', async (req, res) => {
    try {
        const payload = req.body || {};
        const id = req.params.id;
        const khatma = { id, ...payload };

        console.log('PUT /api/khatma/:id merged payload:', khatma);

        await db.updateKhatma(khatma);

        // Fetch the authoritative persisted khatma from DB and return it
        const persisted = await db.getKhatma();
        console.log('Persisted khatma after update:', persisted);

        res.json(persisted);
    } catch (error) {
        console.error('Error updating khatma:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

// ==================== ATHKAR LOGS ====================
app.post('/api/athkar-logs', async (req, res) => {
    console.log('📥 Received POST request to /api/athkar-logs');
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    try {
        const { userId, category, progress, date } = req.body;
        console.log('Received athkar log request:', { userId, category, progress, date });

        // Validate required fields
        if (!userId || !category) {
            console.error('Missing required fields:', { userId, category });
            return res.status(400).json({ error: 'Missing required fields: userId and category are required' });
        }

        // Convert progress to object if it's not already
        const progressObj = typeof progress === 'object' ? progress : {};
        const dateStr = date || new Date().toISOString().split('T')[0];

        console.log('Saving athkar log:', { userId, category, progress: progressObj, date: dateStr });
        await db.saveAthkarLog(userId, category, progressObj, dateStr);
        console.log('Athkar log saved successfully');
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving athkar log:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/athkar-logs/:userId/:date/:category', async (req, res) => {
    try {
        const { userId, date, category } = req.params;
        const log = await db.getAthkarLog(userId, date, category);
        res.json(log);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== SUPPORT TICKET ENDPOINTS ====================
app.post('/api/support/tickets', async (req, res) => {
    try {
        const ticket = req.body;
        await db.addTicket(ticket);
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/support/tickets', async (req, res) => {
    try {
        const tickets = await db.getTickets();
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/support/tickets/:id', async (req, res) => {
    try {
        const ticket = req.body;
        await db.updateTicket(ticket);
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Legacy tickets endpoint (backward compatibility)
// ==================== TICKET ENDPOINTS ====================
app.post('/api/tickets', async (req, res) => {
    try {
        const ticket = req.body;
        await db.addTicket(ticket);
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/tickets', async (req, res) => {
    try {
        const tickets = await db.getTickets();
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/tickets/:id', async (req, res) => {
    try {
        const ticket = req.body;
        await db.updateTicket(ticket);
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== POST MANAGEMENT ====================
app.delete('/api/posts/:id', async (req, res) => {
    try {
        await db.deletePost(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/posts/:id', async (req, res) => {
    try {
        const { content } = req.body;
        await db.editPost(req.params.id, content);
        const post = await db.getPosts();
        const updated = post.find(p => p.id === req.params.id);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/posts/:id/edit', async (req, res) => {
    try {
        const { content } = req.body;
        await db.editPost(req.params.id, content);
        const post = await db.getPosts();
        const updated = post.find(p => p.id === req.params.id);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== NOTIFICATIONS ====================
app.post('/api/notifications', async (req, res) => {
    try {
        const notification = req.body;
        await db.createNotification(notification);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/notifications/:userId', async (req, res) => {
    try {
        const notifications = await db.getNotifications(req.params.userId);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/notifications/:id/read', async (req, res) => {
    try {
        await db.markNotificationAsRead(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Assistant Logs endpoints
app.post('/api/assistant/logs', async (req, res) => {
    try {
        const log = req.body || {};
        log.id = log.id || 'alog_' + Date.now();
        await db.addAssistantLog(log);
        res.json({ success: true, id: log.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/assistant/logs', async (req, res) => {
    try {
        const userId = req.query.userId;
        const logs = await db.getAssistantLogs(userId);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== V2 ENDPOINTS ====================

// ---- SOCIAL ----
app.post('/api/users/follow', async (req, res) => {
    try {
        const { followerId, followingId } = req.body;
        await db.followUser(followerId, followingId);

        // Get names for better notification
        const [follower, following] = await Promise.all([
            db.getUser(followerId),
            db.getUser(followingId)
        ]);

        const isMutual = await db.checkMutualFollow(followerId, followingId);

        const notifId = 'notif_' + Date.now();
        const content = isMutual
            ? `أنت و ${follower.name} متابعون الآن! 🎉`
            : `${follower.name} قام بمتابعتك`;

        // Save notification to DB
        await db.createNotification({
            id: notifId,
            userId: followingId,
            fromUserId: followerId,
            type: 'follow',
            content: content
        });

        // Emit real-time socket event
        io.to(`user_${followingId}`).emit('notification_received', {
            id: notifId,
            type: 'follow',
            fromUserId: followerId,
            fromName: follower.name,
            content: content,
            isMutual: isMutual
        });

        // If it's a mutual follow, notify the follower too
        if (isMutual) {
            io.to(`user_${followerId}`).emit('notification_received', {
                id: notifId + '_m',
                type: 'mutual_follow',
                content: `أنت و ${following.name} متابعون الآن! 🎉`
            });
        }

        res.json({ success: true, isMutual });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users/unfollow', async (req, res) => {
    try {
        const { followerId, followingId } = req.body;
        await db.unfollowUser(followerId, followingId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/:userId/followers', async (req, res) => {
    try {
        const followers = await db.getFollowers(req.params.userId);
        res.json(followers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/:userId/following', async (req, res) => {
    try {
        const following = await db.getFollowing(req.params.userId);
        res.json(following);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/check-mutual', async (req, res) => {
    try {
        const { userA, userB } = req.query;
        const isMutual = await db.checkMutualFollow(userA, userB);
        res.json({ isMutual });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ---- KHATMA V2 ----
app.post('/api/khatma/user', async (req, res) => {
    try {
        const khatma = req.body;
        // Validate mutual follow for private groups
        if (khatma.type === 'private_group' && khatma.participants) {
            // Logic to verify mutual follows can be added here or relied on frontend
            // For now, we trust the input, but in prod we should verify
        }
        await db.createUserKhatma(khatma);
        res.json({ success: true, id: khatma.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/khatma/user/:userId', async (req, res) => {
    try {
        const khatmas = await db.getUserKhatmas(req.params.userId);
        res.json(khatmas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/khatma/:khatmaId/progress', async (req, res) => {
    try {
        const { userId, progress } = req.body; // progress: { currentJuz } or { partId }
        await db.updateKhatmaProgress(req.params.khatmaId, userId, progress);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/khatma/:khatmaId/complete', async (req, res) => {
    try {
        const { userId, durationDays } = req.body;
        await db.completeUserKhatma(req.params.khatmaId, userId, durationDays);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/khatma/history/:userId', async (req, res) => {
    try {
        const history = await db.getKhatmaHistory(req.params.userId);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/khatma/check-reminders/:userId', async (req, res) => {
    try {
        const reminders = await db.getInactivityReminders(req.params.userId);
        res.json(reminders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/khatma/mark-reminder-sent', async (req, res) => {
    try {
        const { khatmaId } = req.body;
        await db.markReminderSent(khatmaId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ---- CHALLENGE V2 ----
app.get('/api/challenges/questions', async (req, res) => {
    try {
        const count = req.query.count || 5;
        const category = req.query.category || 'all';
        const questions = await db.getQuestions(count, category);
        res.json(questions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/challenges/questions/by-ids', async (req, res) => {
    try {
        const { ids } = req.body;
        const questions = await db.getQuestionsByIds(ids);
        res.json(questions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/challenges/create', async (req, res) => {
    try {
        const challenge = req.body;
        // If it's a tie-breaker, ensure we mark it as such and include type logic if needed
        if (challenge.type === 'tie_breaker') {
            // Tie breaker specific logic can go here if needed
        }
        await db.createChallenge(challenge);

        // Notify via socket if looking for live opponent (omitted for async for now, handled by client join)

        res.json({ success: true, id: challenge.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/challenges/:id', async (req, res) => {
    try {
        // Try p2p first
        let challenge = await db.getChallenge(req.params.id).catch(() => null);
        // If not found, try mosque challenge
        if (!challenge) {
            challenge = await db.getChallengeById(req.params.id).catch(() => null);
        }

        if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
        res.json(challenge);
    } catch (error) {
        console.error('Error fetching challenge:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/challenges/submit', async (req, res) => {
    try {
        const { challengeId, userId, score } = req.body;
        await db.updateChallengeScore(challengeId, userId, score);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/challenges/inbound/:userId', async (req, res) => {
    try {
        const challenges = await db.getInboundChallenges(req.params.userId);
        res.json(challenges);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/challenges/leaderboard', async (req, res) => {
    try {
        const leaderboard = await db.getLeaderboardData();
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/challenges/history/:userId', async (req, res) => {
    try {
        const history = await db.getUserChallenges(req.params.userId);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ---- TASBIH V2 ----
app.get('/api/tasbih/goals/:userId', async (req, res) => {
    try {
        const goals = await db.getTasbihGoal(req.params.userId);
        res.json(goals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/tasbih/goals', async (req, res) => {
    try {
        const { userId, goal } = req.body;
        await db.setTasbihGoal(userId, goal);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/tasbih/stats', async (req, res) => {
    try {
        const { userId, count } = req.body;
        await db.updateTasbihStats(userId, count);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/tasbih-logs', async (req, res) => {
    try {
        await db.saveTasbihLog(req.body);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/tasbih/total/:userId', async (req, res) => {
    try {
        const total = await db.getTotalTasbihCount(req.params.userId);
        res.json({ total });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ==================== EDUCATIONAL LESSONS ENDPOINTS ====================
// Get all lessons with user progress
app.get('/api/educational-lessons', async (req, res) => {
    try {
        const { userId } = req.query;
        const lessons = await db.getAllEducationalLessons();

        if (userId) {
            // Initialize progress for new users
            await db.initializeUserLessonProgress(userId);

            // Get user progress for all lessons
            const progressList = await db.getAllUserLessonProgress(userId);
            const progressMap = {};
            progressList.forEach(p => {
                progressMap[p.lesson_id] = p;
            });

            // Merge lessons with progress
            const lessonsWithProgress = lessons.map(lesson => ({
                ...lesson,
                progress: progressMap[lesson.id] || { status: 'locked' }
            }));

            res.json(lessonsWithProgress);
        } else {
            res.json(lessons);
        }
    } catch (error) {
        console.error('Error fetching educational lessons:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get single lesson details
app.get('/api/educational-lessons/:lessonId', async (req, res) => {
    try {
        const { userId } = req.query;
        const lesson = await db.getEducationalLesson(req.params.lessonId);

        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        if (userId) {
            const progress = await db.getUserLessonProgress(userId, req.params.lessonId);
            lesson.progress = progress || { status: 'locked' };
        }

        res.json(lesson);
    } catch (error) {
        console.error('Error fetching lesson:', error);
        res.status(500).json({ error: error.message });
    }
});



// ==================== MOSQUE CHALLENGES ENDPOINTS ====================
app.get('/api/mosques/:mosqueId/challenges', async (req, res) => {
    try {
        const isAdmin = req.query.admin === 'true';
        const challenges = await db.getMosqueChallenges(req.params.mosqueId, isAdmin);
        res.json(challenges);
    } catch (error) {
        console.error('Error fetching mosque challenges:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/mosques/challenges', async (req, res) => {
    try {
        await db.createMosqueChallenge(req.body);
        res.json({ success: true });
    } catch (error) {
        console.error('Error creating mosque challenge:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/mosques/challenges/:id', async (req, res) => {
    try {
        const challenge = { ...req.body, id: req.params.id };
        await db.updateMosqueChallenge(challenge);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating mosque challenge:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/mosques/challenges/:id', async (req, res) => {
    try {
        await db.deleteMosqueChallenge(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting mosque challenge:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/challenges/:challengeId/attempts', async (req, res) => {
    try {
        const attempts = await db.getChallengeAttempts(req.params.challengeId);
        res.json(attempts);
    } catch (error) {
        console.error('Error fetching challenge attempts:', error);
        res.status(500).json({ error: error.message });
    }
});

// Redundant mosque challenge entry removed (consolidated above)

app.post('/api/challenges/:id/submit', async (req, res) => {
    try {
        await db.submitChallengeAttempt(req.body);
        res.json({ success: true });
    } catch (error) {
        console.error('Error submitting challenge attempt:', error);
        res.status(500).json({ error: error.message });
    }
});

// Check if user participated in a mosque challenge
app.get('/api/challenges/:id/check/:userId', async (req, res) => {
    try {
        const attempt = await db.checkUserParticipation(req.params.id, req.params.userId);
        res.json({ participated: !!attempt, attempt });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get mosque challenge leaderboard
app.get('/api/challenges/:id/leaderboard', async (req, res) => {
    try {
        const leaderboard = await db.getChallengeLeaderboard(req.params.id);
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check if user completed a category
app.get('/api/educational-lessons/completion/:category', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const result = await db.checkCategoryCompletion(userId, req.params.category);
        res.json(result);
    } catch (error) {
        console.error('Error checking completion:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get lesson questions
app.get('/api/educational-lessons/:lessonId/questions', async (req, res) => {
    try {
        const questions = await db.getLessonQuestions(req.params.lessonId);
        res.json(questions);
    } catch (error) {
        console.error('Error fetching lesson questions:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start lesson (mark as in_progress)
app.post('/api/educational-lessons/:lessonId/start', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // Check if lesson is unlocked
        const progress = await db.getUserLessonProgress(userId, req.params.lessonId);

        if (!progress || progress.status === 'locked') {
            return res.status(403).json({ error: 'Lesson is locked' });
        }

        // Update to in_progress
        await db.updateLessonProgress(userId, req.params.lessonId, {
            status: 'in_progress'
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error starting lesson:', error);
        res.status(500).json({ error: error.message });
    }
});

// Submit quiz results
app.post('/api/educational-lessons/:lessonId/submit-quiz', async (req, res) => {
    try {
        const { userId, answers } = req.body;

        if (!userId || !answers) {
            return res.status(400).json({ error: 'userId and answers are required' });
        }

        // Get questions to check answers
        const questions = await db.getLessonQuestions(req.params.lessonId);

        // Calculate score
        let correctCount = 0;
        answers.forEach((answer, index) => {
            if (questions[index] && answer === questions[index].correct_answer) {
                correctCount++;
            }
        });

        const totalQuestions = questions.length;
        const passed = correctCount === totalQuestions; // 100% required

        // Get current progress to increment attempts
        const currentProgress = await db.getUserLessonProgress(userId, req.params.lessonId);
        const attempts = (currentProgress?.quiz_attempts || 0) + 1;

        // Update progress
        const newStatus = passed ? 'completed' : 'in_progress';
        await db.updateLessonProgress(userId, req.params.lessonId, {
            status: newStatus,
            quiz_score: correctCount,
            quiz_total: totalQuestions,
            quiz_attempts: attempts
        });

        // If passed, unlock next lesson
        if (passed) {
            // Award points if not previously completed
            if (!currentProgress || currentProgress.status !== 'completed') {
                await new Promise((resolve, reject) => {
                    db.db.run('UPDATE users SET ranking_score = ranking_score + 10 WHERE id = ?', [userId], (err) => {
                        if (err) console.error('Error updating text ranking score:', err);
                        resolve();
                    });
                });
            }

            const lesson = await db.getEducationalLesson(req.params.lessonId);
            const nextLesson = await db.unlockNextLesson(userId, lesson.order_index);

            res.json({
                success: true,
                passed: true,
                score: correctCount,
                total: totalQuestions,
                nextLessonUnlocked: !!nextLesson,
                nextLesson: nextLesson
            });
        } else {
            res.json({
                success: true,
                passed: false,
                score: correctCount,
                total: totalQuestions,
                attempts: attempts
            });
        }
    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user progress for all lessons
app.get('/api/users/:userId/lesson-progress', async (req, res) => {
    try {
        await db.initializeUserLessonProgress(req.params.userId);
        const progress = await db.getAllUserLessonProgress(req.params.userId);
        res.json(progress);
    } catch (error) {
        console.error('Error fetching user lesson progress:', error);
        res.status(500).json({ error: error.message });
    }
});

// Debug endpoint
app.get('/api/debug/db', async (req, res) => {
    try {
        const users = await db.getAllUsers();
        const tables = await new Promise((resolve, reject) => {
            db.db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(r => r.name));
            });
        });
        res.json({
            userCount: users.length,
            sampleUsers: users.slice(0, 5).map(u => ({ id: u.id, name: u.name, phone: u.phone })),
            tables: tables,
            dbPath: path.join(__dirname, 'data', 'mosqee.db'),
            cwd: process.cwd()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/debug/online-users', (req, res) => {
    res.json({
        onlineCount: onlineUsers.size,
        onlineIds: Array.from(onlineUsers)
    });
});

httpServer.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log('📊 API endpoints ready');
    console.log('🔌 Socket.IO ready');
});
// ==================== EDUCATIONAL LESSONS ENDPOINTS ====================
// Get all lessons with user progress
app.get('/api/educational-lessons', async (req, res) => {
    try {
        const { userId } = req.query;
        const lessons = await db.getAllEducationalLessons();

        if (userId) {
            // Initialize progress for new users
            await db.initializeUserLessonProgress(userId);

            // Get user progress for all lessons
            const progressList = await db.getAllUserLessonProgress(userId);
            const progressMap = {};
            progressList.forEach(p => {
                progressMap[p.lesson_id] = p;
            });

            // Merge lessons with progress
            const lessonsWithProgress = lessons.map(lesson => ({
                ...lesson,
                progress: progressMap[lesson.id] || { status: 'locked' }
            }));

            res.json(lessonsWithProgress);
        } else {
            res.json(lessons);
        }
    } catch (error) {
        console.error('Error fetching educational lessons:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get single lesson details
app.get('/api/educational-lessons/:lessonId', async (req, res) => {
    try {
        const { userId } = req.query;
        const lesson = await db.getEducationalLesson(req.params.lessonId);

        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        if (userId) {
            const progress = await db.getUserLessonProgress(userId, req.params.lessonId);
            lesson.progress = progress || { status: 'locked' };
        }

        res.json(lesson);
    } catch (error) {
        console.error('Error fetching lesson:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get lesson questions
app.get('/api/educational-lessons/:lessonId/questions', async (req, res) => {
    try {
        const questions = await db.getLessonQuestions(req.params.lessonId);
        res.json(questions);
    } catch (error) {
        console.error('Error fetching lesson questions:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start lesson (mark as in_progress)
app.post('/api/educational-lessons/:lessonId/start', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // Check if lesson is unlocked
        const progress = await db.getUserLessonProgress(userId, req.params.lessonId);

        if (!progress || progress.status === 'locked') {
            return res.status(403).json({ error: 'Lesson is locked' });
        }

        // Update to in_progress
        await db.updateLessonProgress(userId, req.params.lessonId, {
            status: 'in_progress'
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error starting lesson:', error);
        res.status(500).json({ error: error.message });
    }
});

// Submit quiz results
app.post('/api/educational-lessons/:lessonId/submit-quiz', async (req, res) => {
    try {
        const { userId, answers } = req.body;

        if (!userId || !answers) {
            return res.status(400).json({ error: 'userId and answers are required' });
        }

        // Get questions to check answers
        const questions = await db.getLessonQuestions(req.params.lessonId);

        // Calculate score
        let correctCount = 0;
        answers.forEach((answer, index) => {
            if (questions[index] && answer === questions[index].correct_answer) {
                correctCount++;
            }
        });

        const totalQuestions = questions.length;
        const passed = correctCount === totalQuestions; // 100% required

        // Get current progress to increment attempts
        const currentProgress = await db.getUserLessonProgress(userId, req.params.lessonId);
        const attempts = (currentProgress?.quiz_attempts || 0) + 1;

        // Update progress
        const newStatus = passed ? 'completed' : 'in_progress';
        await db.updateLessonProgress(userId, req.params.lessonId, {
            status: newStatus,
            quiz_score: correctCount,
            quiz_total: totalQuestions,
            quiz_attempts: attempts
        });

        // If passed, unlock next lesson
        if (passed) {
            const lesson = await db.getEducationalLesson(req.params.lessonId);
            const nextLesson = await db.unlockNextLesson(userId, lesson.order_index);

            res.json({
                success: true,
                passed: true,
                score: correctCount,
                total: totalQuestions,
                nextLessonUnlocked: !!nextLesson,
                nextLesson: nextLesson
            });
        } else {
            res.json({
                success: true,
                passed: false,
                score: correctCount,
                total: totalQuestions,
                attempts: attempts
            });
        }
    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user progress for all lessons
app.get('/api/users/:userId/lesson-progress', async (req, res) => {
    try {
        await db.initializeUserLessonProgress(req.params.userId);
        const progress = await db.getAllUserLessonProgress(req.params.userId);
        res.json(progress);
    } catch (error) {
        console.error('Error fetching user lesson progress:', error);
        res.status(500).json({ error: error.message });
    }
});
