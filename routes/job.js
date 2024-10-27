const express = require('express');
const router = express.Router();
const multer = require('multer');
const Job = require('../models/Job'); // Import Job model

// Configure multer storage (already present in your job.js)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Files will be saved in the 'uploads' directory
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Unique filename with timestamp
    }
});

const upload = multer({ storage: storage });

// Route to render the form to add a new job (already present in your job.js)
router.get('/add', (req, res) => {
    res.render('addJob'); // Render the addJob.ejs form
});

// Route to handle form submission and file upload (already present in your job.js)
router.post('/add', upload.single('image'), async (req, res) => {
    const { title, location, description } = req.body; // Get form data
    const imageUrl = req.file ? req.file.path : ''; // Path to uploaded image
    
    try {
        const newJob = new Job({ title, location, description, imageUrl });
        await newJob.save(); // Save new job to the database
        res.redirect('/jobs'); // Redirect to jobs page
    } catch (err) {
        res.status(500).send("Error adding job.");
    }
});

// Show Edit Job Form
router.get('/edit/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        res.render('editJob', { job }); // Render the edit job form
    } catch (error) {
        res.status(500).send('Error fetching job for edit');
    }
});


// Handle Edit Job Submission
router.post('/edit/:id', upload.single('image'), async (req, res) => {
    try {
        const { title, location, description } = req.body;
        const image = req.file ? req.file.path : null; // Handle image upload if provided

        await Job.findByIdAndUpdate(req.params.id, { title, location, description, image });
        res.redirect('/jobs'); // Redirect to the job listings page
    } catch (error) {
        res.status(500).send('Error updating job');
    }
});

// Handle Job Deletion
router.post('/delete/:id', async (req, res) => {
    try {
        await Job.findByIdAndDelete(req.params.id);
        res.redirect('/jobs'); // Redirect to job listings after deletion
    } catch (error) {
        res.status(500).send('Error deleting job');
    }
});


module.exports = router;
