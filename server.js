import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import organizationRoutes from './routes/organizations.js';
import committeeRoutes from './routes/committees.js';
import scheduleRoutes from './routes/schedules.js';
import eventRoutes from './routes/events.js';

import { generateMasterList } from './services/pdfGenerator.js';
import db from './config/db.js';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Mount Routes
app.use('/api/organizations', organizationRoutes);
app.use('/api/committees', committeeRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/events', eventRoutes);

// PDF Route
app.post('/api/generate-excuse', (req, res) => {
    const { eventId, memberIds } = req.body;
    generateMasterList(res, db, eventId, memberIds);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});