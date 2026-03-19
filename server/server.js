const express = require('express');
const cors = require('cors');
const path = require('path');

const checklistRoutes = require('./routes/checklist');
const complianceRoutes = require('./routes/compliance');
const aiRoutes = require('./routes/ai');
const assessmentRoutes = require('./routes/assessment');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/checklist', checklistRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/assessment', assessmentRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`OWASP ASVS Server running on http://localhost:${PORT}`);
});
