const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

// PROVJERA AUTENTIFIKACIJE - JWT
const jwtMiddleware = (req, res, next) => {
    const token = req.cookies.jwtToken;

    if (!token) return res.status(401).json({ message: 'No token provided.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Failed to authenticate token.' });

        req.userId = decoded.userId;
        next();
    });
};

// REGISTRACIJA
router.post('/register', async (req, res) => {
    const { ime, prezime, email, password } = req.body;

    if (!ime || !prezime || !email || !password) return res.status(400).json({ success: false, message: "Please fill all required fields" });

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ success: false, message: "User with this e-mail already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ ime, prezime, email, password: hashedPassword });

    try {
        await newUser.save();
        res.status(201).json({ success: true, message: "User Created" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error in creating a user", error: err.message });
    }
});

// PRIJAVA
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: 'User not found.' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).json({ success: false, message: 'Wrong Password.' });

    const tokenSecret = process.env.JWT_SECRET;  
    const token = jwt.sign({ userId: user._id }, tokenSecret, { expiresIn: '1h' });

    res.cookie('jwtToken', token, { httpOnly: true, maxAge: 3600000, sameSite: 'lax' });
    res.json({ success: true, message: 'Uspješno prijavljen!', token: token });
});

// Dohvaćanje korisničkih podataka
router.get('/me', jwtMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        res.json(user);
    } catch (error) {
        res.status(500).json({ success: false, message: 'GET User Error.', error: error.message });
    }
});

// ODJAVA
router.get('/logout', (req, res) => {
    res.clearCookie('jwtToken');
    res.status(200).json({ message: "Logged out." });
});

router.get('/homepage', jwtMiddleware, (req, res) => {
    res.send('<h1>DOBRODOŠLI</h1>');
});

// PROVJERA AUTENTIFIKACIJE
router.get('/checkAuth', jwtMiddleware, (req, res) => {
    res.json({ isAuthenticated: true });
});

module.exports = router;
