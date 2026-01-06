/**
 * Simple script to create test accounts via API endpoints
 * Run with: node scripts/create-test-accounts-api.js
 */

const fetch = require('node-fetch');

const baseUrl = 'http://localhost:3000'; // Change if running on different port
const testPassword = 'TestPassword123!';

async function createTestAccounts() {
  console.log('🚀 Creating test accounts via API...\n');

  const testClient = {
    email: 'testclient@kelatic.com',
    password: testPassword,
    first_name: 'Test',
    last_name: 'Client',
    phone: '+15551234567',
    role: 'client',
  };

  const testStylist = {
    first_name: 'Test',
    last_name: 'Stylist',
    email: 'teststylist@kelatic.com',
    phone: '+15551234568',
    bio: 'Test stylist account for development and testing',
    specialties: ['locs', 'braids', 'natural'],
    commission_rate: 60.00,
  };

  try {
    // Create stylist via admin API
    console.log('💇‍♀️ Creating test stylist...');
    const stylistResponse = await fetch(`${baseUrl}/api/admin/stylists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testStylist),
    });

    if (stylistResponse.ok) {
      const stylistData = await stylistResponse.json();
      console.log('✅ Test stylist profile created!');
      console.log(`   Name: ${testStylist.first_name} ${testStylist.last_name}`);
      console.log(`   Email: ${testStylist.email}`);
      
      // Send invite to create auth account
      console.log('📧 Sending stylist invite...');
      const inviteResponse = await fetch(`${baseUrl}/api/admin/stylists/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stylist_id: stylistData.stylist.id,
          email: testStylist.email,
        }),
      });

      if (inviteResponse.ok) {
        console.log('✅ Stylist invite sent! Check email for password setup.');
      } else {
        console.log('⚠️  Stylist profile created, but invite failed. You can set a temp password.');
      }
      
      // Set temporary password for easier testing
      console.log('🔐 Setting temporary password for stylist...');
      const tempPasswordResponse = await fetch(`${baseUrl}/api/admin/stylists/temp-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testStylist.email,
        }),
      });

      if (tempPasswordResponse.ok) {
        const tempData = await tempPasswordResponse.json();
        console.log(`✅ Temporary password set: ${tempData.tempPassword}`);
        console.log(`   You can login at: /login?type=stylist`);
        console.log(`   Dashboard: /stylist\n`);
      }
    } else {
      const error = await stylistResponse.text();
      console.log('❌ Failed to create stylist:', error);
    }

    console.log('\n📋 Test Account Summary:');
    console.log('========================');
    console.log('STYLIST ACCOUNT:');
    console.log(`  Email: ${testStylist.email}`);
    console.log(`  Password: Check console output above`);
    console.log('  Login URL: /login?type=stylist');
    console.log('  Dashboard: /stylist');
    console.log('');
    console.log('CLIENT ACCOUNT:');
    console.log('  Clients are created when they make their first booking.');
    console.log('  You can test the booking flow at: /book');
    console.log('');
    console.log('ADMIN ACCESS:');
    console.log('  Visit /admin to manage stylists and view appointments');

  } catch (error) {
    console.error('💥 Error creating test accounts:', error);
    console.log('\n⚠️  Make sure the application is running on port 3000');
    console.log('   Run: npm run dev');
  }
}

createTestAccounts();