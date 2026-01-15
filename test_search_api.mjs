import { dbQueries } from './services/dbService.js';

// Test search
(async () => {
    try {
        console.log('Testing search API...');
        const results = await dbQueries.searchUsers('test');
        console.log('Search results:', results);
    } catch (err) {
        console.error('Error:', err);
    }
})();
