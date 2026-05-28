import express from 'express';
import db from '../config/db.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// GET Single Committee Member
router.get('/:id', (req, res) => {
    db.all(`SELECT * FROM committees_tbl WHERE id = ?`, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// POST: Add Committee Member
router.post('/', upload.single('profilePicture'), (req, res) => {
    const { firstName, lastName, college, program, section, orgId } = req.body;
    const profilePicture = req.file ? req.file.buffer : null;

    const query = `INSERT INTO committees_tbl (first_name, last_name, college, program, section, profile_picture, organization_id) VALUES (?,?,?,?,?,?,?)`;
    const params = [firstName, lastName, college, program, section, profilePicture, orgId];

    db.run(query, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Committee member added", id: this.lastID });
    });
});

// PUT: Update Committee Member
router.put('/:id', upload.single('profilePicture'), (req, res) => {
    const { firstName, lastName, college, program, section, orgId } = req.body;
    const id = req.params.id;
    let query, params;

    if (req.file) {
        query = `UPDATE committees_tbl SET first_name = ?, last_name = ?, college = ?, program = ?, section = ?, profile_picture = ?, organization_id = ? WHERE id = ?`;
        params = [firstName, lastName, college, program, section, req.file.buffer, orgId, id];
    } else {
        query = `UPDATE committees_tbl SET first_name = ?, last_name = ?, college = ?, program = ?, section = ?, organization_id = ? WHERE id = ?`;
        params = [firstName, lastName, college, program, section, orgId, id];
    }

    db.run(query, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Committee member not found." });
        res.json({ message: "Committee member updated successfully", changes: this.changes });
    });
});

// DELETE: Remove Committee Member and their Schedules
router.delete('/:id', (req, res) => {
    const id = req.params.id;

    db.run(`DELETE FROM schedules_tbl WHERE committee_id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: "Error deleting schedules: " + err.message });

        db.run(`DELETE FROM committees_tbl WHERE id = ?`, [id], function(err) {
            if (err) return res.status(500).json({ error: "Error deleting member: " + err.message });
            if (this.changes === 0) return res.status(404).json({ error: "Member not found." });
            res.json({ message: "Member and schedules deleted successfully." });
        });
    });
});

export default router;