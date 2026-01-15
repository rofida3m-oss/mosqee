import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data', 'mosqee.db');

class Database {
    constructor() {
        this.db = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            // Ensure data directory exists
            const dataDir = path.dirname(DB_PATH);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            this.db = new sqlite3.Database(DB_PATH, async (err) => {
                if (err) reject(err);
                else {
                    await this.createTables();
                    resolve();
                }
            });
        });
    }

    createTables() {
        // First, check and add parent_id column if it doesn't exist
        this.db.all("PRAGMA table_info(post_comments)", (err, columns) => {
            if (!err && columns) {
                const hasParentId = columns.some(col => col.name === 'parent_id');
                if (!hasParentId) {
                    console.log('Adding parent_id column to post_comments table...');
                    this.db.run("ALTER TABLE post_comments ADD COLUMN parent_id TEXT DEFAULT NULL", (alterErr) => {
                        if (alterErr) {
                            console.error('Failed to add parent_id column:', alterErr);
                        } else {
                            console.log('✅ Successfully added parent_id column to post_comments');
                        }
                    });
                }
            }
        });

        // Defined later in the function to ensure order


        // Check and add type column to challenges
        this.db.all("PRAGMA table_info(challenges)", (err, columns) => {
            if (!err && columns) {
                const hasType = columns.some(col => col.name === 'type');
                if (!hasType) {
                    console.log('Adding type column to challenges table...');
                    this.db.run("ALTER TABLE challenges ADD COLUMN type TEXT DEFAULT 'async'", (err) => {
                        if (!err) console.log('✅ Successfully added type column to challenges');
                    });
                }
            }
        });

        const tables = [
            `CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT NOT NULL UNIQUE,
                role TEXT NOT NULL,
                is_active INTEGER DEFAULT 1,
                location_lat REAL,
                location_lng REAL,
                following_mosques TEXT DEFAULT '[]',
                registered_lessons TEXT DEFAULT '[]',
                managed_mosque_id TEXT,
                preferences TEXT DEFAULT '{}',
                ranking_score INTEGER DEFAULT 10,
                winning_streak INTEGER DEFAULT 0,
                max_streak INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            `CREATE TABLE IF NOT EXISTS mosques (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                imam_name TEXT NOT NULL,
                address TEXT NOT NULL,
                phone TEXT,
                location_lat REAL,
                location_lng REAL,
                image TEXT,
                followers_count INTEGER DEFAULT 0,
                amenities TEXT DEFAULT '[]',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            `CREATE TABLE IF NOT EXISTS lessons (
                id TEXT PRIMARY KEY,
                mosque_id TEXT NOT NULL,
                title TEXT NOT NULL,
                sheikh_name TEXT NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                type TEXT NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (mosque_id) REFERENCES mosques(id)
            )`,

            `CREATE TABLE IF NOT EXISTS posts (
                id TEXT PRIMARY KEY,
                mosque_id TEXT NOT NULL,
                content TEXT NOT NULL,
                image TEXT,
                video_url TEXT,
                likes INTEGER DEFAULT 0,
                comments TEXT DEFAULT '[]',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                type TEXT,
                FOREIGN KEY (mosque_id) REFERENCES mosques(id)
            )`,

            `CREATE TABLE IF NOT EXISTS tickets (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                user_name TEXT NOT NULL,
                subject TEXT NOT NULL,
                message TEXT NOT NULL,
                reply TEXT,
                status TEXT DEFAULT 'open',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,

            `CREATE TABLE IF NOT EXISTS prayer_logs (
                user_id TEXT NOT NULL,
                date TEXT NOT NULL,
                fajr INTEGER DEFAULT 0,
                dhuhr INTEGER DEFAULT 0,
                asr INTEGER DEFAULT 0,
                maghrib INTEGER DEFAULT 0,
                isha INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, date),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,

            `CREATE TABLE IF NOT EXISTS khatmas (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                completed_parts TEXT DEFAULT '[]',
                participants TEXT DEFAULT '[]',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            `CREATE TABLE IF NOT EXISTS athkar_logs (
                user_id TEXT NOT NULL,
                category TEXT NOT NULL,
                progress TEXT DEFAULT '{}',
                date TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, category, date),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,

            `CREATE TABLE IF NOT EXISTS tasbih_logs (
                user_id TEXT NOT NULL,
                phrase TEXT NOT NULL,
                count INTEGER DEFAULT 0,
                lifetime_count INTEGER DEFAULT 0,
                date TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, phrase, date),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,

            `CREATE TABLE IF NOT EXISTS post_likes (
                id TEXT PRIMARY KEY,
                post_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (post_id) REFERENCES posts(id),
                FOREIGN KEY (user_id) REFERENCES users(id),
                UNIQUE(post_id, user_id)
            )`,

            `CREATE TABLE IF NOT EXISTS post_shares (
                id TEXT PRIMARY KEY,
                post_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                shared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (post_id) REFERENCES posts(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,

            `CREATE TABLE IF NOT EXISTS post_comments (
                id TEXT PRIMARY KEY,
                post_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                user_name TEXT NOT NULL,
                content TEXT NOT NULL,
                likes INTEGER DEFAULT 0,
                parent_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (parent_id) REFERENCES post_comments(id) ON DELETE CASCADE
            )`,

            `CREATE TABLE IF NOT EXISTS post_favorites (
                id TEXT PRIMARY KEY,
                post_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(post_id, user_id),
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,

            `CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                from_user_id TEXT,
                type TEXT NOT NULL,
                post_id TEXT,
                content TEXT,
                is_read INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (from_user_id) REFERENCES users(id),
                FOREIGN KEY (post_id) REFERENCES posts(id)
            )`,

            `CREATE TABLE IF NOT EXISTS assistant_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                query TEXT NOT NULL,
                source TEXT NOT NULL,
                snippet TEXT,
                success INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,

            `CREATE TABLE IF NOT EXISTS user_khatmas (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                owner_id TEXT NOT NULL,
                name TEXT,
                participants TEXT DEFAULT '[]',
                current_juz INTEGER DEFAULT 0,
                completed_parts TEXT DEFAULT '[]',
                start_date DATETIME,
                end_date DATETIME,
                status TEXT DEFAULT 'ongoing',
                last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_reminder_at DATETIME,
                FOREIGN KEY (owner_id) REFERENCES users(id)
            )`,

            `CREATE TABLE IF NOT EXISTS follows (
                follower_id TEXT NOT NULL,
                following_id TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (follower_id, following_id),
                FOREIGN KEY (follower_id) REFERENCES users(id),
                FOREIGN KEY (following_id) REFERENCES users(id)
            )`,

            `CREATE TABLE IF NOT EXISTS khatma_history (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                khatma_id TEXT NOT NULL,
                type TEXT NOT NULL,
                duration_days INTEGER DEFAULT 0,
                completion_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (khatma_id) REFERENCES user_khatmas(id)
            )`,

            `CREATE TABLE IF NOT EXISTS tasbih_goals (
                user_id TEXT PRIMARY KEY,
                daily_goal INTEGER DEFAULT 100,
                streak_days INTEGER DEFAULT 0,
                total_lifetime_count INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,

            `CREATE TABLE IF NOT EXISTS religious_questions (
                id TEXT PRIMARY KEY,
                text TEXT NOT NULL,
                options TEXT NOT NULL,
                correct_index INTEGER NOT NULL,
                explanation TEXT,
                category TEXT DEFAULT 'general'
            )`,

            `CREATE TABLE IF NOT EXISTS challenges (
                id TEXT PRIMARY KEY,
                challenger_id TEXT NOT NULL,
                opponent_id TEXT NOT NULL,
                status TEXT DEFAULT 'pending', -- pending, accepted, completed, tie_breaker
                type TEXT DEFAULT 'async', -- async, live
                question_ids TEXT NOT NULL,
                challenger_score INTEGER DEFAULT 0,
                opponent_score INTEGER DEFAULT 0,
                completed_by TEXT DEFAULT '[]', -- list of user IDs who finished
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (challenger_id) REFERENCES users(id),
                FOREIGN KEY (opponent_id) REFERENCES users(id)
            )`,

            // Educational Lessons System
            `CREATE TABLE IF NOT EXISTS educational_lessons (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                category TEXT NOT NULL CHECK(category IN ('hadith', 'quran')),
                order_index INTEGER NOT NULL,
                duration_minutes INTEGER DEFAULT 15,
                hadith_text TEXT,
                hadith_narrator TEXT,
                hadith_explanation TEXT,
                hadith_lessons TEXT,
                quran_verses TEXT,
                quran_surah TEXT,
                quran_verse_numbers TEXT,
                quran_word_meanings TEXT,
                quran_tafseer TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            `CREATE TABLE IF NOT EXISTS lesson_questions (
                id TEXT PRIMARY KEY,
                lesson_id TEXT NOT NULL,
                question_text TEXT NOT NULL,
                options TEXT NOT NULL,
                correct_answer INTEGER NOT NULL,
                explanation TEXT,
                order_index INTEGER NOT NULL,
                FOREIGN KEY (lesson_id) REFERENCES educational_lessons(id) ON DELETE CASCADE
            )`,

            `CREATE TABLE IF NOT EXISTS user_lesson_progress (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                lesson_id TEXT NOT NULL,
                status TEXT DEFAULT 'locked' CHECK(status IN ('locked', 'unlocked', 'in_progress', 'completed')),
                quiz_score INTEGER DEFAULT 0,
                quiz_total INTEGER DEFAULT 0,
                quiz_attempts INTEGER DEFAULT 0,
                completed_at DATETIME,
                last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, lesson_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (lesson_id) REFERENCES educational_lessons(id) ON DELETE CASCADE
            )`,

            // Indexes for performance
            `CREATE INDEX IF NOT EXISTS idx_posts_mosque_id ON posts(mosque_id)`,
            `CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)`,
            `CREATE INDEX IF NOT EXISTS idx_lessons_mosque_id ON lessons(mosque_id)`,
            `CREATE INDEX IF NOT EXISTS idx_lessons_date ON lessons(date DESC)`,
            `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_athkar_logs_lookup ON athkar_logs(user_id, date, category)`,
            `CREATE INDEX IF NOT EXISTS idx_user_khatmas_owner ON user_khatmas(owner_id)`,
            `CREATE INDEX IF NOT EXISTS idx_educational_lessons_category ON educational_lessons(category, order_index)`,
            `CREATE INDEX IF NOT EXISTS idx_lesson_questions_lesson ON lesson_questions(lesson_id, order_index)`,
            `CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user ON user_lesson_progress(user_id, lesson_id)`
        ];

        const seedQuestions = [
            { id: 'q1', text: 'ما هي أطول سورة في القرآن الكريم؟', options: JSON.stringify(['سورة آل عمران', 'سورة البقرة', 'سورة النساء', 'سورة المائدة']), correct_index: 1, category: 'quran' },
            { id: 'q2', text: 'من هو النبي الذي لُقب بـ "كليم الله"؟', options: JSON.stringify(['إبراهيم عليه السلام', 'عيسى عليه السلام', 'موسى عليه السلام', 'محمد صلى الله عليه وسلم']), correct_index: 2, category: 'prophets' },
            { id: 'q3', text: 'كم عدد أركان الإسلام؟', options: JSON.stringify(['3 أركان', '4 أركان', '5 أركان', '6 أركان']), correct_index: 2, category: 'fiqh' },
            { id: 'q4', text: 'في أي شهر نزل القرآن الكريم؟', options: JSON.stringify(['رجب', 'شعبان', 'رمضان', 'ذو الحجة']), correct_index: 2, category: 'quran' },
            { id: 'q5', text: 'ما هو اسم أول مؤذن في الإسلام؟', options: JSON.stringify(['أبو بكر الصديق', 'عمر بن الخطاب', 'بلال بن رباح', 'عثمان بن عفان']), correct_index: 2, category: 'history' },
            { id: 'q6', text: 'ما هي أقصر سورة في القرآن الكريم؟', options: JSON.stringify(['سورة الإخلاص', 'سورة الفلق', 'سورة الناس', 'سورة الكوثر']), correct_index: 3, category: 'quran' },
            { id: 'q7', text: 'من هي أول امرأة آمنت برسالة النبي صلى الله عليه وسلم؟', options: JSON.stringify(['عائشة بنت أبي بكر', 'فاطمة الزهراء', 'خديجة بنت خويلد', 'أم سلمة']), correct_index: 2, category: 'history' },
            { id: 'q8', text: 'كم عدد سور القرآن الكريم؟', options: JSON.stringify(['110 سورة', '114 سورة', '120 سورة', '100 سورة']), correct_index: 1, category: 'quran' },
            { id: 'q9', text: 'ما هي السورة التي عُرفت بـ "عروس القرآن"؟', options: JSON.stringify(['سورة يس', 'سورة الرحمن', 'سورة الملك', 'سورة الواقعة']), correct_index: 1, category: 'quran' },
            { id: 'q10', text: 'من هو النبي الذي ابتلعه الحوت؟', options: JSON.stringify(['يونس عليه السلام', 'أيوب عليه السلام', 'نوح عليه السلام', 'داود عليه السلام']), correct_index: 0, category: 'prophets' },
            { id: 'q11', text: 'ما هي الصلاة التي يركع فيها المصلي أربع مرات ويسجد أربع مرات؟', options: JSON.stringify(['صلاة العيد', 'صلاة الجنازة', 'صلاة الكسوف', 'صلاة الضحى']), correct_index: 2, category: 'fiqh' },
            { id: 'q12', text: 'كم سنة مكث النبي صلى الله عليه وسلم في مكة يدعو إلى الله؟', options: JSON.stringify(['10 سنوات', '13 سنة', '23 سنة', '40 سنة']), correct_index: 1, category: 'history' },
            { id: 'q13', text: 'من هو الصحابي الذي اهتز العرش لموته؟', options: JSON.stringify(['سعد بن معاذ', 'حمزة بن عبد المطلب', 'عمر بن الخطاب', 'علي بن أبي طالب']), correct_index: 0, category: 'history' },
            { id: 'q14', text: 'ما هو "اليم" الذي ألقي فيه سيدنا موسى عليه السلام؟', options: JSON.stringify(['نهر النيل', 'نهر دجلة', 'نهر الفرات', 'البحر الأحمر']), correct_index: 0, category: 'prophets' },
            { id: 'q15', text: 'ما هي السورة التي لا تبدأ بـ "بسم الله الرحمن الرحيم"؟', options: JSON.stringify(['سورة التوبة', 'سورة الأنفال', 'سورة يونس', 'سورة هود']), correct_index: 0, category: 'quran' },
            { id: 'q16', text: 'من هو النبي الذي بنى الكعبة مع ابنه إسماعيل؟', options: JSON.stringify(['نوح عليه السلام', 'إبراهيم عليه السلام', 'صالح عليه السلام', 'لوط عليه السلام']), correct_index: 1, category: 'prophets' },
            { id: 'q17', text: 'في أي مدينة ولد النبي صلى الله عليه وسلم؟', options: JSON.stringify(['المدينة المنورة', 'الطائف', 'مكة المكرمة', 'خيبر']), correct_index: 2, category: 'history' },
            { id: 'q18', text: 'ما هي السورة التي تعدل ثلث القرآن؟', options: JSON.stringify(['سورة الفاتحة', 'سورة الإخلاص', 'سورة الكرسي', 'سورة يس']), correct_index: 1, category: 'quran' },
            { id: 'q19', text: 'كم عدد السموات التي ذكرت في القرآن؟', options: JSON.stringify(['3', '5', '7', '9']), correct_index: 2, category: 'quran' },
            { id: 'q20', text: 'من هو النبي الذي ألان الله له الحديد؟', options: JSON.stringify(['سليمان عليه السلام', 'داود عليه السلام', 'يوسف عليه السلام', 'زكريا عليه السلام']), correct_index: 1, category: 'prophets' },
            { id: 'q21', text: 'ما هي أول صلاة فرضت في الإسلام؟', options: JSON.stringify(['صلاة الفجر', 'صلاة الظهر', 'صلاة العشاء', 'صلاة العصر']), correct_index: 1, category: 'fiqh' },
            { id: 'q22', text: 'من هو النبي الذي صبر على المرض؟', options: JSON.stringify(['أيوب عليه السلام', 'شعيب عليه السلام', 'هارون عليه السلام', 'موسى عليه السلام']), correct_index: 0, category: 'prophets' },
            { id: 'q23', text: 'ما هي أطول آية في القرآن الكريم؟', options: JSON.stringify(['آية الكرسي', 'آية الدين', 'آية المداينة', 'آية الربا']), correct_index: 1, category: 'quran' },
            { id: 'q24', text: 'في أي غزوة جُرح النبي صلى الله عليه وسلم وكسرت رباعيته؟', options: JSON.stringify(['غزوة بدر', 'غزوة أحد', 'غزوة الخندق', 'غزوة حنين']), correct_index: 1, category: 'history' },
            { id: 'q25', text: 'من هو الصحابي الملقب بـ "سيف الله المسلول"؟', options: JSON.stringify(['خالد بن الوليد', 'الزبير بن العوام', 'طلحة بن عبيد الله', 'ضرار بن الأزور']), correct_index: 0, category: 'history' },
            { id: 'q26', text: 'كم عدد الركعات في صلاة الفجر؟', options: JSON.stringify(['ركعة واحدة', 'ركعتان', 'ثلاث ركعات', 'أربع ركعات']), correct_index: 1, category: 'fiqh' },
            { id: 'q27', text: 'من هو النبي الذي بعثه الله إلى قوم ثمود؟', options: JSON.stringify(['هود عليه السلام', 'صالح عليه السلام', 'شعيب عليه السلام', 'يحيى عليه السلام']), correct_index: 1, category: 'prophets' },
            { id: 'q28', text: 'ما هي عاصمة الدولة الإسلامية في عهد الخلفاء الراشدين؟', options: JSON.stringify(['دمشق', 'بغداد', 'المدينة المنورة', 'القاهرة']), correct_index: 2, category: 'history' },
            { id: 'q29', text: 'ما اسم زوجة فرعون التي آمنت بموسى؟', options: JSON.stringify(['هاجر', 'سارة', 'آسية', 'ماريا']), correct_index: 2, category: 'history' },
            { id: 'q30', text: 'من هو النبي الذي كان يعمل نجارا؟', options: JSON.stringify(['نوح عليه السلام', 'داود عليه السلام', 'زكريا عليه السلام', 'إلياس عليه السلام']), correct_index: 2, category: 'prophets' },
            { id: 'q31', text: 'ما هي أول قبلة للمسلمين؟', options: JSON.stringify(['الكعبة المشرفة', 'المسجد الأقصى', 'المسجد النبوي', 'مسجد قباء']), correct_index: 1, category: 'fiqh' },
            { id: 'q32', text: 'كم عدد أجزاء القرآن الكريم؟', options: JSON.stringify(['20 جزء', '30 جزء', '40 جزء', '60 جزء']), correct_index: 1, category: 'quran' },
            { id: 'q33', text: 'من هو النبي الذي سخر الله له الريح؟', options: JSON.stringify(['سليمان عليه السلام', 'عيسى عليه السلام', 'إسماعيل عليه السلام', 'يوسف عليه السلام']), correct_index: 0, category: 'prophets' },
            { id: 'q34', text: 'ما هي الغزوة التي هُزم فيها المسلمون في بدايتها ثم انتصروا؟', options: JSON.stringify(['غزوة خيبر', 'غزوة تبوك', 'غزوة حنين', 'غزوة مؤتة']), correct_index: 2, category: 'history' },
            { id: 'q35', text: 'أي سورة تسمى "قلب القرآن"؟', options: JSON.stringify(['سورة البقرة', 'سورة يس', 'سورة تبارك', 'سورة الكهف']), correct_index: 1, category: 'quran' },
            { id: 'q36', text: 'ما هو فرض العين؟', options: JSON.stringify(['ما يجب على كل مسلم فعله', 'ما يجب على بعض المسلمين فعله', 'ما يفضل فعله', 'ما يحرم فعله']), correct_index: 0, category: 'fiqh' },
            { id: 'q37', text: 'من هو النبي الذي أرسل إلى قوم عاد؟', options: JSON.stringify(['هود عليه السلام', 'لوط عليه السلام', 'شعيب عليه السلام', 'آدم عليه السلام']), correct_index: 0, category: 'prophets' },
            { id: 'q38', text: 'ما اسم الغار الذي كان يتعبد فيه النبي صلى الله عليه وسلم؟', options: JSON.stringify(['غار ثور', 'غار حراء', 'غار الرحمة', 'غار الصفا']), correct_index: 1, category: 'history' },
            { id: 'q39', text: 'كم عدد ركعات صلاة المغرب؟', options: JSON.stringify(['2', '3', '4', '5']), correct_index: 1, category: 'fiqh' },
            { id: 'q40', text: 'من هو النبي الذي لقب بـ "ذو النون"؟', options: JSON.stringify(['يونس عليه السلام', 'موسى عليه السلام', 'يوسف عليه السلام', 'داود عليه السلام']), correct_index: 0, category: 'prophets' }
        ];

        tables.forEach(table => {
            this.db.run(table, (err) => {
                if (err && !err.message.includes('already exists')) {
                    console.error('Error creating table:', err);
                }
            });
        });

        // Ensure columns exist (Migration logic)
        // We run these generically to handle both fresh installs and updates
        const runMigration = (sql) => {
            this.db.run(sql, (err) => {
                // Ignore "duplicate column" errors, report others
                if (err && !err.message.includes('duplicate column')) {
                    console.log('[Migration] Note:', err.message);
                }
            });
        };

        // Run migrations for missing columns
        runMigration("ALTER TABLE religious_questions ADD COLUMN category TEXT DEFAULT 'general'");
        runMigration("ALTER TABLE challenges ADD COLUMN type TEXT DEFAULT 'async'");
        runMigration("ALTER TABLE users ADD COLUMN ranking_score INTEGER DEFAULT 10");
        runMigration("ALTER TABLE users ADD COLUMN winning_streak INTEGER DEFAULT 0");
        runMigration("ALTER TABLE users ADD COLUMN max_streak INTEGER DEFAULT 0");
        runMigration("ALTER TABLE posts ADD COLUMN visibility TEXT DEFAULT 'public'"); // public, followers

        // Create new tables for Mosque Challenges if they don't exist
        const newTables = [
            `CREATE TABLE IF NOT EXISTS mosque_challenges (
                id TEXT PRIMARY KEY,
                mosque_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                start_date DATETIME NOT NULL,
                end_date DATETIME NOT NULL,
                is_active INTEGER DEFAULT 1,
                visibility TEXT DEFAULT 'public', -- public, followers
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (mosque_id) REFERENCES mosques(id)
            )`,
            `CREATE TABLE IF NOT EXISTS mosque_challenge_questions (
                id TEXT PRIMARY KEY,
                challenge_id TEXT NOT NULL,
                question_text TEXT NOT NULL,
                options TEXT NOT NULL, -- JSON array of strings
                correct_answer INTEGER NOT NULL, -- index of correct option
                explanation TEXT,
                order_index INTEGER NOT NULL,
                FOREIGN KEY (challenge_id) REFERENCES mosque_challenges(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS user_mosque_challenge_attempts (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                challenge_id TEXT NOT NULL,
                score INTEGER NOT NULL,
                total_questions INTEGER NOT NULL,
                answers TEXT NOT NULL, -- JSON object {questionId: selectedOptionIndex}
                submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (challenge_id) REFERENCES mosque_challenges(id)
            )`
        ];

        newTables.forEach(table => {
            this.db.run(table, (err) => {
                if (err && !err.message.includes('already exists')) {
                    console.error('Error creating new table:', err);
                }
            });
        });

        // Ensure columns exist in user_khatmas (for existing DBs)
        const checkColumns = () => {
            // ... existing logic ...
            this.db.all("PRAGMA table_info(user_khatmas)", (err, rows) => {
                if (err) return;
                const columns = rows.map(r => r.name);
                if (!columns.includes('last_read_at')) {
                    this.db.run("ALTER TABLE user_khatmas ADD COLUMN last_read_at DATETIME", () => {
                        this.db.run("UPDATE user_khatmas SET last_read_at = CURRENT_TIMESTAMP WHERE last_read_at IS NULL");
                    });
                }
                if (!columns.includes('last_reminder_at')) {
                    this.db.run("ALTER TABLE user_khatmas ADD COLUMN last_reminder_at DATETIME");
                }
            });
        };
        checkColumns();

        // Seed questions
        seedQuestions.forEach(q => {
            this.db.run(`INSERT OR IGNORE INTO religious_questions (id, text, options, correct_index, category) VALUES (?, ?, ?, ?, ?)`,
                [q.id, q.text, q.options, q.correct_index, q.category]);
        });

        // Seed educational lessons
        this.seedEducationalLessons();
    }

    seedEducationalLessons() {
        // Load sample lessons from JSON file
        const lessonsPath = path.join(__dirname, 'data', 'sample_lessons.json');

        if (!fs.existsSync(lessonsPath)) {
            console.log('⚠️ Sample lessons file not found, skipping lesson seeding');
            return;
        }

        try {
            const lessonsData = JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));

            lessonsData.forEach(lesson => {
                // Insert or replace lesson to ensure updates are applied
                this.db.run(`INSERT OR REPLACE INTO educational_lessons (
                    id, title, description, category, order_index, duration_minutes,
                    hadith_text, hadith_narrator, hadith_explanation, hadith_lessons,
                    quran_verses, quran_surah, quran_verse_numbers, quran_word_meanings, quran_tafseer
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        lesson.id,
                        lesson.title,
                        lesson.description,
                        lesson.category,
                        lesson.order_index,
                        lesson.duration_minutes,
                        lesson.hadith_text || null,
                        lesson.hadith_narrator || null,
                        lesson.hadith_explanation || null,
                        lesson.hadith_lessons || null,
                        lesson.quran_verses || null,
                        lesson.quran_surah || null,
                        lesson.quran_verse_numbers || null,
                        lesson.quran_word_meanings || null,
                        lesson.quran_tafseer || null
                    ], (err) => {
                        if (err && !err.message.includes('UNIQUE constraint')) {
                            console.error('Error seeding lesson:', lesson.id, err);
                        }
                    });

                // Insert questions for this lesson
                if (lesson.questions && lesson.questions.length > 0) {
                    lesson.questions.forEach((q, idx) => {
                        this.db.run(`INSERT OR REPLACE INTO lesson_questions (
                            id, lesson_id, question_text, options, correct_answer, explanation, order_index
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [
                                q.id,
                                lesson.id,
                                q.question_text,
                                JSON.stringify(q.options),
                                q.correct_answer,
                                q.explanation,
                                q.order_index !== undefined ? q.order_index : idx
                            ], (err) => {
                                if (err && !err.message.includes('UNIQUE constraint')) {
                                    console.error('Error seeding question:', q.id, err);
                                }
                            });
                    });
                }
            });

            console.log('✅ Educational lessons seeded successfully');
        } catch (error) {
            console.error('Error loading sample lessons:', error);
        }
    }

    // Users
    addUser(user) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO users (id, name, phone, role, managed_mosque_id, location_lat, location_lng, preferences, ranking_score)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            this.db.run(sql, [
                user.id, user.name, user.phone, user.role,
                user.managedMosqueId || null,
                user.location?.lat || 30.0444, user.location?.lng || 31.2357,
                user.preferences ? JSON.stringify(user.preferences) : '{}',
                user.rankingScore || 10
            ], function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
        });
    }

    getUserByPhone(phone) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM users WHERE phone = ?`;
            this.db.get(sql, [phone], (err, row) => {
                if (err) reject(err);
                else resolve(row ? this.formatUser(row) : null);
            });
        });
    }

    getUser(id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM users WHERE id = ?`;
            this.db.get(sql, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row ? this.formatUser(row) : null);
            });
        });
    }

    updateUser(user) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE users SET name=?, role=?, managed_mosque_id=?, is_active=?, location_lat=?, location_lng=?, 
                         following_mosques=?, registered_lessons=?, preferences=? WHERE id=?`;
            this.db.run(sql, [
                user.name, user.role, user.managedMosqueId || null, user.isActive ? 1 : 0,
                user.location?.lat || 30.0444, user.location?.lng || 31.2357,
                JSON.stringify(user.followingMosques || []),
                JSON.stringify(user.registeredLessons || []),
                JSON.stringify(user.preferences || {}),
                user.id
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    getAllUsers() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM users`;
            this.db.all(sql, (err, rows) => {
                if (err) reject(err);
                else resolve(rows ? rows.map(r => this.formatUser(r)) : []);
            });
        });
    }

    formatUser(row) {
        return {
            id: row.id,
            name: row.name,
            phone: row.phone,
            role: row.role,
            isActive: row.is_active === 1,
            location: { lat: row.location_lat, lng: row.location_lng },
            followingMosques: JSON.parse(row.following_mosques || '[]'),
            registeredLessons: JSON.parse(row.registered_lessons || '[]'),
            managedMosqueId: row.managed_mosque_id,
            rankingScore: row.ranking_score !== null && row.ranking_score !== undefined ? row.ranking_score : 10,
            winningStreak: row.winning_streak || 0,
            maxStreak: row.max_streak || 0
        };
    }

    updateUserScore(userId, change) {
        return new Promise((resolve, reject) => {
            const isWin = change > 0;
            const isLoss = change < 0;

            let sql = "";
            let params = [];

            if (isWin) {
                // Increment score and streak
                sql = `UPDATE users 
                       SET ranking_score = COALESCE(ranking_score, 10) + ?,
                           winning_streak = COALESCE(winning_streak, 0) + 1,
                           max_streak = MAX(COALESCE(max_streak, 0), COALESCE(winning_streak, 0) + 1)
                       WHERE id = ?`;
                params = [change, userId];
            } else if (isLoss) {
                // Decrement score (min 0) and RESET streak
                sql = `UPDATE users 
                       SET ranking_score = CASE 
                            WHEN COALESCE(ranking_score, 10) + ? < 0 THEN 0 
                            ELSE COALESCE(ranking_score, 10) + ? 
                         END,
                         winning_streak = 0
                       WHERE id = ?`;
                params = [change, change, userId];
            } else {
                // No change, just skip
                return resolve();
            }

            this.db.run(sql, params, (err) => {
                if (err) {
                    console.error(`[DB] Error updating user score for ${userId}:`, err, { userId, change });
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    // Mosques
    addMosque(mosque) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO mosques (id, name, imam_name, address, phone, location_lat, location_lng, image, amenities)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            this.db.run(sql, [
                mosque.id, mosque.name, mosque.imamName, mosque.address, mosque.phone,
                mosque.location.lat, mosque.location.lng, mosque.image,
                JSON.stringify(mosque.amenities || [])
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    getMosques() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM mosques`;
            this.db.all(sql, (err, rows) => {
                if (err) reject(err);
                else resolve(rows ? rows.map(r => this.formatMosque(r)) : []);
            });
        });
    }

    getMosqueById(id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM mosques WHERE id = ?`;
            this.db.get(sql, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row ? this.formatMosque(row) : null);
            });
        });
    }

    updateMosque(mosque) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE mosques SET name=?, imam_name=?, address=?, phone=?, location_lat=?, location_lng=?, image=?, followers_count=?, amenities=? WHERE id=?`;
            this.db.run(sql, [
                mosque.name, mosque.imamName, mosque.address, mosque.phone,
                mosque.location.lat, mosque.location.lng, mosque.image, mosque.followersCount,
                JSON.stringify(mosque.amenities || []), mosque.id
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    formatMosque(row) {
        return {
            id: row.id,
            name: row.name,
            imamName: row.imam_name,
            address: row.address,
            phone: row.phone,
            location: { lat: row.location_lat, lng: row.location_lng },
            image: row.image && row.image.trim() !== '' ? row.image : '/imagemosqee.jfif',
            followersCount: row.followers_count,
            amenities: JSON.parse(row.amenities || '[]')
        };
    }

    // Lessons
    addLesson(lesson) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO lessons (id, mosque_id, title, sheikh_name, date, time, type, description)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            this.db.run(sql, [
                lesson.id, lesson.mosqueId, lesson.title, lesson.sheikhName,
                lesson.date, lesson.time, lesson.type, lesson.description
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    getLessons() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM lessons ORDER BY date DESC`;
            this.db.all(sql, (err, rows) => {
                if (err) reject(err);
                else resolve(rows ? rows.map(r => this.formatLesson(r)) : []);
            });
        });
    }

    formatLesson(row) {
        return {
            id: row.id,
            mosqueId: row.mosque_id,
            title: row.title,
            sheikhName: row.sheikh_name,
            date: row.date,
            time: row.time,
            type: row.type,
            description: row.description
        };
    }

    // Posts
    addPost(post) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO posts (id, mosque_id, content, image, video_url, likes, comments, created_at, type, visibility)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            this.db.run(sql, [
                post.id, post.mosqueId, post.content, post.image || '', post.videoUrl || '',
                post.likes || 0, JSON.stringify(post.comments || []), post.createdAt, post.type,
                post.visibility || 'public'
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    getPosts(userId) {
        return new Promise((resolve, reject) => {
            let sql = `SELECT * FROM posts WHERE visibility = 'public' ORDER BY created_at DESC`;
            let params = [];

            if (userId) {
                sql = `
                    SELECT p.* 
                    FROM posts p
                    WHERE p.visibility = 'public' 
                       OR (p.visibility = 'followers' AND p.mosque_id IN (SELECT following_id FROM follows WHERE follower_id = ?))
                       OR (p.mosque_id IN (SELECT managed_mosque_id FROM users WHERE id = ?)) -- Managed mosque posts always visible to manager
                    ORDER BY p.created_at DESC
                `;
                params = [userId, userId];
            }

            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows ? rows.map(r => this.formatPost(r)) : []);
            });
        });
    }

    getPost(id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM posts WHERE id = ?`;
            this.db.get(sql, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row ? this.formatPost(row) : null);
            });
        });
    }

    updatePost(post) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE posts SET content=?, image=?, video_url=?, likes=?, comments=?, type=? WHERE id=?`;
            this.db.run(sql, [
                post.content, post.image || '', post.videoUrl || '', post.likes || 0,
                JSON.stringify(post.comments || []), post.type, post.id
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    formatPost(row) {
        return {
            id: row.id,
            mosqueId: row.mosque_id,
            content: row.content,
            image: row.image || undefined,
            videoUrl: row.video_url || undefined,
            likes: row.likes,
            comments: JSON.parse(row.comments || '[]'),
            createdAt: row.created_at,
            type: row.type,
            visibility: row.visibility || 'public'
        };
    }

    // Prayer Logs
    savePrayerLog(log) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT OR REPLACE INTO prayer_logs (user_id, date, fajr, dhuhr, asr, maghrib, isha)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`;
            this.db.run(sql, [
                log.userId, log.date, log.fajr ? 1 : 0, log.dhuhr ? 1 : 0,
                log.asr ? 1 : 0, log.maghrib ? 1 : 0, log.isha ? 1 : 0
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    getPrayerLog(userId, date) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM prayer_logs WHERE user_id = ? AND date = ?`;
            this.db.get(sql, [userId, date], (err, row) => {
                if (err) reject(err);
                else resolve(row ? this.formatPrayerLog(row) : null);
            });
        });
    }

    formatPrayerLog(row) {
        return {
            userId: row.user_id,
            date: row.date,
            fajr: row.fajr === 1,
            dhuhr: row.dhuhr === 1,
            asr: row.asr === 1,
            maghrib: row.maghrib === 1,
            isha: row.isha === 1
        };
    }

    // Tasbih Logs

    getTasbihLog(userId, date) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM tasbih_logs WHERE user_id = ? AND date = ?`;
            this.db.get(sql, [userId, date], (err, row) => {
                if (err) reject(err);
                else resolve(row ? {
                    userId: row.user_id,
                    phrase: row.phrase,
                    count: row.count,
                    lifetimeCount: row.lifetime_count,
                    date: row.date
                } : null);
            });
        });
    }

    getTotalTasbihCount(userId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT SUM(lifetime_count) as total FROM tasbih_logs WHERE user_id = ?`;
            this.db.get(sql, [userId], (err, row) => {
                if (err) reject(err);
                else resolve(row?.total || 0);
            });
        });
    }

    // Khatma
    getKhatma() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM khatmas LIMIT 1`;
            this.db.get(sql, (err, row) => {
                if (err) reject(err);
                else if (row) {
                    resolve({
                        id: row.id,
                        title: row.title,
                        completedParts: JSON.parse(row.completed_parts || '[]'),
                        participants: JSON.parse(row.participants || '[]')
                    });
                } else {
                    // Seed a default khatma entry if none exists
                    const defaultId = 'khatma_1';
                    const defaultTitle = 'الختمة الشهرية العامة';
                    const insertSql = `INSERT INTO khatmas (id, title, completed_parts, participants) VALUES (?, ?, ?, ?)`;
                    this.db.run(insertSql, [defaultId, defaultTitle, JSON.stringify([]), JSON.stringify([])], (insErr) => {
                        if (insErr) {
                            console.error('getKhatma insert error:', insErr);
                            reject(insErr);
                        } else {
                            resolve({ id: defaultId, title: defaultTitle, completedParts: [], participants: [] });
                        }
                    });
                }
            });
        });
    }

    updateKhatma(khatma) {
        return new Promise((resolve, reject) => {
            if (!khatma || !khatma.id) {
                console.error('updateKhatma called with invalid payload:', khatma);
                return reject(new Error('Invalid khatma payload'));
            }

            const sql = `UPDATE khatmas SET completed_parts = ?, participants = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
            const parts = JSON.stringify(khatma.completedParts);
            const participants = JSON.stringify(khatma.participants);

            console.log('DB updateKhatma - executing:', { id: khatma.id, parts, participants });

            this.db.run(sql, [
                parts,
                participants,
                khatma.id
            ], (err) => {
                if (err) {
                    console.error('DB updateKhatma error:', err);
                    return reject(err);
                } else {
                    // Fetch and log the persisted row to verify storage
                    const sel = `SELECT * FROM khatmas WHERE id = ?`;
                    this.db.get(sel, [khatma.id], (getErr, row) => {
                        if (getErr) {
                            console.error('DB select after update error:', getErr);
                            return resolve();
                        }

                        try {
                            const persisted = {
                                id: row.id,
                                title: row.title,
                                completedParts: JSON.parse(row.completed_parts || '[]'),
                                participants: JSON.parse(row.participants || '[]')
                            };
                            console.log('DB persisted khatma after update:', persisted);
                        } catch (parseErr) {
                            console.error('Error parsing persisted khatma:', parseErr);
                        }

                        return resolve();
                    });
                }
            });
        });
    }

    // Athkar Logs
    saveAthkarLog(userId, category, progress, date) {
        return new Promise((resolve, reject) => {
            console.log('saveAthkarLog called with:', { userId, category, progress, date });

            // Validate inputs
            if (!userId || !category || !date) {
                console.error('Missing required parameters:', { userId, category, progress, date });
                reject(new Error('Missing required parameters: userId, category, and date are required'));
                return;
            }

            const progressJson = JSON.stringify(progress || {});
            console.log('Progress JSON:', progressJson);

            // First, try to update if exists
            const checkSql = `SELECT * FROM athkar_logs WHERE user_id = ? AND category = ? AND date = ?`;
            this.db.get(checkSql, [userId, category, date], (checkErr, row) => {
                if (checkErr) {
                    console.error('saveAthkarLog check error:', checkErr);
                    reject(checkErr);
                    return;
                }

                if (row) {
                    // Update existing record
                    const updateSql = `UPDATE athkar_logs SET progress = ? 
                                      WHERE user_id = ? AND category = ? AND date = ?`;
                    this.db.run(updateSql, [progressJson, userId, category, date], function (err) {
                        if (err) {
                            console.error('saveAthkarLog update error:', err);
                            reject(err);
                        } else {
                            console.log('saveAthkarLog update success');
                            resolve();
                        }
                    });
                } else {
                    // Insert new record
                    const insertSql = `INSERT INTO athkar_logs (user_id, category, progress, date) 
                                      VALUES (?, ?, ?, ?)`;
                    this.db.run(insertSql, [userId, category, progressJson, date], function (err) {
                        if (err) {
                            console.error('saveAthkarLog insert error:', err);
                            reject(err);
                        } else {
                            console.log('saveAthkarLog insert success');
                            resolve();
                        }
                    });
                }
            });
        });
    }

    getAthkarLog(userId, date, category) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM athkar_logs WHERE user_id = ? AND date = ? AND category = ? LIMIT 1`;
            this.db.get(sql, [userId, date, category], (err, row) => {
                if (err) reject(err);
                else if (row) {
                    resolve({ userId: row.user_id, category: row.category, progress: JSON.parse(row.progress || '{}'), date: row.date });
                } else resolve(null);
            });
        });
    }

    // Tickets
    addTicket(ticket) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO tickets (id, user_id, user_name, subject, message, status, created_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`;
            this.db.run(sql, [
                ticket.id, ticket.userId, ticket.userName, ticket.subject,
                ticket.message, ticket.status, ticket.createdAt
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    // Post Likes
    addLike(postId, userId) {
        return new Promise((resolve, reject) => {
            const likeId = 'like_' + Date.now();
            const sql = `INSERT INTO post_likes (id, post_id, user_id) VALUES (?, ?, ?)`;
            this.db.run(sql, [likeId, postId, userId], (err) => {
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        return reject(new Error('Already liked'));
                    } else return reject(err);
                }
                // Update posts.likes to current count
                const countSql = `SELECT COUNT(*) as count FROM post_likes WHERE post_id = ?`;
                this.db.get(countSql, [postId], (countErr, row) => {
                    if (countErr) {
                        console.error('Failed to count likes:', countErr);
                        return resolve();
                    }
                    const likes = row?.count || 0;
                    const updateSql = `UPDATE posts SET likes = ? WHERE id = ?`;
                    this.db.run(updateSql, [likes, postId], (updErr) => {
                        if (updErr) console.error('Failed to update post likes:', updErr);
                        return resolve();
                    });
                });
            });
        });
    }

    removeLike(postId, userId) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM post_likes WHERE post_id = ? AND user_id = ?`;
            this.db.run(sql, [postId, userId], (err) => {
                if (err) return reject(err);
                // Update posts.likes to current count
                const countSql = `SELECT COUNT(*) as count FROM post_likes WHERE post_id = ?`;
                this.db.get(countSql, [postId], (countErr, row) => {
                    if (countErr) {
                        console.error('Failed to count likes after remove:', countErr);
                        return resolve();
                    }
                    const likes = row?.count || 0;
                    const updateSql = `UPDATE posts SET likes = ? WHERE id = ?`;
                    this.db.run(updateSql, [likes, postId], (updErr) => {
                        if (updErr) console.error('Failed to update post likes:', updErr);
                        return resolve();
                    });
                });
            });
        });
    }

    getPostLikes(postId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT COUNT(*) as count FROM post_likes WHERE post_id = ?`;
            this.db.get(sql, [postId], (err, row) => {
                if (err) reject(err);
                else resolve(row?.count || 0);
            });
        });
    }

    hasUserLiked(postId, userId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT COUNT(*) as count FROM post_likes WHERE post_id = ? AND user_id = ?`;
            this.db.get(sql, [postId, userId], (err, row) => {
                if (err) reject(err);
                else resolve((row?.count || 0) > 0);
            });
        });
    }

    // Post Comments
    addComment(comment) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO post_comments (id, post_id, user_id, user_name, content, parent_id, likes)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`;
            this.db.run(sql, [
                comment.id, comment.postId, comment.userId, comment.userName,
                comment.content, comment.parentId || null, comment.likes || 0
            ], (err) => {
                if (err) return reject(err);
                // After inserting, update posts.comments JSON to include this comment for quick retrieval
                const getSql = `SELECT comments FROM posts WHERE id = ?`;
                this.db.get(getSql, [comment.postId], (getErr, row) => {
                    if (getErr) {
                        console.error('Failed to fetch post comments for update:', getErr);
                        return resolve();
                    }
                    let comments = [];
                    try { comments = JSON.parse(row?.comments || '[]'); } catch (e) { comments = []; }
                    comments.push({
                        id: comment.id,
                        userId: comment.userId,
                        userName: comment.userName,
                        content: comment.content,
                        parentId: comment.parentId || null,
                        likes: comment.likes || 0,
                        createdAt: comment.createdAt || new Date().toISOString()
                    });
                    const updateSql = `UPDATE posts SET comments = ? WHERE id = ?`;
                    this.db.run(updateSql, [JSON.stringify(comments), comment.postId], (updErr) => {
                        if (updErr) console.error('Failed to update post comments JSON:', updErr);
                        return resolve();
                    });
                });
            });
        });
    }

    getComments(postId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM post_comments WHERE post_id = ? ORDER BY created_at DESC`;
            this.db.all(sql, [postId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows ? rows.map(r => ({
                    id: r.id,
                    postId: r.post_id,
                    userId: r.user_id,
                    userName: r.user_name,
                    content: r.content,
                    parentId: r.parent_id,
                    likes: r.likes,
                    createdAt: r.created_at
                })) : []);
            });
        });
    }

    deleteComment(commentId) {
        return new Promise((resolve, reject) => {
            // Find the post_id for this comment so we can update the post's comments JSON
            const getSql = `SELECT post_id FROM post_comments WHERE id = ?`;
            this.db.get(getSql, [commentId], (getErr, row) => {
                if (getErr) return reject(getErr);
                const postId = row?.post_id;
                const delSql = `DELETE FROM post_comments WHERE id = ?`;
                this.db.run(delSql, [commentId], (err) => {
                    if (err) return reject(err);
                    if (!postId) return resolve();
                    // Update posts.comments JSON to remove the deleted comment
                    const fetchSql = `SELECT comments FROM posts WHERE id = ?`;
                    this.db.get(fetchSql, [postId], (fErr, prow) => {
                        if (fErr) {
                            console.error('Failed to fetch post comments for delete update:', fErr);
                            return resolve();
                        }
                        let comments = [];
                        try { comments = JSON.parse(prow?.comments || '[]'); } catch (e) { comments = []; }
                        const filtered = comments.filter(c => c.id !== commentId);
                        const updateSql = `UPDATE posts SET comments = ? WHERE id = ?`;
                        this.db.run(updateSql, [JSON.stringify(filtered), postId], (updErr) => {
                            if (updErr) console.error('Failed to update post comments JSON after delete:', updErr);
                            return resolve();
                        });
                    });
                });
            });
        });
    }

    // Post Shares
    addShare(postId, userId) {
        return new Promise((resolve, reject) => {
            const shareId = 'share_' + Date.now();
            const sql = `INSERT INTO post_shares (id, post_id, user_id) VALUES (?, ?, ?)`;
            this.db.run(sql, [shareId, postId, userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    getShareCount(postId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT COUNT(*) as count FROM post_shares WHERE post_id = ?`;
            this.db.get(sql, [postId], (err, row) => {
                if (err) reject(err);
                else resolve(row?.count || 0);
            });
        });
    }

    // Post Favorites
    addFavorite(postId, userId) {
        return new Promise((resolve, reject) => {
            const favId = 'fav_' + Date.now();
            const sql = `INSERT OR IGNORE INTO post_favorites (id, post_id, user_id) VALUES (?, ?, ?)`;
            this.db.run(sql, [favId, postId, userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    removeFavorite(postId, userId) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM post_favorites WHERE post_id = ? AND user_id = ?`;
            this.db.run(sql, [postId, userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    hasUserFavorited(postId, userId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT COUNT(*) as count FROM post_favorites WHERE post_id = ? AND user_id = ?`;
            this.db.get(sql, [postId, userId], (err, row) => {
                if (err) reject(err);
                else resolve((row?.count || 0) > 0);
            });
        });
    }

    getUserFavorites(userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT p.*, m.name as mosque_name 
                FROM post_favorites f 
                JOIN posts p ON f.post_id = p.id 
                JOIN mosques m ON p.mosque_id = m.id
                WHERE f.user_id = ? 
                ORDER BY f.created_at DESC`;
            this.db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows ? rows.map(r => this.formatPost(r)) : []);
            });
        });
    }

    // Notifications
    createNotification(notification) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO notifications (id, user_id, from_user_id, type, post_id, content)
                         VALUES (?, ?, ?, ?, ?, ?)`;
            this.db.run(sql, [
                notification.id, notification.userId, notification.fromUserId,
                notification.type, notification.postId, notification.content
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    getNotifications(userId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`;
            this.db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows ? rows.map(r => ({
                    id: r.id,
                    userId: r.user_id,
                    fromUserId: r.from_user_id,
                    type: r.type,
                    postId: r.post_id,
                    content: r.content,
                    isRead: r.is_read === 1,
                    createdAt: r.created_at
                })) : []);
            });
        });
    }

    // Assistant Logs
    addAssistantLog(log) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO assistant_logs (id, user_id, query, source, snippet, success)
                         VALUES (?, ?, ?, ?, ?, ?)`;
            this.db.run(sql, [
                log.id, log.userId || null, log.query, log.source, log.snippet || '', log.success ? 1 : 0
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    getAssistantLogs(userId) {
        return new Promise((resolve, reject) => {
            const sql = userId ? `SELECT * FROM assistant_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 100` : `SELECT * FROM assistant_logs ORDER BY created_at DESC LIMIT 100`;
            const params = userId ? [userId] : [];
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows ? rows.map(r => ({
                    id: r.id,
                    userId: r.user_id,
                    query: r.query,
                    source: r.source,
                    snippet: r.snippet,
                    success: r.success === 1,
                    createdAt: r.created_at
                })) : []);
            });
        });
    }

    markNotificationAsRead(notificationId) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE notifications SET is_read = 1 WHERE id = ?`;
            this.db.run(sql, [notificationId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    deletePost(postId) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM posts WHERE id = ?`;
            this.db.run(sql, [postId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    editPost(postId, content) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE posts SET content = ? WHERE id = ?`;
            this.db.run(sql, [content, postId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    getTickets() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM tickets ORDER BY created_at DESC`;
            this.db.all(sql, (err, rows) => {
                if (err) reject(err);
                else resolve(rows ? rows.map(r => ({
                    id: r.id,
                    userId: r.user_id,
                    userName: r.user_name,
                    subject: r.subject,
                    message: r.message,
                    reply: r.reply,
                    status: r.status,
                    createdAt: r.created_at
                })) : []);
            });
        });
    }

    updateTicket(ticket) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE tickets SET reply = ?, status = ? WHERE id = ?`;
            this.db.run(sql, [ticket.reply, ticket.status, ticket.id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    // ==================== V2 FEATURES ====================

    // ---- Social / Follow System ----
    followUser(followerId, followingId) {
        return new Promise((resolve, reject) => {
            if (followerId === followingId) return reject(new Error("Cannot follow yourself"));

            this.db.serialize(() => {
                const sqlFollow = `INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)`;
                this.db.run(sqlFollow, [followerId, followingId], (err) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            });
        });
    }

    unfollowUser(followerId, followingId) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM follows WHERE follower_id = ? AND following_id = ?`;
            this.db.run(sql, [followerId, followingId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    searchUsers(query) {
        return new Promise((resolve, reject) => {
            if (!query) return resolve([]);

            // Normalize query: trim and convert Arabic numbers to English
            let cleanQuery = query.trim();
            cleanQuery = cleanQuery.replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);

            const term = `%${cleanQuery}%`;

            console.log(`[DB] Searching users with query: "${cleanQuery}" (Original: "${query}")`);

            const sql = `
                SELECT *
                FROM users 
                WHERE name LIKE ? OR phone LIKE ? OR id LIKE ?
                LIMIT 40
            `;

            this.db.all(sql, [term, term, term], (err, rows) => {
                if (err) {
                    console.error('[DB] Search users error:', err);
                    reject(err);
                } else {
                    try {
                        const results = rows || [];
                        const formattedResults = results.map(row => {
                            try {
                                return this.formatUser(row);
                            } catch (formatErr) {
                                console.error(`[DB] Error formatting user ${row.id}:`, formatErr);
                                return null;
                            }
                        }).filter(u => u !== null);

                        resolve(formattedResults);
                    } catch (mapErr) {
                        console.error('[DB] Error mapping search results:', mapErr);
                        reject(mapErr);
                    }
                }
            });
        });
    }

    getFollowers(userId) {
        return new Promise((resolve, reject) => {
            // Join with users table to get details
            const sql = `
                SELECT u.id, u.name, u.phone, u.role, u.is_active, u.location_lat, u.location_lng 
                FROM follows f 
                JOIN users u ON f.follower_id = u.id 
                WHERE f.following_id = ?`;
            this.db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows ? rows.map(r => this.formatUser(r)) : []);
            });
        });
    }

    getFollowing(userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT u.id, u.name, u.phone, u.role, u.is_active, u.location_lat, u.location_lng 
                FROM follows f 
                JOIN users u ON f.following_id = u.id 
                WHERE f.follower_id = ?`;
            this.db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows ? rows.map(r => this.formatUser(r)) : []);
            });
        });
    }

    checkMutualFollow(userA, userB) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = ?) as aFollowsB,
                    (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = ?) as bFollowsA
            `;
            this.db.get(sql, [userA, userB, userB, userA], (err, row) => {
                if (err) reject(err);
                else resolve(row && row.aFollowsB > 0 && row.bFollowsA > 0);
            });
        });
    }

    // ---- Advanced Khatma System ----

    // Create personal or private group khatma
    createUserKhatma(khatma) {
        return new Promise((resolve, reject) => {
            // First, archive any existing ongoing khatmas for this user (Owner or Participant)
            const archiveSql = `UPDATE user_khatmas SET status = 'archived' WHERE (owner_id = ? OR participants LIKE ?) AND status = 'ongoing'`;
            const searchPattern = `%"${khatma.participants[0].userId}"%`;

            this.db.run(archiveSql, [khatma.ownerId, searchPattern], (err) => {
                if (err) {
                    console.error("Error archiving old khatmas", err);
                    // Continue anyway to create the new one
                }

                const sql = `INSERT INTO user_khatmas (id, type, owner_id, name, participants, current_juz, completed_parts, start_date, status)
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                this.db.run(sql, [
                    khatma.id, khatma.type, khatma.ownerId, khatma.name,
                    JSON.stringify(khatma.participants || []),
                    khatma.currentJuz || 0,
                    JSON.stringify(khatma.completedParts || []),
                    khatma.startDate || new Date().toISOString(),
                    'ongoing'
                ], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    }

    getUserKhatmas(userId) {
        return new Promise((resolve, reject) => {
            // Get khatmas where user is owner OR user is in participants list
            const sql = `SELECT * FROM user_khatmas WHERE owner_id = ? OR participants LIKE ? ORDER BY start_date DESC`;
            const searchPattern = `%"${userId}"%`; // Simple JSON LIKE search

            this.db.all(sql, [userId, searchPattern], (err, rows) => {
                if (err) reject(err);
                else resolve(rows ? rows.map(r => ({
                    id: r.id,
                    type: r.type,
                    ownerId: r.owner_id,
                    name: r.name,
                    participants: JSON.parse(r.participants || '[]'),
                    currentJuz: r.current_juz,
                    completedParts: JSON.parse(r.completed_parts || '[]'),
                    startDate: r.start_date,
                    endDate: r.end_date,
                    status: r.status
                })) : []);
            });
        });
    }

    updateKhatmaProgress(khatmaId, userId, progress) {
        return new Promise((resolve, reject) => {
            const now = new Date().toISOString();
            if (progress.currentJuz !== undefined) {
                // Personal Update
                const sql = `UPDATE user_khatmas SET current_juz = ?, last_read_at = ? WHERE id = ?`;
                this.db.run(sql, [progress.currentJuz, now, khatmaId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            } else if (progress.partId !== undefined) {
                // Group Update (Add a part to completedParts)
                const getSql = `SELECT completed_parts FROM user_khatmas WHERE id = ?`;
                this.db.get(getSql, [khatmaId], (err, row) => {
                    if (err) return reject(err);
                    if (!row) return reject(new Error('Khatma not found'));

                    let parts = JSON.parse(row.completed_parts || '[]');
                    parts.push({ partId: progress.partId, userId, date: now });

                    const updateSql = `UPDATE user_khatmas SET completed_parts = ?, last_read_at = ? WHERE id = ?`;
                    this.db.run(updateSql, [JSON.stringify(parts), now, khatmaId], (upErr) => {
                        if (upErr) reject(upErr);
                        else resolve(parts);
                    });
                });
            } else {
                resolve();
            }
        });
    }

    completeUserKhatma(khatmaId, userId, durationDays) {
        return new Promise((resolve, reject) => {
            const now = new Date().toISOString();
            const sql = `UPDATE user_khatmas SET status = 'completed', end_date = ? WHERE id = ?`;
            this.db.run(sql, [now, khatmaId], (err) => {
                if (err) return reject(err);

                // Add to history
                const histId = 'khist_' + Date.now();
                const histSql = `INSERT INTO khatma_history (id, user_id, khatma_id, type, duration_days, completion_date) 
                                VALUES (?, ?, ?, ?, ?, ?)`;

                // Determine type based on lookup (simplified here to passed arg or default)
                this.db.run(histSql, [histId, userId, khatmaId, 'personal', durationDays || 0, now], (hErr) => {
                    if (hErr) console.error("Error saving history:", hErr);
                    resolve();
                });
            });
        });
    }

    getKhatmaHistory(userId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM khatma_history WHERE user_id = ? ORDER BY completion_date DESC`;
            this.db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    // ---- Advanced Tasbih System ----

    getTasbihGoal(userId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM tasbih_goals WHERE user_id = ?`;
            this.db.get(sql, [userId], (err, row) => {
                if (err) reject(err);
                else {
                    if (!row) {
                        // Create default if not exists
                        this.db.run(`INSERT INTO tasbih_goals (user_id) VALUES (?)`, [userId]);
                        resolve({ dailyGoal: 100, streak: 0, totalLifetime: 0 });
                    } else {
                        resolve({
                            dailyGoal: row.daily_goal,
                            streak: row.streak_days,
                            totalLifetime: row.total_lifetime_count,
                            lastStreakDate: row.last_streak_date
                        });
                    }
                }
            });
        });
    }

    setTasbihGoal(userId, goal) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE tasbih_goals SET daily_goal = ? WHERE user_id = ?`;
            this.db.run(sql, [goal, userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    updateTasbihStats(userId, countToAdd) {
        return new Promise((resolve, reject) => {
            this.db.run(`INSERT OR IGNORE INTO tasbih_goals (user_id) VALUES (?)`, [userId], (err) => {
                if (err) return reject(err);

                const sql = `UPDATE tasbih_goals SET total_lifetime_count = COALESCE(total_lifetime_count, 0) + ? WHERE user_id = ?`;
                this.db.run(sql, [countToAdd, userId], (upErr) => {
                    if (upErr) reject(upErr);
                    else resolve();
                });
            });
        });
    }

    saveTasbihLog(log) {
        return new Promise((resolve, reject) => {
            const today = log.date || new Date().toISOString().split('T')[0];
            const id = `tlog_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

            // First, calculate total for today to check streak
            const sql = `INSERT INTO tasbih_logs (id, user_id, date, phrase, count, target, completed) VALUES (?, ?, ?, ?, ?, ?, ?)`;
            this.db.run(sql, [id, log.userId, today, log.phrase, log.count, log.target, log.completed ? 1 : 0], (err) => {
                if (err) return reject(err);

                // Update streak if daily goal reached
                const totalTodaySql = `SELECT SUM(count) as total FROM tasbih_logs WHERE user_id = ? AND date = ?`;
                this.db.get(totalTodaySql, [log.userId, today], (errTotal, rowTotal) => {
                    if (!errTotal && rowTotal) {
                        const total = rowTotal.total || 0;
                        this.getTasbihGoal(log.userId).then(goalData => {
                            const goal = goalData.dailyGoal || 100;
                            if (total >= goal && goalData.lastStreakDate !== today) {
                                let newStreak = goalData.streak || 0;
                                const yesterday = new Date();
                                yesterday.setDate(yesterday.getDate() - 1);
                                const yesterdayStr = yesterday.toISOString().split('T')[0];

                                if (goalData.lastStreakDate === yesterdayStr) {
                                    newStreak += 1;
                                } else {
                                    newStreak = 1;
                                }

                                this.db.run(`UPDATE tasbih_goals SET streak_days = ?, last_streak_date = ? WHERE user_id = ?`,
                                    [newStreak, today, log.userId]);
                            }
                        }).catch(() => { });
                    }
                });
                resolve();
            });
        });
    }

    getTasbihLog(userId, date) {
        return new Promise((resolve, reject) => {
            // Get latest log for this phrase/date or sum? 
            // The frontend seems to expect a single object per phrase/date session.
            const sql = `SELECT * FROM tasbih_logs WHERE user_id = ? AND date = ? ORDER BY created_at DESC LIMIT 1`;
            this.db.get(sql, [userId, date], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    getRecentTasbihLogs(userId, limit = 7) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT date, phrase, SUM(count) as count FROM tasbih_logs WHERE user_id = ? GROUP BY date, phrase ORDER BY date DESC LIMIT ?`;
            this.db.all(sql, [userId, limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    clearTasbihLogs(userId) {
        return new Promise((resolve, reject) => {
            this.db.run(`DELETE FROM tasbih_logs WHERE user_id = ?`, [userId], (err) => {
                if (err) reject(err);
                else {
                    this.db.run(`UPDATE tasbih_goals SET total_lifetime_count = 0, streak_days = 0 WHERE user_id = ?`, [userId], (err2) => {
                        if (err2) reject(err2);
                        else resolve();
                    });
                }
            });
        });
    }

    // ---- Reminder logic ----
    getInactivityReminders(userId) {
        return new Promise((resolve, reject) => {
            // Find ongoing khatmas that haven't been read in 24h AND haven't been reminded in last 24h
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const sql = `
                SELECT id, name, last_read_at 
                FROM user_khatmas 
                WHERE owner_id = ? 
                AND status = 'ongoing' 
                AND last_read_at < ?
                AND (last_reminder_at IS NULL OR last_reminder_at < ?)
            `;
            this.db.all(sql, [userId, twentyFourHoursAgo, twentyFourHoursAgo], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    markReminderSent(khatmaId) {
        return new Promise((resolve, reject) => {
            const now = new Date().toISOString();
            this.db.run(`UPDATE user_khatmas SET last_reminder_at = ? WHERE id = ?`, [now, khatmaId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    // ---- Challenge logic ----
    getQuestions(count = 5, category = null) {
        return new Promise((resolve, reject) => {
            let sql = `SELECT * FROM religious_questions`;
            const params = [];

            if (category && category !== 'all') {
                sql += ` WHERE category = ?`;
                params.push(category);
            }

            sql += ` ORDER BY RANDOM() LIMIT ?`;
            params.push(count);

            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows ? rows.map(r => ({ ...r, options: JSON.parse(r.options) })) : []);
            });
        });
    }

    getQuestionsByIds(ids) {
        return new Promise((resolve, reject) => {
            if (!ids || ids.length === 0) return resolve([]);
            const placeholders = ids.map(() => '?').join(',');
            const sql = `SELECT * FROM religious_questions WHERE id IN (${placeholders})`;
            this.db.all(sql, ids, (err, rows) => {
                if (err) reject(err);
                else resolve(rows ? rows.map(r => ({ ...r, options: JSON.parse(r.options) })) : []);
            });
        });
    }

    createChallenge(challenge) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO challenges (id, challenger_id, opponent_id, question_ids, status, type) VALUES (?, ?, ?, ?, ?, ?)`;
            this.db.run(sql, [
                challenge.id,
                challenge.challengerId,
                challenge.opponentId,
                JSON.stringify(challenge.questionIds),
                challenge.status || 'pending',
                challenge.type || 'async'
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    getChallenge(id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM challenges WHERE id = ?`;
            this.db.get(sql, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row ? { ...row, question_ids: JSON.parse(row.question_ids), completed_by: JSON.parse(row.completed_by || '[]') } : null);
            });
        });
    }


    updateChallengeScore(challengeId, userId, score) {
        return new Promise((resolve, reject) => {
            this.getChallenge(challengeId).then(challenge => {
                if (!challenge) return reject(new Error('Challenge not found'));

                let completedBy = challenge.completed_by;
                if (!completedBy.includes(userId)) completedBy.push(userId);

                let sql = "";
                let params = [];
                let newStatus = challenge.status;
                let newQuestionIds = challenge.question_ids;
                let newCompletedBy = [...completedBy]; // Clone to modify if tie breaker

                // Determine new scores
                const newChallengerScore = userId === challenge.challenger_id ? score : challenge.challenger_score;
                const newOpponentScore = userId === challenge.opponent_id ? score : challenge.opponent_score;

                if (userId === challenge.challenger_id) {
                    sql = `UPDATE challenges SET challenger_score = ?, completed_by = ?`;
                    params = [score];
                } else {
                    sql = `UPDATE challenges SET opponent_score = ?, completed_by = ?`;
                    params = [score];
                }

                // Logic for finishing
                if (completedBy.length >= 2) {
                    // Check for tie
                    if (newChallengerScore === newOpponentScore) {
                        console.log(`[Challenge ${challengeId}] Tie detected (${newChallengerScore}-${newOpponentScore})! Initiating tie breaker...`);

                        // It's a tie! 
                        // 1. Change status to tie_breaker
                        // 2. Add more questions (e.g. 3 or 5 more)
                        // 3. Clear completed_by so they can submit again for the new total

                        newStatus = 'tie_breaker';

                        // We need to fetch new questions asynchronously.
                        // This complicates the flow slightly, so we chain promises.
                        this.getQuestions(5).then(newQuestions => {
                            const newIds = newQuestions.map(q => q.id);
                            newQuestionIds = [...newQuestionIds, ...newIds];

                            // Reset completed_by for the new round
                            newCompletedBy = [];

                            // Construct the FULL update SQL including new questions and status
                            if (userId === challenge.challenger_id) {
                                sql = `UPDATE challenges SET challenger_score = ?, completed_by = ?, status = ?, question_ids = ? WHERE id = ?`;
                                params = [score, JSON.stringify(newCompletedBy), newStatus, JSON.stringify(newQuestionIds), challengeId];
                            } else {
                                sql = `UPDATE challenges SET opponent_score = ?, completed_by = ?, status = ?, question_ids = ? WHERE id = ?`;
                                params = [score, JSON.stringify(newCompletedBy), newStatus, JSON.stringify(newQuestionIds), challengeId];
                            }

                            this.db.run(sql, params, (err) => {
                                if (err) reject(err);
                                else resolve();
                            });
                        }).catch(err => reject(err));

                        return; // Return here as we handled the DB run inside the promise

                    } else {
                        // Normal completion
                        newStatus = 'completed';
                        sql += `, status = ? WHERE id = ?`;
                        params.push(JSON.stringify(completedBy)); // use original completedBy
                        params.push(newStatus);
                        params.push(challengeId);

                        // Award Ranking Points
                        let winnerId = null;
                        let loserId = null;

                        if (newChallengerScore > newOpponentScore) {
                            winnerId = challenge.challenger_id;
                            loserId = challenge.opponent_id;
                        } else if (newOpponentScore > newChallengerScore) {
                            winnerId = challenge.opponent_id;
                            loserId = challenge.challenger_id;
                        }

                        // Only award points if this is the first time the challenge is marked as completed
                        if (challenge.status !== 'completed' && challenge.status !== 'tie_breaker') {
                            if (winnerId) {
                                const basePoints = 10;
                                const isLiveBonus = challenge.type === 'live' ? 5 : 0;
                                const totalWinPoints = basePoints + isLiveBonus;

                                this.updateUserScore(winnerId, totalWinPoints);
                                if (loserId) this.updateUserScore(loserId, -5);
                                console.log(`[Ranking] Awarded +${totalWinPoints} to ${winnerId} (Live Bonus: ${isLiveBonus}) and -5 to ${loserId}`);
                            } else if (newChallengerScore === newOpponentScore) {
                                this.updateUserScore(challenge.challenger_id, 2);
                                this.updateUserScore(challenge.opponent_id, 2);
                                console.log(`[Ranking] Awarded +2 to both for tie`);
                            }
                        }
                    }
                } else {
                    // Not finished yet, just update score
                    sql += ` WHERE id = ?`;
                    params.push(JSON.stringify(completedBy));
                    params.push(challengeId);
                }

                this.db.run(sql, params, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    }

    getInboundChallenges(userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT c.*, u.name as challenger_name 
                FROM challenges c 
                JOIN users u ON c.challenger_id = u.id 
                WHERE c.opponent_id = ? AND c.status = 'pending' 
                ORDER BY c.created_at DESC
            `;
            this.db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows ? rows.map(r => ({
                    ...r,
                    question_ids: JSON.parse(r.question_ids),
                    completed_by: JSON.parse(r.completed_by || '[]')
                })) : []);
            });
        });
    }

    getLeaderboardData() {
        return new Promise((resolve, reject) => {
            // Calculate score based on wins or total points
            // For now, let's sum up winning points
            const sql = `
                SELECT 
                    id, 
                    name, 
                    role,
                    ranking_score as total_points,
                    winning_streak,
                    max_streak,
                    (SELECT COUNT(*) FROM challenges WHERE (challenger_id = u.id OR opponent_id = u.id) AND status = 'completed') as challenges_completed
                FROM users u
                ORDER BY total_points DESC
                LIMIT 10
            `;
            this.db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    getUserChallenges(userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT c.*, u1.name as challenger_name, u2.name as opponent_name
                FROM challenges c
                JOIN users u1 ON c.challenger_id = u1.id
                JOIN users u2 ON c.opponent_id = u2.id
                WHERE c.challenger_id = ? OR c.opponent_id = ?
                ORDER BY c.created_at DESC
            `;
            this.db.all(sql, [userId, userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows ? rows.map(r => ({
                    ...r,
                    question_ids: JSON.parse(r.question_ids),
                    completed_by: JSON.parse(r.completed_by || '[]')
                })) : []);
            });
        });
    }

    // Educational Lessons Functions
    getAllEducationalLessons() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM educational_lessons ORDER BY order_index ASC`;
            this.db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    getEducationalLesson(lessonId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM educational_lessons WHERE id = ?`;
            this.db.get(sql, [lessonId], (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            });
        });
    }

    getLessonQuestions(lessonId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM lesson_questions WHERE lesson_id = ? ORDER BY order_index ASC`;
            this.db.all(sql, [lessonId], (err, rows) => {
                if (err) reject(err);
                else resolve((rows || []).map(r => ({
                    ...r,
                    options: JSON.parse(r.options)
                })));
            });
        });
    }

    getUserLessonProgress(userId, lessonId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ?`;
            this.db.get(sql, [userId, lessonId], (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            });
        });
    }

    getAllUserLessonProgress(userId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM user_lesson_progress WHERE user_id = ?`;
            this.db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    initializeUserLessonProgress(userId) {
        return new Promise(async (resolve, reject) => {
            try {
                // Get all lessons
                const lessons = await this.getAllEducationalLessons();

                // For each lesson, create progress entry if it doesn't exist
                for (const lesson of lessons) {
                    const existing = await this.getUserLessonProgress(userId, lesson.id);

                    if (!existing) {
                        // First lesson (order_index 1) should be unlocked, others locked
                        const status = lesson.order_index === 1 ? 'unlocked' : 'locked';
                        const progressId = `progress_${userId}_${lesson.id}_${Date.now()}`;

                        await new Promise((res, rej) => {
                            this.db.run(`INSERT INTO user_lesson_progress (
                                id, user_id, lesson_id, status
                            ) VALUES (?, ?, ?, ?)`,
                                [progressId, userId, lesson.id, status],
                                (err) => {
                                    if (err) rej(err);
                                    else res();
                                });
                        });
                    }
                }

                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    async getAllEducationalLessons() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM educational_lessons ORDER BY category, order_index ASC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    async getEducationalLesson(lessonId) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM educational_lessons WHERE id = ?', [lessonId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    getUserLessonProgress(userId, lessonId) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ?', [userId, lessonId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    getAllUserLessonProgress(userId) {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM user_lesson_progress WHERE user_id = ?', [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    initializeUserLessonProgress(userId) {
        return new Promise(async (resolve, reject) => {
            try {
                // Get all lessons
                const lessons = await new Promise((res, rej) => {
                    this.db.all('SELECT id, order_index, category FROM educational_lessons ORDER BY category, order_index', (err, rows) => {
                        if (err) rej(err);
                        else res(rows || []);
                    });
                });

                if (lessons.length === 0) {
                    resolve();
                    return;
                }

                // Prepare statement for efficiency
                const stmt = this.db.prepare(`
                    INSERT OR IGNORE INTO user_lesson_progress (id, user_id, lesson_id, status)
                    VALUES (?, ?, ?, ?)
                `);

                for (const lesson of lessons) {
                    // Unlock lessons with order_index 1
                    const isFirst = lesson.order_index === 1;
                    const status = isFirst ? 'unlocked' : 'locked';
                    const id = `${userId}_${lesson.id}`;

                    stmt.run(id, userId, lesson.id, status);
                }

                stmt.finalize((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    updateLessonProgress(userId, lessonId, data) {
        return new Promise((resolve, reject) => {
            const { status, quiz_score, quiz_total, quiz_attempts } = data;

            // First, get current progress to compare scores and status
            this.getUserLessonProgress(userId, lessonId).then(currentProgress => {
                let finalScore = quiz_score;
                let finalStatus = status;

                if (currentProgress) {
                    // Keep best score
                    if (currentProgress.quiz_score !== null && currentProgress.quiz_score !== undefined) {
                        finalScore = Math.max(currentProgress.quiz_score, quiz_score || 0);
                    }

                    // Don't revert 'completed' status
                    if (currentProgress.status === 'completed') {
                        finalStatus = 'completed';
                    }
                }

                const sql = `UPDATE user_lesson_progress 
                             SET status = ?, 
                                 quiz_score = ?,
                                 quiz_total = COALESCE(?, quiz_total),
                                 quiz_attempts = COALESCE(?, quiz_attempts),
                                 last_accessed = CURRENT_TIMESTAMP,
                                 completed_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
                             WHERE user_id = ? AND lesson_id = ?`;

                this.db.run(sql, [
                    finalStatus,
                    finalScore,
                    quiz_total,
                    quiz_attempts,
                    status, // Check new status for completed_at update trigger
                    userId,
                    lessonId
                ], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            }).catch(reject);
        });
    }

    checkCategoryCompletion(userId, category) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    (SELECT COUNT(*) FROM educational_lessons WHERE category = ?) as total_lessons,
                    (SELECT COUNT(*) 
                     FROM user_lesson_progress ulp
                     JOIN educational_lessons el ON ulp.lesson_id = el.id
                     WHERE ulp.user_id = ? 
                     AND el.category = ?
                     AND ulp.status = 'completed') as completed_lessons
            `;

            this.db.get(sql, [category, userId, category], (err, row) => {
                if (err) reject(err);
                else {
                    const isCompleted = row && row.total_lessons > 0 && row.total_lessons === row.completed_lessons;
                    resolve({
                        isCompleted,
                        totalLessons: row ? row.total_lessons : 0,
                        completedLessons: row ? row.completed_lessons : 0
                    });
                }
            });
        });
    }

    unlockNextLesson(userId, currentLessonOrderIndex) {
        return new Promise(async (resolve, reject) => {
            try {
                // Find the next lesson
                const nextLesson = await new Promise((res, rej) => {
                    this.db.get(`SELECT * FROM educational_lessons WHERE order_index = ?`,
                        [currentLessonOrderIndex + 1],
                        (err, row) => {
                            if (err) rej(err);
                            else res(row);
                        }
                    );
                });

                if (nextLesson) {
                    // Unlock it
                    await this.updateLessonProgress(userId, nextLesson.id, { status: 'unlocked' });
                }

                resolve(nextLesson);
            } catch (error) {
                reject(error);
            }
        });
    }


    /* ==================== Mosque Challenges ==================== */

    createMosqueChallenge(challenge) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO mosque_challenges (id, mosque_id, title, description, start_date, end_date, visibility)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`;
            this.db.run(sql, [
                challenge.id, challenge.mosqueId, challenge.title, challenge.description,
                challenge.startDate, challenge.endDate, challenge.visibility || 'public'
            ], (err) => {
                if (err) reject(err);
                else {
                    // Add questions
                    if (challenge.questions && challenge.questions.length > 0) {
                        const qStmt = this.db.prepare(`INSERT INTO mosque_challenge_questions (id, challenge_id, question_text, options, correct_answer, explanation, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)`);
                        challenge.questions.forEach((q, idx) => {
                            qStmt.run(q.id, challenge.id, q.questionText, JSON.stringify(q.options), q.correctAnswer, q.explanation, idx);
                        });
                        qStmt.finalize();
                    }
                    resolve({ id: challenge.id });
                }
            });
        });
    }

    getMosqueChallenges(mosqueId, isAdmin = false) {
        return new Promise((resolve, reject) => {
            const now = new Date().toISOString();
            let sql = `SELECT * FROM mosque_challenges WHERE mosque_id = ?`;
            const params = [mosqueId];

            if (!isAdmin) {
                sql += ` AND is_active = 1 AND start_date <= ? AND end_date >= ?`;
                params.push(now, now);
            }

            sql += ` ORDER BY created_at DESC`;

            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    async updateMosqueChallenge(challenge) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE mosque_challenges 
                         SET title = ?, description = ?, start_date = ?, end_date = ?, visibility = ?, is_active = ?
                         WHERE id = ?`;
            this.db.run(sql, [
                challenge.title, challenge.description, challenge.startDate,
                challenge.endDate, challenge.visibility || 'public',
                challenge.isActive !== undefined ? (challenge.isActive ? 1 : 0) : 1,
                challenge.id
            ], (err) => {
                if (err) return reject(err);

                // Update questions: simpler to delete and re-insert
                this.db.run(`DELETE FROM mosque_challenge_questions WHERE challenge_id = ?`, [challenge.id], (delErr) => {
                    if (delErr) return reject(delErr);

                    if (challenge.questions && challenge.questions.length > 0) {
                        const qStmt = this.db.prepare(`INSERT INTO mosque_challenge_questions (id, challenge_id, question_text, options, correct_answer, explanation, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)`);
                        challenge.questions.forEach((q, idx) => {
                            qStmt.run(q.id || ('q_' + Date.now() + '_' + idx), challenge.id, q.questionText, JSON.stringify(q.options), q.correctAnswer, q.explanation, idx);
                        });
                        qStmt.finalize((finErr) => {
                            if (finErr) reject(finErr);
                            else resolve({ id: challenge.id });
                        });
                    } else {
                        resolve({ id: challenge.id });
                    }
                });
            });
        });
    }

    deleteMosqueChallenge(id) {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run('DELETE FROM user_mosque_challenge_attempts WHERE challenge_id = ?', [id]);
                this.db.run('DELETE FROM mosque_challenge_questions WHERE challenge_id = ?', [id]);
                this.db.run('DELETE FROM mosque_challenges WHERE id = ?', [id], (err) => {
                    if (err) reject(err);
                    else resolve({ success: true });
                });
            });
        });
    }

    getChallengeById(id) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM mosque_challenges WHERE id = ?`, [id], (err, challenge) => {
                if (err) return reject(err);
                if (!challenge) return resolve(null);

                // Get questions
                this.db.all(`SELECT * FROM mosque_challenge_questions WHERE challenge_id = ? ORDER BY order_index ASC`, [id], (err, questions) => {
                    if (err) return reject(err);
                    challenge.questions = questions.map(q => ({
                        ...q,
                        options: JSON.parse(q.options),
                        correctAnswer: q.correct_answer, // snake_case mapping
                        questionText: q.question_text
                    }));
                    resolve(challenge);
                });
            });
        });
    }

    submitChallengeAttempt(attempt) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO user_mosque_challenge_attempts (id, user_id, challenge_id, score, total_questions, answers)
                         VALUES (?, ?, ?, ?, ?, ?)`;
            this.db.run(sql, [
                attempt.id, attempt.userId, attempt.challengeId,
                attempt.score, attempt.totalQuestions, JSON.stringify(attempt.answers)
            ], (err) => {
                if (err) reject(err);
                else resolve({ id: attempt.id });
            });
        });
    }

    checkUserParticipation(challengeId, userId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM user_mosque_challenge_attempts WHERE challenge_id = ? AND user_id = ?`;
            this.db.get(sql, [challengeId, userId], (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            });
        });
    }

    getChallengeLeaderboard(challengeId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    a.score, 
                    a.total_questions, 
                    a.submitted_at,
                    u.name as user_name
                FROM user_mosque_challenge_attempts a
                JOIN users u ON a.user_id = u.id
                WHERE a.challenge_id = ?
                ORDER BY a.score DESC, a.submitted_at ASC
                LIMIT 20
            `;
            this.db.all(sql, [challengeId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    getChallengeAttempts(challengeId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    umca.*,
                    u.name as user_name,
                    u.phone as user_phone
                FROM user_mosque_challenge_attempts umca
                JOIN users u ON umca.user_id = u.id
                WHERE umca.challenge_id = ?
                ORDER BY umca.score DESC, umca.submitted_at ASC
            `;
            this.db.all(sql, [challengeId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }
}

export default Database;
