const express = require('express');
const Boat = require('../models/Boat');

const router = express.Router();

router.get('/boats', async (req, res) => {
    try {
        let query = {};

        if (Object.keys(req.query).length === 0) {
            query.tip = "Svi Tipovi";
        } else {
            if (req.query.ime) {
                query.ime = new RegExp(req.query.ime, 'i');
            }

            if (req.query.tip) {
                query.tip = req.query.tip;
            }

            if (req.query.lokacijaPlovila) {
                query.lokacijaPlovila = req.query.lokacijaPlovila;
            }

            if (req.query.snagaMotoraMax) {
                query.snagaMotora = { $lte: parseInt(req.query.snagaMotoraMax) };
            }

            if (req.query.duljinaPlovilaMax) {
                query.duljinaPlovila = { $lte: parseInt(req.query.duljinaPlovilaMax) };
            }

            if (req.query.cijenaMax) {
                query.cijenaPlovila = { $lte: parseInt(req.query.cijenaMax)};
            }     
        }

        const boats = await Boat.find(query);
        res.status(200).send(boats);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

router.get('/unique-locations', async (req, res) => {
    try {
        const locations = await Boat.distinct("lokacijaPlovila");
        res.status(200).send(locations.sort());
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

router.get('/max-price', async (req, res) => {
    try {
        const maxPrice = await Boat.find().sort('-cijenaPlovila').limit(1).select('cijenaPlovila');
        res.status(200).send(maxPrice[0]);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

router.get('/max-motor-power', async (req, res) => {
    try {
        const maxPower = await Boat.find().sort('-snagaMotora').limit(1).select('snagaMotora');
        res.status(200).send(maxPower[0]);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

router.get('/max-boat-length', async (req, res) => {
    try {
        const maxLength = await Boat.find().sort('-duljinaPlovila').limit(1).select('duljinaPlovila');
        res.status(200).send(maxLength[0]);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

module.exports = router;