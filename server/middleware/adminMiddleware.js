module.exports = function(req, res, next) {
    // Determine admin status
    // Assuming authMiddleware has already run and populated req.user
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied: Admin only' });
    }
};
