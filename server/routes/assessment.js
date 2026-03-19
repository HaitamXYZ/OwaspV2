const express = require('express');
const router = express.Router();

// In-memory storage (persists within function instance, resets on cold start)
let assessmentData = {
    implementedControls: [],
    lastUpdated: null
};

// GET /api/assessment
router.get('/', (req, res) => {
    try {
        res.json(assessmentData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load assessment' });
    }
});

// POST /api/assessment
router.post('/', (req, res) => {
    try {
        const { implementedControls } = req.body;
        assessmentData = {
            implementedControls: implementedControls || [],
            lastUpdated: new Date().toISOString()
        };
        res.json({ success: true, ...assessmentData });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save assessment' });
    }
});

module.exports = router;
