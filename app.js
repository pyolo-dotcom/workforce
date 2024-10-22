const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); // Added bcrypt for password hashing
const User = require('./models/User'); // Make sure the User model is correctly referenced
const homeRoutes = require('./routes/homeRoutes'); // Require the homeRoutes

const app = express();
const PORT = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/workforceDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('MongoDB connected...');
    createAdminAccount(); // Call the function to create admin account after connecting to the DB
})
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

// Use the routes defined in homeRoutes.js
app.use('/', homeRoutes); // This will handle all the routes in homeRoutes

// Function to create an admin account
async function createAdminAccount() {
    try {
        // Check if an admin already exists
        const existingAdmin = await User.findOne({ email: 'Admin@admin' });
        if (existingAdmin) {
            console.log('Admin account already exists.');
            return;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Create a new admin user
        const adminUser = new User({
            username: 'Admin',
            email: 'Admin@admin',
            password: hashedPassword,
            role: 'admin', // Set role as 'admin'
        });

        // Save the admin user to the database
        await adminUser.save();

        console.log('Admin account created successfully');
    } catch (error) {
        console.error('Error creating admin account:', error);
    }
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
