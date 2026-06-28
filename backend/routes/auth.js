const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { sendOTP, verifyOTP, verifyResetToken, clearOTP } = require('../utils/emailOtp');
const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

router.post('/register', register);
router.post('/login', login);

// STEP 1 — Send OTP to email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

  try {
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).json({ success: false, message: 'No account found with this email.' });

    await sendOTP(email);
    res.json({ success: true, message: 'OTP sent to your email.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
});

// STEP 2 — Verify OTP
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required.' });

  const result = verifyOTP(email, otp);
  if (!result.valid) return res.status(400).json({ success: false, message: result.message });

  res.json({ success: true, message: 'OTP verified.', resetToken: result.resetToken });
});

// STEP 3 — Reset password
router.post('/reset-password', async (req, res) => {
  const { email, resetToken, newPassword } = req.body;
  if (!email || !resetToken || !newPassword) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  if (!verifyResetToken(email, resetToken)) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
  }

  try {
    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashed, email]);
    clearOTP(email);
    res.json({ success: true, message: 'Password reset successfully. Please login.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
});

module.exports = router;