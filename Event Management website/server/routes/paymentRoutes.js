import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { protect } from '../middleware/authMiddleware.js';
import { findUserById, updateUserProfile } from '../utils/mysql.js';

const router = express.Router();

// Initialize Razorpay conditionally so server doesn't crash if secret is dummy
let razorpayInstance = null;
try {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'dummy_id',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
  });
} catch(e) {
  console.log("Razorpay init failed, will use fallback mode.");
}

// @desc    Create Razorpay Order
router.post('/create-order', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
       return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    if (process.env.RAZORPAY_KEY_SECRET === 'dummy_secret' || !razorpayInstance) {
      // Fallback: return a mock order ID if secret is not set, 
      // but note that Razorpay checkout widget WILL fail if order_id is invalid format.
      // We return success: false so the frontend can fallback to a simulated flow if needed.
      return res.json({ 
        success: true, 
        mock: true, 
        id: `mock_order_${Date.now()}`,
        amount: amount * 100,
        currency: 'INR'
      });
    }

    const options = {
      amount: amount * 100, // amount in paise
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`
    };

    const order = await razorpayInstance.orders.create(options);
    if (!order) {
      return res.status(500).json({ success: false, message: "Failed to create order" });
    }

    res.json({ success: true, ...order });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ success: false, message: "Server error creating order", error: error.message });
  }
});

// @desc    Verify Razorpay Payment
router.post('/verify-razorpay', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, isMock } = req.body;
    
    let isAuthentic = false;

    if (isMock || process.env.RAZORPAY_KEY_SECRET === 'dummy_secret') {
        // Bypass signature verification for mock mode
        isAuthentic = true;
    } else {
        const secret = process.env.RAZORPAY_KEY_SECRET;
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
          .createHmac("sha256", secret)
          .update(body.toString())
          .digest("hex");

        isAuthentic = expectedSignature === razorpay_signature;
    }

    if (isAuthentic) {
      // Update credits (wallet balance)
      const user = await findUserById(req.user._id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      const currentCredits = Number(user.credits || 0);
      const newCredits = currentCredits + Number(amount);
      const updated = await updateUserProfile(req.user._id, { credits: newCredits });

      console.log(`💰 Wallet Top-Up Verified: ${razorpay_payment_id} added ₹${amount}. New balance: ₹${updated?.credits || newCredits}`);

      res.json({
        success: true,
        credits: updated?.credits ?? newCredits,
        transactionId: razorpay_payment_id,
        message: `₹${Number(amount).toFixed(2)} added to your digital wallet successfully!`
      });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: "Server error verifying payment", error: error.message });
  }
});

// @desc    Pay from digital wallet balance
router.post('/pay-wallet', protect, async (req, res) => {
  try {
    const { amount, eventId } = req.body;
    const user = await findUserById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const currentCredits = Number(user.credits || 0);
    if (currentCredits < Number(amount)) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance.' });
    }

    const newCredits = currentCredits - Number(amount);
    const updated = await updateUserProfile(req.user._id, { credits: newCredits });

    console.log(`⚡ Wallet Payment Processed: Deducted ₹${amount} for event ${eventId}. Remaining: ₹${updated?.credits || newCredits}`);

    res.json({
      success: true,
      credits: updated?.credits ?? newCredits,
      transactionId: 'wallet_claim_' + Date.now(),
      message: 'Paid using Digital Wallet successfully!'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
