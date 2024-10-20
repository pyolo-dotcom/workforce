const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const session = require('express-session');
const User = require('./models/User');

const app = express();
const PORT = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/workforceDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected...'))
.catch(err => console.log(err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
}));

// Serve static files from the 'public' folder
app.use(express.static('public'));

// Set EJS as the template engine
app.set('view engine', 'ejs');

// Route to render the index.ejs page
app.get('/', (req, res) => {
    res.render('index');
});

// Signup route
app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('User already exists');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });
        await newUser.save();
        console.log('User registered:', newUser);
        res.send('User registered successfully');
    } catch (err) {
        console.error('Error during signup:', err);
        res.status(500).send('Error during signup');
    }
});

// Login route
app.get('/login', (req, res) => {
    const errorMessage = req.session.errorMessage || null; // Get error message from session
    req.session.errorMessage = null; // Clear error message after displaying it
    res.render('login', { errorMessage }); // Pass error message to EJS
});

app.post('/login', async (req, res) => {
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

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
