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

        // Store user info in session
        req.session.user = user;
        console.log('User logged in:', user);

        // Redirect based on user role
        if (user.role === 'admin') {
            res.redirect('/admindashboard'); // Redirect to admindashboard if the user is an admin
        } else {
            res.redirect('/userdashboard'); // Redirect to userdashboard for regular users
        }
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

// Route for user dashboard (ensure user is authenticated)
router.get('/userdashboard', (req, res) => {
    // Check if user is logged in
    if (!req.session.user) {
        req.session.errorMessage = 'You must be logged in to access the dashboard'; // Set error message
        return res.redirect('/login'); // Redirect to login page if not authenticated
    }

    // If the user is logged in, render the dashboard
    res.render('userdashboard', { user: req.session.user }); // Pass user info to the dashboard
});

router.get('/admindashboard', (req, res) => {
    res.render('admindashboard'); // Render the admin dashboard view
});

router.get('/appointment', (req, res) => {
    res.render('appointment'); // Render the admin dashboard view
});

router.get('/message', (req, res) => {
    res.render('message'); // Render the admin dashboard view
});

router.get('/history', (req, res) => {
    res.render('history'); // Render the admin dashboard view
});

module.exports = router;