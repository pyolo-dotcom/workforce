const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path'); // Add path module to serve the uploads folder
const multer = require('multer'); // Add multer for file upload handling
const passport = require('passport'); // Import Passport
const LocalStrategy = require('passport-local').Strategy; // Import Local Strategy
const User = require('./models/User');
const homeRoutes = require('./routes/homeRoutes');
const Job = require('./models/Job'); // Import Job model (make sure it's defined in ./models/Job)
const job = require('./routes/job');

const app = express();
const PORT = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/workforceDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('MongoDB connected...');
    createAdminAccount();
})
.catch(err => {
    console.error('MongoDB connection error:', err); // Log connection errors
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
}));

// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from the 'public' and 'uploads' folder
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded images

// Set EJS as the template engine
app.set('view engine', 'ejs');

// Use the routes defined in homeRoutes.js
app.use('/', homeRoutes);
app.use('/jobs', job); // Use the job router for job-related routes

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads'); // Store uploaded files in 'uploads' directory
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Generate unique filenames
    }
});
const upload = multer({ storage: storage });

// Route to render the add job form (addJob.ejs)
app.get('/addJob', (req, res) => {
    res.render('addJob');
});

// In your POST route for adding a job
app.post('/addJob', upload.single('image'), async (req, res) => {
    try {
        const { title, location, description } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : null;

        const newJob = new Job({
            title,
            location,
            description, // Add description here
            image // Add image here
        });

        await newJob.save();
        res.redirect('/jobs');
    } catch (error) {
        console.error('Error adding job:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Passport local strategy for authentication
passport.use(new LocalStrategy(
    async (username, password, done) => {
        try {
            const user = await User.findOne({ username }); // Adjust as necessary
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

// Passport serialization and deserialization
passport.serializeUser((user, done) => {
    done(null, user.id); // Store user ID in session
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user); // Attach user object to request
    } catch (error) {
        done(error);
    }
});

// Function to create an admin account
async function createAdminAccount() {
    try {
        const existingAdmin = await User.findOne({ email: 'Admin@admin' });
        if (existingAdmin) {
            console.log('Admin account already exists.');
            return;
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);

        const adminUser = new User({
            username: 'Admin',
            email: 'Admin@admin',
            password: hashedPassword,
            role: 'admin',
        });

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
