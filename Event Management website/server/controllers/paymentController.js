import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';

export const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    
    // Fallback if keys are missing to prevent crash, though it will fail at checkout
    const razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'dummy_id',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
    });

    const options = {
      amount: amount * 100, // amount in the smallest currency unit
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`
    };

    const order = await razorpayInstance.orders.create(options);

    if (!order) {
      return res.status(500).json({ message: "Failed to create order" });
    }

    res.json(order);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ message: "Server error creating order", error: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Find user and update credits
      const user = await User.findById(req.user._id);
      if (!user) {
         return res.status(404).json({ message: 'User not found' });
      }
      
      // Update credits (wallet balance)
      user.credits += Number(amount);
      await user.save();

      res.json({
        message: "Payment successfully verified",
        credits: user.credits,
        paymentId: razorpay_payment_id
      });
    } else {
      res.status(400).json({ message: "Invalid signature" });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: "Server error verifying payment", error: error.message });
  }
};
