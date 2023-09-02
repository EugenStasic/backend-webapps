const express = require('express');
const router = express.Router();
const path = require('path');
const Boat = require('../models/Boat');
const Booking = require('../models/Booking');
const jwtMiddleware = require('../middleware/jwtmiddleware');
const upload = require('../middleware/multermiddleware');

// IZRADI OGLAS
router.post('/create', jwtMiddleware, upload.array('slikePlovila', 5), async (req, res) => {
    try {
        let imagePaths = [];
        req.files.forEach(file => {
            let relativePath = path.normalize(file.path).replace('uploads/', '');
            imagePaths.push(relativePath);
        });

        const boat = new Boat({
            ...req.body,
            slikePlovila: imagePaths,
            owner: req.userId
        });

        await boat.save();
        res.status(201).send(boat);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// SVA PLOVILA KORISNIKA
router.get('/me', jwtMiddleware, async (req, res) => {
    try {
        const boats = await Boat.find({ owner: req.userId });
        res.status(200).send(boats);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// DOHVAT DETALJA PLOVILA
router.get('/:id', async (req, res) => {
    try {
        const boat = await Boat.findOne({ _id: req.params.id });
        if (!boat) {
            return res.status(404).send({ error: 'Boat not found' });
        }
        res.status(200).send(boat);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// UUREDI OGLAS
router.patch('/:id', jwtMiddleware, async (req, res) => {
    try {
        const boat = await Boat.findOne({ _id: req.params.id, owner: req.userId });
        if (!boat) {
            return res.status(404).send({ error: 'Boat not found' });
        }
        Object.assign(boat, req.body);
        await boat.save();
        res.status(200).send(boat);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// RATING
router.patch('/:id/rate', jwtMiddleware, async (req, res) => {
    try {
        const { rating, bookingId } = req.body;

        if (rating < 1 || rating > 5) {
            return res.status(400).send({ error: 'Rating must be between 1 and 5' });
        }

        const boat = await Boat.findOne({ _id: req.params.id });
        if (!boat) {
            return res.status(404).send({ error: 'Boat not found' });
        }
        
        const booking = await Booking.findOne({ _id: bookingId });
        if (!booking) {
            return res.status(404).send({ error: 'Booking not found' });
        }

        if (booking.boat.toString() !== req.params.id) {
            return res.status(400).send({ error: 'This booking does not belong to the specified boat' });
        }

        if (booking.isRated) {
            return res.status(400).send({ error: 'Booking already rated' });
        }

        booking.isRated = true;
        await booking.save();

        boat.ocjene.push(rating);
        await boat.save();

        res.status(200).send({ message: 'Rating added successfully' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// IZBRIŠI OGLAS
router.delete('/:id', jwtMiddleware, async (req, res) => {
    try {
        const boat = await Boat.findOneAndDelete({ _id: req.params.id, owner: req.userId });
        if (!boat) {
            return res.status(404).send({ error: 'Boat not found' });
        }
        res.status(200).send({ message: 'Boat deleted' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// UREDI SLIKE
router.patch('/:id/upload', jwtMiddleware, upload.array('slikePlovila', 5), async (req, res) => {
    try {
        const boat = await Boat.findOne({ _id: req.params.id, owner: req.userId });
        if (!boat) {
            return res.status(404).send({ error: 'Boat not found' });
        }

        let imagePaths = [];
        req.files.forEach(file => {
            let relativePath = path.normalize(file.path).replace('uploads/', '');
            imagePaths.push(relativePath);
        });

        boat.slikePlovila = boat.slikePlovila.concat(imagePaths);
        await boat.save();

        res.status(200).send(boat);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// DOHVACANJE SLIKE
router.get('/slike/:imageName', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, '../uploads/' + req.params.imageName));
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// DOSTUPNOST
router.get('/:id/unavailable-dates', async (req, res) => {
    try {
        const boat = await Boat.findById(req.params.id);
        if (!boat) return res.status(404).send({ error: 'Boat not found' });
        res.status(200).send(boat.dostupnost);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

module.exports = router;
