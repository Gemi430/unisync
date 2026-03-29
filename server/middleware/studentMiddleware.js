module.exports = function(req, res, next) {
    if (req.user && req.user.role === 'student') {
        if (req.user.status === 'approved') {
            next();
        } else {
            res.status(403).json({ error: 'Access denied: Account pending approval' });
        }
    } else {
        res.status(403).json({ error: 'Access denied: Student only' });
    }
};
