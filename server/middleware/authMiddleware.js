const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // ✅ Correct access for your payload
            const userId = decoded.user.id;

            req.user = await User.findById(userId).select('-password');

            if (!req.user) {
                return res.status(401).json({
                    message: 'Not authorized, user not found',
                });
            }

            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({
                message: 'Not authorized, token failed',
            });
        }
    } else {
        return res.status(401).json({
            message: 'Not authorized, no token',
        });
    }
};

module.exports = { protect };