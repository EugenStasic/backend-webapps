const jwt = require('jsonwebtoken');

const jwtMiddleware = (req, res, next) => {
    const token = req.cookies.jwtToken;

    if (!token) return res.status(401).json({ message: 'No token provided.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Failed to authenticate token.' });

        req.userId = decoded.userId;
        next();
    });
};

module.exports =  jwtMiddleware;