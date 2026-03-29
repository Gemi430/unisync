const nodemailer = require('nodemailer');

// For development/testing, we can use a mock account from Ethereal
// In production, use your actual Gmail/SMTP credentials
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'testuser@ethereal.email', // Replace with dynamic test account if needed
        pass: 'testpass'
    }
});

// Helper to create a test account if none exists
const createTestAccount = async () => {
    try {
        const testAccount = await nodemailer.createTestAccount();
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
    } catch (err) {
        console.error('Email service fall-back failed:', err);
        return null;
    }
};

exports.sendWelcomeEmail = async (email, name) => {
    try {
        const mailOptions = {
            from: '"University Resource Platform" <noreply@uniplatform.edu>',
            to: email,
            subject: 'Account Approved - Welcome to the Platform!',
            text: `Hello ${name},\n\nYour account has been approved by our administrators. You can now log in and access all your courses and resources.\n\nHappy Learning!`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #0ea5e9;">Welcome, ${name}!</h2>
                    <p>Great news! Your application to the <strong>University Resource Platform</strong> has been approved.</p>
                    <p>You can now log in to your dashboard to access:</p>
                    <ul>
                        <li>Curated Course Materials</li>
                        <li>Interactive Quizzes</li>
                        <li>Downloadable Resources</li>
                    </ul>
                    <a href="http://localhost:5173/login" style="display: inline-block; padding: 10px 20px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Login to Dashboard</a>
                    <p style="margin-top: 20px; font-size: 0.8em; color: #777;">If you did not request this account, please ignore this email.</p>
                </div>
            `
        };

        // For this demo, we'll log the "sent" email URL if using Ethereal
        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        return true;
    } catch (err) {
        console.error('Email failed to send:', err);
        return false;
    }
};
