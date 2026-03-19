const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const path = require('path');

let cachedChecklist = null;

function parseExcel() {
    if (cachedChecklist) return cachedChecklist;

    const filePath = path.join(__dirname, '..', 'data', 'ASVS-checklist-en.xlsx');
    const workbook = XLSX.readFile(filePath);

    const skipSheets = ['ASVS Results'];
    const categories = [];

    workbook.SheetNames.forEach(sheetName => {
        if (skipSheets.includes(sheetName)) return;

        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (rows.length < 2) return;

        const controls = [];
        const areas = new Set();

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !row[1]) continue;

            const area = row[0] || 'General';
            const controlId = String(row[1]);
            const level = parseInt(row[2]) || 1;
            const cwe = row[3] ? String(row[3]) : '';
            const nist = row[4] ? String(row[4]) : '';
            const description = row[5] || '';
            const valid = row[6] || '';
            const sourceRef = row[7] || '';
            const comment = row[8] || '';
            const toolUsed = row[9] || '';

            areas.add(area);

            controls.push({
                id: controlId,
                area: area,
                category: sheetName,
                description: description,
                level: level,
                cwe: cwe,
                nist: nist,
                valid: valid,
                sourceRef: sourceRef,
                comment: comment,
                toolUsed: toolUsed
            });
        }

        categories.push({
            name: sheetName,
            areas: Array.from(areas),
            controls: controls,
            totalControls: controls.length
        });
    });

    cachedChecklist = {
        categories: categories,
        totalControls: categories.reduce((sum, c) => sum + c.totalControls, 0),
        lastUpdated: new Date().toISOString()
    };

    return cachedChecklist;
}

// GET /api/checklist
router.get('/', (req, res) => {
    try {
        const data = parseExcel();
        res.json(data);
    } catch (error) {
        console.error('Error parsing checklist:', error);
        res.status(500).json({ error: 'Failed to load checklist', details: error.message });
    }
});

// GET /api/checklist/categories
router.get('/categories', (req, res) => {
    try {
        const data = parseExcel();
        const categories = data.categories.map(c => ({
            name: c.name,
            areas: c.areas,
            totalControls: c.totalControls
        }));
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load categories' });
    }
});

module.exports = router;
