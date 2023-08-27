const express = require('express');
const router = express.Router();
const path = require('path');
const Boat = require('../models/Boat');
const jwtMiddleware = require('../middleware/jwtmiddleware.js');
const upload = require('../middleware/multermiddleware.js');


//IZRADI OGLAS
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
router.get('/:id', jwtMiddleware, async (req, res) => {
    try {
        const boat = await Boat.findOne({ _id: req.params.id, owner: req.userId });
        if (!boat) {
            return res.status(404).send({ error: 'Boat not found' });
        }
        res.status(200).send(boat);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// UREDI OGLAS
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


// DOHVATI SLIKU
router.get('/slike/+:imageName', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, '../uploads/' + req.params.imageName));
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

module.exports = router;
