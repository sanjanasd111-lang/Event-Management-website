import { createAdminApplication, setAdminApplicationDecision } from './utils/mysql.js';

async function testApprove() {
  try {
    console.log('1. Creating a test admin application...');
    const application = await createAdminApplication({
      userId: 'user_123',
      name: 'Test User',
      email: 'user@codesky.com', // Must match the test user email
      reason: 'I would like to help manage events.'
    });
    console.log('Application created:', application);

    console.log('\n2. Approving the application...');
    const approvedApp = await setAdminApplicationDecision({
      applicationId: application._id,
      status: 'approved',
      adminEmail: 'admin@codesky.com'
    });
    console.log('Application approved:', approvedApp);
    
    console.log('\nSuccess! The application was approved and an email should have been sent.');
    process.exit(0);
  } catch (error) {
    console.error('Error testing approval:', error);
    process.exit(1);
  }
}

testApprove();
