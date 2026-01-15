import Database from './server/database.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testPersistence() {
    const db = new Database();
    await db.init();

    const testPostId = 'test_post_' + Date.now();
    const testUserId = 'test_user_' + Date.now();

    console.log('--- Testing Post Creation ---');
    await db.addPost({
        id: testPostId,
        mosqueId: 'm1',
        content: 'Test Post',
        createdAt: new Date().toISOString(),
        type: 'text'
    });
    console.log('Post created.');

    console.log('--- Testing Like ---');
    await db.addLike(testPostId, testUserId);
    let likes = await db.getPostLikes(testPostId);
    console.log('Likes after add:', likes);

    if (likes !== 1) {
        console.error('❌ Like was not saved correctly!');
    } else {
        console.log('✅ Like saved correctly.');
    }

    console.log('--- Testing Comment ---');
    const comment = {
        id: 'c_' + Date.now(),
        postId: testPostId,
        userId: testUserId,
        userName: 'Test User',
        content: 'Test Comment',
        createdAt: new Date().toISOString()
    };
    await db.addComment(comment);

    let comments = await db.getComments(testPostId);
    console.log('Comments count:', comments.length);
    console.log('First comment content:', comments[0]?.content);

    if (comments.length !== 1 || comments[0].content !== 'Test Comment') {
        console.error('❌ Comment was not saved correctly!');
    } else {
        console.log('✅ Comment saved correctly.');
    }

    // Check the JSON in posts table too
    const post = await db.getPost(testPostId);
    console.log('Post comments JSON length:', post.comments.length);
    if (post.comments.length !== 1) {
        console.error('❌ Comment was not saved in posts JSON correctly!');
    } else {
        console.log('✅ Comment saved in posts JSON correctly.');
    }

    process.exit(0);
}

testPersistence().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
