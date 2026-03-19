const express = require('express');
const cors = require('cors');

const checklistRoutes = require('../server/routes/checklist');
const complianceRoutes = require('../server/routes/compliance');
const aiRoutes = require('../server/routes/ai');
const assessmentRoutes = require('../server/routes/assessment');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/checklist', checklistRoutes);
app.use('/compliance', complianceRoutes);
app.use('/ai', aiRoutes);
app.use('/assessment', assessmentRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;
