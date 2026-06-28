const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Store OTPs in memory: email -> { otp, expiry, resetToken }
const otpStore = new Map();

const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

const sendOTP = async (email) => {
  const otp = generateOTP();
  const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(email, { otp, expiry, resetToken: null });

  await resend.emails.send({
    from: 'PharmaTrack <onboarding@resend.dev>',
    to: email,
    subject: 'Your PharmaTrack Password Reset OTP',
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;">
        <h2 style="color:#028090;margin-bottom:8px;">PharmaTrack</h2>
        <p style="color:#1F2D2E;font-size:15px;">Your OTP for password reset:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#028090;margin:24px 0;">${otp}</div>
        <p style="color:#5C6B6C;font-size:13px;">This OTP expires in <b>10 minutes</b>.</p>
        <p style="color:#5C6B6C;font-size:13px;">If you did not request this, ignore this email.</p>
      </div>
    `,
  });

  return true;
};

const verifyOTP = (email, otp) => {
  const record = otpStore.get(email);
  if (!record) return { valid: false, message: 'OTP not found. Please request again.' };
  if (Date.now() > record.expiry) {
    otpStore.delete(email);
    return { valid: false, message: 'OTP expired. Please request again.' };
  }
  if (record.otp !== otp) return { valid: false, message: 'Invalid OTP.' };

  // Generate a reset token
  const resetToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
  otpStore.set(email, { ...record, resetToken });
  return { valid: true, resetToken };
};

const verifyResetToken = (email, token) => {
  const record = otpStore.get(email);
  if (!record || record.resetToken !== token) return false;
  return true;
};

const clearOTP = (email) => otpStore.delete(email);

module.exports = { sendOTP, verifyOTP, verifyResetToken, clearOTP };