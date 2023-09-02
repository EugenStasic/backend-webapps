const mongoose = require('mongoose');

const boatSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ownerContact: {
            type: String,
            required: true
    },
    ime: {
        type: String,
        required: true
    },
    tip: {
        type: String,
        required: true
    },
    snagaMotora: {
        type: Number,
        required: true
    },
    duljinaPlovila: {
        type: Number,
        required: true
    },
    cijenaPlovila: {
        type: Number,
        required: true
    },
    lokacijaPlovila: {
        type: String,
        required: true
    },
    opis: {
        type: String,
        required: true
    },
    ocjene: [{
        type: Number,
        min: 1,
        max: 5
    }],
    dostupnost: [{
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking'
        }
    }],
    slikePlovila: [{
        type: String
    }],
});

module.exports = mongoose.model('Boat', boatSchema);
