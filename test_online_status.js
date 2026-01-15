import fetch from 'node-fetch';

async function test() {
    const debugUrl = 'http://localhost:5000/api/debug/online-users';
    try {
        const debugRes = await fetch(debugUrl);
        const debugData = await debugRes.json();
        console.log('Online IDs:', debugData.onlineIds);

        if (debugData.onlineIds.length > 0) {
            const targetId = debugData.onlineIds[0];
            const searchUrl = `http://localhost:5000/api/users/search?q=${targetId}`;
            const searchRes = await fetch(searchUrl);
            const results = await searchRes.json();
            console.log('Search Result for', targetId, ':', JSON.stringify(results, null, 2));
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

test();
