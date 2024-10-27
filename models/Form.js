const mongoose = require('mongoose');

const formSchema = new mongoose.Schema({
    lastName: String,
    firstName: String,
    middleName: String,
    dob: Date,
    maritalStatus: String,
    gender: String,
    mobilePhone: String,
    job: String, // This will store the job title directly
    resume: String
});

const Form = mongoose.model('Form', formSchema);
module.exports = Form;
