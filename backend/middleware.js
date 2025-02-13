const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./config.js')


const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization');

    try {
        if (token && token.startsWith('Bearer ')) {
            const bearerToken = token.split(' ')[1];
            const { userId } = jwt.verify(bearerToken, JWT_SECRET);
            req.userId = userId;
            next();
        }
    } catch (error) {
        console.log('Error while verifying jwt', error);
        return res.status(403).json({
            message: "Invalid token"
        })
    }

}
module.exports = { authMiddleware }