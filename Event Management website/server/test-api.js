import { createAdminApplication, setAdminApplicationDecision, createAdminUserForEmail, getPool } from './utils/mysql.js';
import { sendAdminInviteEmail } from './utils/sendAdminInviteEmail.js';
import crypto from 'node:crypto';

async function testApprove() {
  try {
    console.log('1. Creating a test admin application...');
    const application = await createAdminApplication({
      userId: 'user_123',
      name: 'Test User',
      email: 'user@codesky.com', // Must match the test user email
      reason: 'I would like to help manage events.'
    });
    console.log('Application created:', application._id);

    console.log('\n2. Executing Approval Logic (like the API)...');
    
    // Get decision
    const updated = await setAdminApplicationDecision({
      applicationId: application._id,
      status: 'approved',
      adminEmail: 'admin@codesky.com',
    });
    
    if (!updated) throw new Error('Application not found');
    
    console.log('Status updated in DB.');

    // Create admin user account with temp password
    const tempPassword = `Temp${crypto.randomBytes(3).toString('hex')}`;
    await createAdminUserForEmail({
      adminEmail: updated.email,
      tempPassword,
    });
    console.log('Admin user updated with temp password.');

    // Send email with credentials
    const sent = await sendAdminInviteEmail({
      toEmail: updated.email,
      toName: updated.name,
      adminEmail: updated.email,
      adminPassword: tempPassword,
    });

    if (!sent) {
      console.error('Approved but failed to send email!');
    } else {
      console.log('Success! Application approved and email sent.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error testing approval:', error);
    process.exit(1);
  }
}

testApprove();
