const mongoose = require('mongoose');

const boatSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
    }]
});

module.exports = mongoose.model('Boat', boatSchema);
