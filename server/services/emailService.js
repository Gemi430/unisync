const nodemailer = require('nodemailer');
require('dotenv').config();

// Prioritize environment variables for production (Gmail, SendGrid, etc.)
// For development/fallback, we use Ethereal
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || 'testuser@ethereal.email', 
        pass: process.env.SMTP_PASS || 'testpass'
    }
});

// Send email to student when they first register
exports.sendRegistrationEmail = async (email, name) => {
    try {
        const mailOptions = {
            from: '"UniSync Platform" <noreply@uniplatform.edu>',
            to: email,
            subject: 'Registration Received - UniSync',
            text: `Hello ${name},\n\nThank you for registering on UniSync! Your application is currently pending admin approval. You will receive another email once an administrator verifies your payment receipt.\n\nThank you for your patience!`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #0ea5e9;">Thanks for Joining, ${name}!</h2>
                    <p>Your registration for the <strong>University Resource Platform (UniSync)</strong> has been received successfully.</p>
                    <p><strong>Next Steps:</strong> Our administrators will now review your tuition receipt. Once approved, you will have full access to your course resources and quizzes.</p>
                    <p>You will receive an email confirmation immediately upon approval.</p>
                    <p style="margin-top: 20px; font-size: 0.8em; color: #777;">UniSync Team</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Registration email sent: %s', info.messageId);
        return true;
    } catch (err) {
        console.error('Registration email failed:', err.message);
        return false;
    }
};

// Send email to student when admin approves them
exports.sendWelcomeEmail = async (email, name) => {
    try {
        const mailOptions = {
            from: '"UniSync Platform" <noreply@uniplatform.edu>',
            to: email,
            subject: 'Account Approved - Welcome to UniSync!',
            text: `Hello ${name},\n\nYour account has been approved! You can now log in and access all your courses and resources.\n\nHappy Learning!`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #0ea5e9;">Welcome, ${name}!</h2>
                    <p>Great news! Your account on <strong>UniSync</strong> has been approved.</p>
                    <p>You can now log in to your dashboard to access premium course materials and quizzes.</p>
                    <a href="https://uni-resource-platform.web.app/login" style="display: inline-block; padding: 12px 24px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Login to Dashboard</a>
                    <p style="margin-top: 20px; font-size: 0.8em; color: #777;">If you have any issues, please contact support.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Approval email sent: %s', info.messageId);
        return true;
    } catch (err) {
        console.error('Approval email failed:', err.message);
        return false;
    }
};
