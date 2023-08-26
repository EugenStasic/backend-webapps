const express = require('express');
const router = express.Router();
const Boat = require('../models/Boat');
const jwtMiddleware = require('../middleware/jwtmiddleware.js');

//IZRADI OGLAS
router.post('/create', jwtMiddleware, async (req, res) => {
    try {
        const boat = new Boat({
            ...req.body,
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

module.exports = router;
