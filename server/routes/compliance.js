const express = require('express');
const router = express.Router();

// POST /api/compliance
router.post('/', (req, res) => {
    try {
        const { implementedControls, allControls } = req.body;

        if (!allControls || !Array.isArray(allControls)) {
            return res.status(400).json({ error: 'allControls array is required' });
        }

        const implementedSet = new Set(implementedControls || []);
        const total = allControls.length;
        const implemented = allControls.filter(c => implementedSet.has(c.id)).length;

        // Global score
        const globalScore = total > 0 ? Math.round((implemented / total) * 100) : 0;

        // Per-category scores
        const categoryMap = {};
        allControls.forEach(control => {
            if (!categoryMap[control.category]) {
                categoryMap[control.category] = { total: 0, implemented: 0 };
            }
            categoryMap[control.category].total++;
            if (implementedSet.has(control.id)) {
                categoryMap[control.category].implemented++;
            }
        });

        const perCategory = Object.entries(categoryMap).map(([name, data]) => ({
            name,
            total: data.total,
            implemented: data.implemented,
            score: data.total > 0 ? Math.round((data.implemented / data.total) * 100) : 0
        }));

        // Per-level scores
        const levelMap = {};
        allControls.forEach(control => {
            const level = `L${control.level}`;
            if (!levelMap[level]) {
                levelMap[level] = { total: 0, implemented: 0 };
            }
            levelMap[level].total++;
            if (implementedSet.has(control.id)) {
                levelMap[level].implemented++;
            }
        });

        const perLevel = Object.entries(levelMap).map(([name, data]) => ({
            name,
            total: data.total,
            implemented: data.implemented,
            score: data.total > 0 ? Math.round((data.implemented / data.total) * 100) : 0
        }));

        // Missing controls
        const missingControls = allControls
            .filter(c => !implementedSet.has(c.id))
            .map(c => ({
                id: c.id,
                category: c.category,
                area: c.area,
                description: c.description,
                level: `L${c.level}`
            }));

        res.json({
            globalScore,
            totalControls: total,
            implementedCount: implemented,
            missingCount: total - implemented,
            perCategory,
            perLevel,
            missingControls
        });
    } catch (error) {
        console.error('Compliance calculation error:', error);
        res.status(500).json({ error: 'Failed to calculate compliance' });
    }
});

module.exports = router;
