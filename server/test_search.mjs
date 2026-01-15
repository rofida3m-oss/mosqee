import Database from './database.js';

(async () => {
  try {
    const db = new Database();
    await db.init();
    console.log('✅ DB initialized');

    // Test adding a user first with unique phone
    const timestamp = Date.now();
    const testUser = {
      id: 'test_user_' + timestamp,
      name: 'أحمد محمد',
      phone: '20101234' + timestamp.toString().slice(-4),  // Unique phone
      role: 'user',
      isActive: true,
      location: { lat: 30.0444, lng: 31.2357 },
      followingMosques: [],
      registeredLessons: []
    };

    await db.addUser(testUser);
    console.log('✅ Test user added:', testUser.name, testUser.phone);

    // Test search by name
    console.log('\n--- Searching by name "أحمد" ---');
    let results = await db.searchUsers('أحمد');
    console.log(`Found ${results.length} results:`, results);

    // Test search by phone
    console.log('\n--- Searching by phone ---');
    results = await db.searchUsers(testUser.phone);
    console.log(`Found ${results.length} results:`, results);

    // Test search by partial phone
    console.log('\n--- Searching by partial phone "01234" ---');
    results = await db.searchUsers('01234');
    console.log(`Found ${results.length} results:`, results);

    // Test search by ID
    console.log('\n--- Searching by ID ---');
    results = await db.searchUsers(testUser.id.substring(0, 10));
    console.log(`Found ${results.length} results:`, results);

    console.log('\n✅ All search tests completed!');
  } catch (err) {
    console.error('❌ Test script error:', err);
  }
})();
