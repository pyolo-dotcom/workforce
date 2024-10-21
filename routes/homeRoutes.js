const express = require('express');
const bcrypt = require('bcrypt'); // Ensure bcrypt is required
const router = express.Router();
const User = require('../models/User'); // Ensure User model is required
const homeController = require('../controllers/homeController');

// Route for home page
router.get('/', homeController.getHomePage);

// Route for login page
router.get('/login', (req, res) => {
    const errorMessage = req.session.errorMessage || null; // Get error message from session
    req.session.errorMessage = null; // Clear error message after displaying it
    res.render('login', { errorMessage }); // Pass error message to EJS
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            req.session.errorMessage = 'User not found'; // Set error message
            return res.redirect('/login'); // Redirect back to login page
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.session.errorMessage = 'Invalid credentials'; // Set error message
            return res.redirect('/login'); // Redirect back to login page
        }
        req.session.user = user; // Store user info in session
        console.log('User logged in:', user);
        res.redirect('/'); // Redirect to index.ejs on successful login
    } catch (err) {
        console.error('Error during login:', err);
        req.session.errorMessage = 'An error occurred during login'; // Set error message
        res.redirect('/login'); // Redirect back to login page
    }
});

// Route for sign-up page
router.get('/signup', (req, res) => {
    res.render('signup'); // Render the sign-up page
});

// Handle sign-up form submission
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('User already exists');
        }

        // Hash the password before saving it to the database
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
        });

        // Save the user to the database
        await newUser.save();

        console.log('User registered:', newUser);

        // Redirect to the login page after successful sign-up
        res.redirect('/login');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
