import express from 'express';
import db from '../config/db.js';

const router = express.Router();

router.post('/', (req, res) => {
    const { title, date, venue, startTime, endTime, description, organizationId } = req.body;
    
    const query = `INSERT INTO events_tbl (title, date, venue, start_time, end_time, description, organization_id) VALUES (?,?,?,?,?,?,?)`;
    const params = [title, date, venue, startTime, endTime, description, organizationId];

    db.run(query, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Event added", id: this.lastID });
    });
});

export default router;