const express = require('express');
const Razorpay = require('razorpay');
const router = express.Router();
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post('/create-order', async (req, res) => {
  const { amount } = req.body;

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
    });
    res.json(order);
  } catch (err) {
    console.log("error form razorpay", err);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
});

module.exports = router;
