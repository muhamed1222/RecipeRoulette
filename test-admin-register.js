// Test script for admin registration function

async function testAdminRegister() {
  console.log('Testing admin registration function...');
  
  try {
    const response = await fetch('https://lmpmkszgwwwqvbdhxest.supabase.co/functions/v1/admin/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        companyName: 'Test Company'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('Response text:', text);
    }
    
    if (response.ok) {
      console.log('✅ Registration test passed!');
    } else {
      console.log('❌ Registration test failed with status:', response.status);
    }
  } catch (error) {
    console.error('❌ Registration test failed with error:', error.message);
  }
}

// Run the test
testAdminRegister().catch(console.error);