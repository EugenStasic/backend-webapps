const express = require('express');
const router = express.Router();
const jwtMiddleware = require('../middleware/jwtmiddleware');
const Boat = require('../models/Boat');
const Booking = require('../models/Booking');
const User = require('../models/User');

// NOVA REZERVAIJA
router.post('/create', jwtMiddleware, async (req, res) => {
    console.log("Received a POST request for booking");
    try {
        const { boatId, startDate, endDate, totalCost, note } = req.body;
        const renterId = req.userId;

        const boat = await Boat.findById(boatId);
        if (!boat) return res.status(404).send({ error: 'Boat not found' });

        const owner = boat.owner;
        const newBooking = new Booking({
            renter: renterId,
            owner,
            boat: boatId,
            startDate,
            endDate,
            totalCost,
            note,
        });

        await newBooking.save();
        res.status(201).send(newBooking);
        const updatedBoat = await Boat.findByIdAndUpdate(
            boatId,
            { $push: { dostupnost: { startDate, endDate, bookingId: newBooking._id } } },
            { new: true }
        );
        console.log('Updated Boat:', updatedBoat);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

module.exports = router;