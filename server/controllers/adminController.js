const db = require('../config/db');

// Get all students
exports.getAllStudents = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, name, email, stream, status, created_at FROM users WHERE role = 'student' ORDER BY created_at DESC"
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get all pending students
exports.getPendingStudents = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, name, email, stream, payment_receipt_url, status, created_at FROM users WHERE role = 'student' AND status = 'pending'"
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Approve or reject student
exports.updateStudentStatus = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { status } = req.body; // 'approved' or 'rejected'

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await db.query(
            "UPDATE users SET status = $1 WHERE id = $2 RETURNING name, email",
            [status, studentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Student not found" });
        }

        const student = result.rows[0];

        // Account updated


        // Add database notification
        await db.query(
            "INSERT INTO notifications (user_id, text) VALUES ($1, $2)",
            [studentId, `Your account application has been ${status}.`]
        );

        res.json({ message: `Student status updated to ${status}`, student: student });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get all courses for admin
exports.getAllCourses = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM courses ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Create a new course
exports.createCourse = async (req, res) => {
    try {
        const { title, description, stream_target, rich_content } = req.body;
        const result = await db.query(
            "INSERT INTO courses (title, description, stream_target, rich_content) VALUES ($1, $2, $3, $4) RETURNING *",
            [title, description, stream_target, rich_content]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Add a resource to a course
exports.addResource = async (req, res) => {
    try {
        const { course_id, title, description, type } = req.body;
        console.log('Adding resource:', { course_id, title, type });
        let file_url = req.body.file_url;

        // If a file was uploaded, use its relative path with normalized slashes
        if (req.file) {
            console.log('File uploaded locally:', req.file.path);
            file_url = req.file.path.replace(/\\/g, '/');
        }

        if (!file_url) {
            console.error('No file URL or file provided');
            return res.status(400).json({ error: 'No file or URL provided' });
        }

        const result = await db.query(
            "INSERT INTO resources (course_id, title, description, file_url, type) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [course_id, title, description, file_url, type]
        );
        console.log('Resource added to DB successfully');
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Add Resource Error:', err);
        res.status(500).json({ error: err.message || 'Server Error' });
    }
};

// Get all quizzes
exports.getQuizzes = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM quizzes ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Create a new quiz for a course
exports.createQuiz = async (req, res) => {
    try {
        const { course_id, title, description } = req.body;
        const result = await db.query(
            "INSERT INTO quizzes (course_id, title, description) VALUES ($1, $2, $3) RETURNING *",
            [course_id, title, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Add a question to a quiz
exports.addQuestion = async (req, res) => {
    try {
        const { quiz_id, question_text, options, correct_answer } = req.body;
        // options should be an array of strings e.g. ["Paris", "London", "Berlin"]
        // correct_answer should be one of the strings e.g. "Paris"
        const result = await db.query(
            "INSERT INTO questions (quiz_id, question_text, options, correct_answer) VALUES ($1, $2, $3, $4) RETURNING *",
            [quiz_id, question_text, JSON.stringify(options), correct_answer]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get resources for a specific course
exports.getCourseResources = async (req, res) => {
    try {
        const { courseId } = req.params;
        console.log('Fetching resources for course:', courseId);
        const result = await db.query(
            "SELECT * FROM resources WHERE course_id = $1 ORDER BY id DESC",
            [courseId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Delete a resource
const { cloudinary } = require('../config/cloudinaryConfig');
const fs = require('fs');
const path = require('path');

exports.deleteResource = async (req, res) => {
    try {
        const { id } = req.params;
        
        // 1. Get resource info first
        const resourceRes = await db.query("SELECT * FROM resources WHERE id = $1", [id]);
        if (resourceRes.rows.length === 0) {
            return res.status(404).json({ error: 'Resource not found' });
        }
        
        const resource = resourceRes.rows[0];

        // 2. Cleanup file from storage
        if (resource.file_url) {
            if (resource.file_url.includes('cloudinary.com')) {
                // Delete from Cloudinary
                try {
                    const parts = resource.file_url.split('/');
                    const uploadIndex = parts.indexOf('upload');
                    if (uploadIndex !== -1) {
                        const publicIdWithExt = parts.slice(uploadIndex + 2).join('/');
                        const publicId = publicIdWithExt.split('.')[0];
                        const isRaw = resource.file_url.includes('/raw/');
                        await cloudinary.uploader.destroy(publicId, { 
                            resource_type: isRaw ? 'raw' : 'image' 
                        });
                    }
                } catch (cloudErr) {
                    console.error('Cloudinary delete failed:', cloudErr);
                }
            } else if (resource.file_url.startsWith('uploads/') || resource.file_url.startsWith('/uploads/')) {
                // Delete from local disk
                try {
                    const localPath = path.join(__dirname, '..', resource.file_url.startsWith('/') ? resource.file_url.substring(1) : resource.file_url);
                    if (fs.existsSync(localPath)) {
                        fs.unlinkSync(localPath);
                        console.log('Local file deleted:', localPath);
                    }
                } catch (fsErr) {
                    console.error('Local file delete failed:', fsErr);
                }
            }
        }

        // 3. Delete from database
        await db.query("DELETE FROM resources WHERE id = $1", [id]);
        
        res.json({ message: 'Resource deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
};

// Get administrative analytics
exports.getAdminAnalytics = async (req, res) => {
    try {
        // Stats counts
        const userStatsData = await db.query("SELECT status, COUNT(*) as count FROM users WHERE role = 'student' GROUP BY status");
        const courseCount = await db.query("SELECT COUNT(*) FROM courses");
        const quizCount = await db.query("SELECT COUNT(*) FROM quizzes");
        
        // Quiz performance (average score per quiz)
        const perfStats = await db.query(`
            SELECT q.title, ROUND(AVG(s.score), 2) as avg_score 
            FROM quizzes q 
            JOIN scores s ON q.id = s.quiz_id 
            GROUP BY q.id, q.title
        `);

        // Format user stats for charts
        const userStats = {
            pending: 0,
            approved: 0,
            rejected: 0
        };
        userStatsData.rows.forEach(row => {
            userStats[row.status] = parseInt(row.count);
        });

        res.json({
            userStats,
            counts: {
                courses: parseInt(courseCount.rows[0].count),
                quizzes: parseInt(quizCount.rows[0].count)
            },
            performance: perfStats.rows
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
