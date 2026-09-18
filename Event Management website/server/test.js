async function test() {
  const loginRes = await fetch('http://localhost:5001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@codesky.com', password: 'user' })
  });
  const loginData = await loginRes.json();
  console.log('Login:', loginRes.status, loginData);

  const applyRes = await fetch('http://localhost:5001/api/users/admin/apply', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${loginData.token}`
    },
    body: JSON.stringify({ reason: 'I want to be admin' })
  });
  
  const text = await applyRes.text();
  console.log('Apply Status:', applyRes.status);
  console.log('Apply Response Text:', text);
}

test();
