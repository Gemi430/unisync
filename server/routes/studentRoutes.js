const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const auth = require('../middleware/authMiddleware');
const student = require('../middleware/studentMiddleware');

// Apply auth and student middleware
router.use(auth, student);

// Routes
router.get('/courses', studentController.getCourses);
router.get('/courses/:courseId/resources', studentController.getCourseResources);
router.get('/courses/:courseId/quizzes', studentController.getCourseQuizzes);
router.get('/quizzes/:quizId/questions', studentController.getQuizQuestions);
router.post('/quizzes/:quizId/submit', studentController.submitQuizScore);

// Profile routes
router.get('/profile', studentController.getProfile);
router.put('/profile', studentController.updateProfile);
router.get('/analytics', studentController.getStudentAnalytics);

module.exports = router;
