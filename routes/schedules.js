import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.post('/', async (req, res) => {
    const { day, start_time, end_time, subject_code, section, instructor, committee_id } = req.body;

    try {
        const finalStartTime = start_time || null;
        const finalEndTime = end_time || null;

        const query = `
            INSERT INTO schedules_tbl (day, start_time, end_time, subject_code, section, instructor, committee_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
        `;
        const params = [day, finalStartTime, finalEndTime, subject_code, section, instructor, committee_id];
        
        const result = await pool.query(query, params);
        res.json({ message: "Schedule saved successfully!", id: result.rows[0].id });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    const { day, start_time, end_time, subject_code, section, instructor } = req.body;
    const id = req.params.id;

    try {
        const finalStartTime = start_time || null;
        const finalEndTime = end_time || null;

        const query = `
            UPDATE schedules_tbl 
            SET day = $1, start_time = $2, end_time = $3, subject_code = $4, section = $5, instructor = $6
            WHERE id = $7
        `;
        await pool.query(query, [day, finalStartTime, finalEndTime, subject_code, section, instructor, id]);
        
        res.json({ message: "Schedule updated successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await pool.query(`DELETE FROM schedules_tbl WHERE id = $1`, [req.params.id]);
        res.json({ message: "Schedule deleted successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

export default router;