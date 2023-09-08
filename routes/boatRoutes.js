const express = require('express');
const router = express.Router();
const bucket = require('../gcstore');
const uuid = require('uuid');
const Boat = require('../models/Boat');
const Booking = require('../models/Booking');
const jwtMiddleware = require('../middleware/jwtmiddleware');
const upload = require('../middleware/multermiddleware');

// IZRADI OGLAS
router.post('/create', jwtMiddleware, upload.array('slikePlovila', 5), async (req, res) => {
    try {
        let imageURLs = [];

        const uploadPromises = req.files.map(file => {
            return new Promise((resolve, reject) => {
                const filename = `${uuid.v4()}.jpeg`;
                const blob = bucket.file(filename);
                const blobStream = blob.createWriteStream({
                    metadata: {
                        contentType: file.mimetype
                    }
                });

                blobStream.on('error', err => {
                    reject(new Error(`Error uploading to GCS: ${err}`));
                });

                blobStream.on('finish', () => {
                    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
                    imageURLs.push(publicUrl);
                    resolve();
                });

                blobStream.end(file.buffer);
            });
        });

        await Promise.all(uploadPromises);

        const boat = new Boat({
            ...req.body,
            slikePlovila: imageURLs,
            owner: req.userId,
            ownerContact: req.body.ownerContact
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
        
        let averageRating = 0;
        if (boat.ocjene.length > 0) {
            const sum = boat.ocjene.reduce((a, b) => a + b, 0);
            averageRating = sum / boat.ocjene.length;
        }

        const boatWithAverageRating = {
            ...boat._doc,
            averageRating
        };

        res.status(200).send(boatWithAverageRating);
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

  // DODAVANJE SLIKA
router.patch('/:id/upload', jwtMiddleware, upload.array('slikePlovila', 5), async (req, res) => {
    try {
        const boat = await Boat.findOne({ _id: req.params.id, owner: req.userId });
        if (!boat) {
            return res.status(404).send({ error: 'Boat not found' });
        }

        let newImageURLs = [];

        const uploadPromises = req.files.map(file => {
            return new Promise((resolve, reject) => {
                const filename = `${uuid.v4()}.jpeg`;
                const blob = bucket.file(filename);
                const blobStream = blob.createWriteStream({
                    metadata: {
                        contentType: file.mimetype
                    }
                });

                blobStream.on('error', err => {
                    reject(new Error(`Error uploading to GCS: ${err}`));
                });

                blobStream.on('finish', () => {
                    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
                    newImageURLs.push(publicUrl);
                    resolve();
                });

                blobStream.end(file.buffer);
            });
        });

        await Promise.all(uploadPromises);

        boat.slikePlovila = boat.slikePlovila.concat(newImageURLs); 

        await boat.save();
        res.status(200).send(boat);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// DOHVACANJE SLIKE
router.get('/images/:id/:index', async (req, res) => {
    try {
        const boat = await Boat.findById(req.params.id);
        if (!boat || req.params.index >= boat.slikePlovila.length || req.params.index < 0) {
            return res.status(404).send({ error: 'Image not found' });
        }

        const imageUrl = boat.slikePlovila[req.params.index];
        res.redirect(imageUrl);

    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// BRISANJE SLIKE
router.delete('/:id/remove-image/:index', jwtMiddleware, async (req, res) => {
    try {
        const boat = await Boat.findOne({ _id: req.params.id, owner: req.userId });

        if (!boat) {
            return res.status(404).send({ error: 'Boat not found' });
        }
        
        const index = parseInt(req.params.index);

        if (isNaN(index) || index < 0 || index >= boat.slikePlovila.length) {
            return res.status(400).send({ error: 'Invalid index' });
        }
        
        boat.slikePlovila.splice(index, 1);
        await boat.save();

        res.status(200).send(boat);
    } catch (error) {
        console.error('Overall route error:', error);
        res.status(400).send({ error: error.message });
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
