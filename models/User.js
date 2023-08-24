const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    ime: {
        type: String,
        required: true
    },

    prezime: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    }

});

module.exports = mongoose.model('User', userSchema);