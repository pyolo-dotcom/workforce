const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

// Route for home page
router.get('/', homeController.getHomePage);

// Route for login page
router.get('/login', (req, res) => {
    res.render('login'); // Ensure you have a login.ejs file
});

// Route for sign-up page
router.get('/signup', (req, res) => {
    res.render('signup'); // Render the sign-up page
});

// Handle sign-up form submission
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    try {
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

        console.log('User registered:', { username, email });

        // Redirect to the login page after successful sign-up
        res.redirect('/login');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Internal Server Error');
    }
});


module.exports = router;
