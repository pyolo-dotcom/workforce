const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const path = require('path'); // Add path module to serve the uploads folder
const multer = require('multer'); // Add multer for file upload handling
const passport = require('passport'); // Import Passport
const LocalStrategy = require('passport-local').Strategy; // Import Local Strategy
const User = require('./models/User');
const homeRoutes = require('./routes/homeRoutes');
const Job = require('./models/Job'); // Import Job model (make sure it's defined in ./models/Job)
const job = require('./routes/job');
const Message = require('./models/Message');
const Form = require('./models/Form'); // Correct path

const app = express();
const PORT = 3000;

// Connect to MongoDB
mongoose.connect('mongodb+srv://dionisiopiolo:RM9zpgm2VZU93SBU@cluster0.r261i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
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

// 
app.use(bodyParser.json()); // For parsing application/json
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

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images'); // Save to public/images directory
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Use unique filename
    }
});
const upload = multer({ storage: storage });

// Route for updating the profile picture
app.post('/profile', upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        // Update the user profile picture in the database
        const userId = req.session.user._id; // Get the user ID from the session
        const profilePicturePath = '/images/' + req.file.filename; // Path to the uploaded file

        await User.findByIdAndUpdate(userId, { profilePicture: profilePicturePath }); // Update user document

        // Redirect back to the profile page
        res.redirect('/profile'); 
    } catch (error) {
        console.error('Error updating profile picture:', error);
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

app.post('/api/messages', async (req, res) => {
    console.log(req.body); // Log the incoming request body

    const { name, email, subject, message } = req.body;

    const newMessage = new Message({ name, email, subject, message });

    try {
        await newMessage.save(); // Save the message to the database
        res.status(201).json({ success: true, message: 'Message sent successfully.' });
    } catch (error) {
        console.error("Error details:", error); // This will include validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Error sending message.' });
    }    
});

// Route to get messages
app.get('/api/messages', async (req, res) => {
    try {
        const messages = await Message.find(); // Fetch all messages
        res.status(200).json(messages); // Send messages as a response
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: 'Error fetching messages.' });
    }
});

app.post('/api/messages/:id/:action', async (req, res) => {
    const { id, action } = req.params;
    try {
        // Logic to update the message in the database
        const updatedMessage = await Message.updateOne({ _id: id }, { $set: { isReviewed: true, status: action } });
        res.status(200).send(updatedMessage);
    } catch (error) {
        res.status(500).send('Error updating message status');
    }
});


// Route to fetch notifications
app.get('/api/notifications', async (req, res) => {
    try {
        const notifications = await Notification.find({}); // Fetch all notifications
        res.json(notifications); // Return notifications as JSON
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).send('Error fetching notifications'); // Send error response
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
