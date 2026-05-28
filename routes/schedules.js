import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// POST: Add Schedule
router.post('/', (req, res) => {
    const { startTime, endTime, day, section, subjectTitle, subjectCode, instructor, userId } = req.body;
    
    const query = `INSERT INTO schedules_tbl (start_time, end_time, day, section, subject_title, subject_code, instructor, committee_id) VALUES (?,?,?,?,?,?,?,?)`;
    const params = [startTime, endTime, day, section, subjectTitle, subjectCode, instructor, userId];

    db.run(query, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Schedule added", id: this.lastID });
    });
});

// PUT: Update Schedule
router.put('/:id', (req, res) => {
    const { startTime, endTime, day, section, subjectTitle, subjectCode, instructor, userId } = req.body;
    const id = req.params.id;

    const query = `UPDATE schedules_tbl SET start_time = ?, end_time = ?, day = ?, section = ?, subject_title = ?, subject_code = ?, instructor = ?, committee_id = ? WHERE id = ?`;
    const params = [startTime, endTime, day, section, subjectTitle, subjectCode, instructor, userId, id];

    db.run(query, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Schedule entry not found." });
        res.json({ message: "Schedule updated successfully", changes: this.changes });
    });
});

export default router;