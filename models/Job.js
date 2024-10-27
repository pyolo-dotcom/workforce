// models/Job.js
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: String,
    location: String,
    description: String, // Field for job description
    image: String, // Path to the uploaded job image file
});

module.exports = mongoose.model('Job', jobSchema);
