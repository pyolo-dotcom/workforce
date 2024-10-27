const express = require('express');
const router = express.Router();
const multer = require('multer');
const Form = require('../models/Form');
const Job = require('../models/Job'); // Import Job model

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

// Handle form submission
router.post('/submit-form', upload.single('resume'), async (req, res) => {
    try {
        const { lastName, firstName, middleName, dob, maritalStatus, gender, mobilePhone, job } = req.body;
        
        // Ensure job is defined
        if (!job) {
            return res.status(400).send('Job must be selected.');
        }

        // Fetch job title from Job model using the job ObjectId
        const jobDetails = await Job.findById(job);
        if (!jobDetails) {
            return res.status(400).send('Invalid job selected.');
        }

        // Create a new form entry
        const newForm = new Form({
            lastName,
            firstName,
            middleName,
            dob,
            maritalStatus,
            gender,
            mobilePhone,
            job: jobDetails.title, // Store the job title directly
            resume: req.file ? req.file.path : null // Save the file path to the database
        });

        // Save to database
        await newForm.save();
        console.log('Form saved:', newForm);
        res.redirect('/userdashboard'); // Adjust based on your application flow
    } catch (error) {
        console.error('Error saving form:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
