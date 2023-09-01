const express = require('express');
const router = express.Router();
const jwtMiddleware = require('../middleware/jwtmiddleware');
const Boat = require('../models/Boat');
const Booking = require('../models/Booking');

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

// DOHVATI SVE BOOKING-e
router.get('/me', jwtMiddleware, async (req, res) => {
    try {
      const renterBookings = await Booking.find({ renter: req.userId })
                                     .populate('boat');
    const ownerBookings = await Booking.find({ owner: req.userId })
                                     .populate('boat');
    const allBookings = [...renterBookings, ...ownerBookings];                              
      res.status(200).send(allBookings);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

// UREDI BOOKING
router.patch('/:id', jwtMiddleware, async (req, res) => {
    try {
        const booking = await Booking.findOne({ _id: req.params.id, owner: req.userId });
        if (!booking) return res.status(404).send({ error: 'Booking not found' });

        Object.assign(booking, req.body);
        await booking.save();
        res.status(200).send(booking);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// IZBRIŠI BOOKING
router.delete('/:id', jwtMiddleware, async (req, res) => {
    try {
        const booking = await Booking.findOneAndDelete({ _id: req.params.id, renter: req.userId });
        if (!booking) return res.status(404).send({ error: 'Booking not found' });

        res.status(200).send({ message: 'Booking deleted' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// DOHVATI BOOKING
router.get('/:id', jwtMiddleware, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).send({ error: 'Booking not found' });
        
        res.status(200).send(booking);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

module.exports = router;