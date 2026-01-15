const axios = require('axios');

async function testChallengeRetrieval() {
    const baseUrl = 'http://localhost:5000/api';

    console.log('--- Testing Challenge Retrieval ---');

    try {
        // 1. Get all mosques to find a challenge
        const mosquesRes = await axios.get(`${baseUrl}/mosques`);
        const mosques = mosquesRes.data;

        for (const mosque of mosques) {
            console.log(`Checking challenges for mosque: ${mosque.name} (${mosque.id})`);
            const challengesRes = await axios.get(`${baseUrl}/mosques/${mosque.id}/challenges`);
            const challenges = challengesRes.data;

            if (challenges.length > 0) {
                const challengeId = challenges[0].id;
                console.log(`Found mosque challenge: ${challengeId}`);

                // Test the consolidated endpoint
                console.log(`Testing GET /challenges/${challengeId}...`);
                const challengeDetailRes = await axios.get(`${baseUrl}/challenges/${challengeId}`);
                console.log('Result:', challengeDetailRes.data.title);
                console.log('Questions found:', challengeDetailRes.data.questions?.length || 0);

                if (challengeDetailRes.data.questions && challengeDetailRes.data.questions.length > 0) {
                    console.log('✅ Mosque challenge retrieval SUCCESSFUL');
                } else {
                    console.log('❌ Mosque challenge retrieval FAILED (no questions)');
                }
                break;
            }
        }
    } catch (error) {
        console.error('❌ Error during test:', error.response?.data || error.message);
    }
}

testChallengeRetrieval();
