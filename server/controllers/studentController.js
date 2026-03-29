const db = require('../config/db');

// Get courses for student's stream
exports.getCourses = async (req, res) => {
    try {
        // get student stream
        const userResult = await db.query('SELECT stream FROM users WHERE id = $1', [req.user.id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userStream = userResult.rows[0].stream;

        // get courses
        const courses = await db.query(
            `SELECT id, title, description, rich_content FROM courses 
             WHERE stream_target = $1 OR stream_target = 'both'`, [userStream]
        );
        res.json(courses.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get resources for a specific course
exports.getCourseResources = async (req, res) => {
    try {
        const { courseId } = req.params;
        // Verify course is accessible to this student's stream
        const userResult = await db.query('SELECT stream FROM users WHERE id = $1', [req.user.id]);
        const stream = userResult.rows[0].stream;

        const courseResult = await db.query('SELECT * FROM courses WHERE id = $1', [courseId]);
        if (courseResult.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }
        if (courseResult.rows[0].stream_target !== stream && courseResult.rows[0].stream_target !== 'both') {
            return res.status(403).json({ error: 'Access denied to this course' });
        }

        const resources = await db.query('SELECT * FROM resources WHERE course_id = $1', [courseId]);
        res.json(resources.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get quizzes for a specific course
exports.getCourseQuizzes = async (req, res) => {
    try {
        const { courseId } = req.params;
        const result = await db.query('SELECT * FROM quizzes WHERE course_id = $1', [courseId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get questions for a specific quiz (without correct answers)
exports.getQuizQuestions = async (req, res) => {
    try {
        const { quizId } = req.params;
        const result = await db.query('SELECT id, question_text, options FROM questions WHERE quiz_id = $1', [quizId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Submit quiz score
exports.submitQuizScore = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { answers } = req.body; // { questionId: 'answerText', ... }
        
        // Fetch correct answers
        const questionsResult = await db.query('SELECT id, correct_answer FROM questions WHERE quiz_id = $1', [quizId]);
        const questions = questionsResult.rows;

        let score = 0;
        questions.forEach(q => {
            if (answers[q.id] === q.correct_answer) {
                score += 1;
            }
        });

        const scorePercent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
        
        // Fetch course name for notification
        const quizInfo = await db.query('SELECT q.title FROM quizzes q WHERE q.id = $1', [quizId]);

        // Save score
        const result = await db.query(
            "INSERT INTO scores (student_id, quiz_id, score) VALUES ($1, $2, $3) RETURNING *",
            [req.user.id, quizId, scorePercent]
        );

        // Add database notification
        await db.query(
            "INSERT INTO notifications (user_id, text) VALUES ($1, $2)",
            [req.user.id, `You completed the quiz "${quizInfo.rows[0].title}" with a score of ${scorePercent}%.`]
        );

        res.status(201).json({ score: scorePercent, scoreId: result.rows[0].id });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get student profile
exports.getProfile = async (req, res) => {
    try {
        const result = await db.query("SELECT name, email, stream, status, avatar_url, bio FROM users WHERE id = $1", [req.user.id]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Update student profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, bio, avatar_url, stream } = req.body;
        const result = await db.query(
            "UPDATE users SET name = $1, bio = $2, avatar_url = $3, stream = $4 WHERE id = $5 RETURNING name, email, stream, avatar_url, bio",
            [name, bio, avatar_url, stream, req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get student analytics
exports.getStudentAnalytics = async (req, res) => {
    try {
        const studentId = req.user.id;
        
        // Get total quizzes taken
        const totalQuizzes = await db.query('SELECT COUNT(DISTINCT quiz_id) as count FROM scores WHERE student_id = $1', [studentId]);
        
        // Get average score
        const avgScore = await db.query('SELECT AVG(score) as avg FROM scores WHERE student_id = $1', [studentId]);
        
        // Get latest scores
        const recentScores = await db.query(`
            SELECT q.title, s.score, s.completed_at 
            FROM scores s 
            JOIN quizzes q ON s.quiz_id = q.id 
            WHERE s.student_id = $1 
            ORDER BY s.completed_at DESC 
            LIMIT 10
        `, [studentId]);

        res.json({
            stats: {
                totalQuizzes: parseInt(totalQuizzes.rows[0].count),
                averageScore: Math.round(parseFloat(avgScore.rows[0].avg || 0))
            },
            recentScores: recentScores.rows
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
