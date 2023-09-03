const express = require('express');
const router = express.Router();
const moment = require('moment');
const jwtMiddleware = require('../middleware/jwtmiddleware');
const Boat = require('../models/Boat');
const Booking = require('../models/Booking');

// NOVA REZERVAIJA
router.post('/create', jwtMiddleware, async (req, res) => {
    try {
        const { boatId, startDate, endDate, totalCost, note } = req.body;
        const renterId = req.userId;

        const boat = await Boat.findById(boatId);
        if (!boat) return res.status(404).send({ error: 'Boat not found' });

        const owner = boat.owner;

        // Za odrediti status rezervacije
        const today = moment().startOf('day');
        const bookingStartDate = moment(startDate).startOf('day');
        let status = "upcoming";

        if (bookingStartDate.isSameOrBefore(today)) {
            status = "ongoing";
        }

        const newBooking = new Booking({
            renter: renterId,
            owner,
            boat: boatId,
            startDate,
            endDate,
            totalCost,
            note,
            status,
            renterContact: req.body.renterContact
        });

        await newBooking.save();
        res.status(201).send(newBooking);
        const updatedBoat = await Boat.findByIdAndUpdate(
            boatId,
            { $push: { dostupnost: { startDate, endDate, bookingId: newBooking._id } } },
            { new: true }
        );
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// ZA SVE GDJE JE KOR RENTER
router.get('/renter', jwtMiddleware, async (req, res) => {
    try {
        const renterBookings = await Booking.find({ renter: req.userId }).populate('boat');
        
        renterBookings.forEach(booking => {
            updateBookingStatus(booking);
        });

        res.status(200).send(renterBookings);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// DOHVATI SVE BOOKING-e
router.get('/me', jwtMiddleware, async (req, res) => {
    try {
        const renterBookings = await Booking.find({ renter: req.userId }).populate('boat');
        const ownerBookings = await Booking.find({ owner: req.userId }).populate('boat');
        
        const allBookings = [...renterBookings, ...ownerBookings];
        
        allBookings.forEach(booking => {
            updateBookingStatus(booking);
        });

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

         const boat = await Boat.findById(booking.boat);
         if (boat) {
             boat.dostupnost = boat.dostupnost.filter(d => d.bookingId.toString() !== booking._id.toString());
             await boat.save();
         }

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

        updateBookingStatus(booking);

        res.status(200).send(booking);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

async function updateBookingStatus(booking) {
    const currentDate = moment().startOf('day');
    const startDate = moment(booking.startDate).startOf('day');
    const endDate = moment(booking.endDate).startOf('day');

    if (currentDate.isBefore(startDate)) {
        booking.status = 'upcoming';
    } else if (currentDate.isSameOrAfter(startDate) && currentDate.isSameOrBefore(endDate)) {
        booking.status = 'ongoing';
    } else if (currentDate.isAfter(endDate)) {
        booking.status = 'past';
    }

    await booking.save();
}

module.exports = router;