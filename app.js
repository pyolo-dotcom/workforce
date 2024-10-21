const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const homeRoutes = require('./routes/homeRoutes'); // Require the homeRoutes

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

// Use the routes defined in homeRoutes.js
app.use('/', homeRoutes); // This will handle all the routes in homeRoutes

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
