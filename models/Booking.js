const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    renter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    boat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Boat',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    totalCost: {
        type: Number,
        required: true
    },
    note: {
        type: String
    },
    status: {
        type: String,
        enum: ['past', 'ongoing', 'upcoming'],
        default: 'upcoming'
    },
    isRated: { type: Boolean, default: false }
});

module.exports = mongoose.model('Booking', bookingSchema);
