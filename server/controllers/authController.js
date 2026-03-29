const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const emailService = require('../services/emailService');

// Register a new student
exports.registerStudent = async (req, res) => {
    try {
        const { name, email, password, stream } = req.body;
        // The payment receipt URL will be provided via Multer middleware in the route
        // Save relative path for storage
        // Save relative path for storage, ensuring forward slashes
        const paymentReceiptUrl = req.file ? req.file.path.replace(/\\/g, '/') : null;

        if (!name) return res.status(400).json({ error: 'Name is required' });
        if (!email) return res.status(400).json({ error: 'Email is required' });
        if (!password) return res.status(400).json({ error: 'Password is required' });
        if (!stream) return res.status(400).json({ error: 'Stream is required' });
        if (!paymentReceiptUrl) return res.status(400).json({ error: 'Payment receipt file is required (Cloudinary upload failed or no file selected)' });

        // Check if user exists
        const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert new user into database with 'pending' status
        const newUser = await db.query(
            'INSERT INTO users (name, email, password_hash, role, stream, payment_receipt_url, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, role, stream, status',
            [name, email, passwordHash, 'student', stream, paymentReceiptUrl, 'pending']
        );

        // Send registration email
        await emailService.sendRegistrationEmail(email, name);

        res.status(201).json({ message: 'Registration successful. Waiting for admin approval.', user: newUser.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Register a new admin
exports.registerAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Admins default to 'both' stream for integrity, and are automatically approved.
        const newUser = await db.query(
            'INSERT INTO users (name, email, password_hash, role, stream, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, status',
            [name, email, passwordHash, 'admin', 'natural', 'approved']
        );

        res.status(201).json({ message: 'Admin registration successful.', user: newUser.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check user
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid Credentials' });
        }

        const user = userResult.rows[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid Credentials' });
        }

        // Return JWT
        const payload = {
            user: {
                id: user.id,
                role: user.role,
                status: user.status
            }
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret_token_123',
            { expiresIn: '10h' }
        );

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
