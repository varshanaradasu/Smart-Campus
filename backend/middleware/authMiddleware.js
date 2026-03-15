const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401);
        throw new Error('Not authorized, token missing');
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            res.status(401);
            throw new Error('User no longer exists');
        }

        next();
    } catch (error) {
        res.status(401);
        throw new Error('Not authorized, invalid token');
    }
};

const authorize = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        res.status(403);
        throw new Error('Forbidden: insufficient role permissions');
    }
    next();
};

const requireAdmin = authorize('admin');
const requireFaculty = authorize('faculty');

module.exports = { protect, authorize, requireAdmin, requireFaculty };
