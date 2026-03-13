// Script to set temporary password for Rockal
// Run this after deployment: node scripts/set-rockal-password.js

const setTempPassword = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kelatic.x3o.ai';
  
  try {
    const response = await fetch(`${baseUrl}/api/admin/stylists/temp-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'info@kelatic.com'
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Temporary password created successfully!');
      console.log(`👤 User: ${data.user.name} (${data.user.email})`);
      console.log(`🔑 Temporary Password: ${data.tempPassword}`);
      console.log(`⚠️  ${data.instructions}`);
      console.log('\n📧 Send this information to Rockal securely:');
      console.log(`---`);
      console.log(`Login URL: ${baseUrl}/login`);
      console.log(`Email: ${data.user.email}`);
      console.log(`Temporary Password: ${data.tempPassword}`);
      console.log(`Please change this password immediately after logging in.`);
      console.log(`---`);
    } else {
      console.error('❌ Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
};

setTempPassword();