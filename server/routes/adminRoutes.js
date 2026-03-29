const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');

// Apply auth and admin middleware to all routes in this file
router.use(auth, admin);

// Student management routes
// User management routes
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/students/pending', adminController.getPendingStudents);
router.put('/students/:studentId/status', adminController.updateStudentStatus);

// Course and resource management routes
const { upload } = require('../config/cloudinaryConfig');

router.get('/courses', adminController.getAllCourses);
router.post('/courses', adminController.createCourse);
router.delete('/courses/:id', adminController.deleteCourse);
router.get('/courses/:courseId/resources', adminController.getCourseResources);
router.post('/resources', upload.single('resourceFile'), adminController.addResource);
router.delete('/delete-resource/:id', adminController.deleteResource);

router.get('/quizzes', adminController.getQuizzes);
router.post('/quizzes', adminController.createQuiz);
router.post('/questions', adminController.addQuestion);

router.get('/analytics', adminController.getAdminAnalytics);

module.exports = router;
