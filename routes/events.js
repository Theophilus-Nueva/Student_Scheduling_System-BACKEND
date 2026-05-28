import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM events_tbl WHERE is_archived = FALSE ORDER BY date ASC`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM events_tbl WHERE id = $1 AND is_archived = FALSE`, [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const title = req.body.title || req.body.name;
    const date = req.body.date;
    const start_time = req.body.start_time || req.body.startTime;
    const end_time = req.body.end_time || req.body.endTime;
    const venue = req.body.venue || req.body.location;
    const description = req.body.description;
    const organization_id = req.body.organization_id || req.body.orgId;

    try {
        const query = `
            INSERT INTO events_tbl (title, date, start_time, end_time, venue, description, organization_id, is_archived)
            VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE) RETURNING id
        `;
        const params = [title, date, start_time, end_time, venue, description, organization_id];
        
        const result = await pool.query(query, params);
        res.json({ message: "Event saved successfully!", id: result.rows[0].id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    const title = req.body.title || req.body.name;
    const date = req.body.date;
    const start_time = req.body.start_time || req.body.startTime;
    const end_time = req.body.end_time || req.body.endTime;
    const venue = req.body.venue || req.body.location;
    const description = req.body.description;
    const organization_id = req.body.organization_id || req.body.orgId;
    const id = req.params.id;

    try {
        const query = `
            UPDATE events_tbl 
            SET title = $1, date = $2, start_time = $3, end_time = $4, venue = $5, description = $6, organization_id = $7
            WHERE id = $8
        `;
        await pool.query(query, [title, date, start_time, end_time, venue, description, organization_id, id]);
        
        res.json({ message: "Event updated successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await pool.query(`UPDATE events_tbl SET is_archived = TRUE WHERE id = $1`, [req.params.id]);
        res.json({ message: "Event archived successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

export default router;