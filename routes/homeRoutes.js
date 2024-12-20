const express = require('express');
const bcrypt = require('bcryptjs'); // Ensure bcrypt is required
const router = express.Router();
const User = require('../models/User'); // Ensure User model is required
const Job = require('../models/Job');
const job = require('../routes/job');
const homeController = require('../controllers/homeController');
const Form = require('../models/Form'); // Correct path
const formRoutes = require('./form'); // Make sure this path is correct

router.use(formRoutes);

// Authentication middleware
function isAuthenticated(req, res, next) {
    if (req.session.user) { // Check if user is stored in session
        return next();
    }
    res.redirect('/login'); // Redirect to login if not authenticated
}

// Route for home page
router.get('/', async (req, res) => {
    try {
        const jobs = await Job.find(); // Fetch jobs from the database
        res.render('index', { jobs }); // Pass jobs to the main home template
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).send('Internal Server Error');
    }
});

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
router.get('/userdashboard', isAuthenticated, async (req, res) => {
    try {
        const jobs = await Job.find(); // Fetch jobs from the database
        // If the user is logged in, render the dashboard
        res.render('userdashboard', { user: req.session.user, jobs }); // Pass user info and jobs to the dashboard
    } catch (error) {
        console.error('Error fetching jobs for user dashboard:', error);
        res.status(500).send('Internal Server Error');
    }
}); 

router.get('/admindashboard', isAuthenticated, async (req, res) => {
    try {
        // Count the total number of users
        const totalUsers = await User.countDocuments({});
        
        // Count the total number of jobs
        const totalJobs = await Job.countDocuments(); // Count total jobs
        
        // Count the total number of appointments
        const totalAppointments = await Form.countDocuments(); // If Form is your appointment model

        // Pass the total counts to the EJS template
        res.render('admindashboard', { totalUsers, totalJobs, totalAppointments }); // Pass all three values
    } catch (error) {
        console.error('Error fetching total users, jobs, or appointments:', error);
        res.status(500).send('Internal Server Error');
    }
});



router.get('/appointment', async (req, res) => {
    try {
        const appointments = await Form.find(); // Fetch data from the Form model
        console.log('Appointments:', appointments); // Check the result
        res.render('appointment', { appointments });
    } catch (err) {
        console.error('Error fetching appointments:', err);
        res.status(500).send("Error fetching appointments");
    }
});

router.get('/message', isAuthenticated, (req, res) => {
    res.render('message'); // Render the message view
});

router.get('/history', isAuthenticated, (req, res) => {
    res.render('history'); // Render the history view
});

// Route to display all jobs
router.get('/jobs', async (req, res) => {
    try {
        const jobs = await Job.find(); // Retrieve all jobs from the database
        res.render('jobs', { jobs }); // Pass jobs to the jobs.ejs view
    } catch (error) {
        console.error('Error retrieving jobs:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Add the form route
router.get('/form', async (req, res) => {
    try {
        const jobs = await Job.find(); // Fetch jobs from the database
        res.render('form', { jobs }); // Pass jobs to the form view
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Profile route, protected by authentication middleware
router.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user._id;
        const user = await User.findById(userId);
        res.render('profile', { user }); // Pass user with profilePicture to profile.ejs
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Notification route, protected by authentication middleware
router.get('/notification', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user._id;
        const user = await User.findById(userId);
        res.render('notification', { user }); // Pass user to notification view
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).send('Internal Server Error');
    }
});

// PATCH route for updating messages
router.patch('/api/messages/:id', async (req, res) => {
    const { action } = req.body; // Get the action from the request body
    const messageId = req.params.id; // Get the message ID from the URL

    try {
        // Update the message in your database based on action
        const updatedMessage = await Message.findByIdAndUpdate(messageId, {
            isReviewed: true,
            status: action === 'accept' ? 'Accepted' : 'Declined'
        }, { new: true });

        res.json(updatedMessage);
    } catch (error) {
        res.status(500).json({ error: 'Error updating message' });
    }
});


module.exports = router;
