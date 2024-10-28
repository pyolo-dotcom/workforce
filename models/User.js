// Models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' }, // Default role is 'user'
    profilePicture: { type: String }, // Add this field for the profile picture
});

const User = mongoose.model('User', userSchema);

module.exports = User;
