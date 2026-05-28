import express from 'express';
import pool from '../config/db.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM organizations_tbl`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM organizations_tbl WHERE id = $1`, [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', upload.single('logo'), async (req, res) => {
    const { abbreviation, college, name, secondaryColor, accentColor } = req.body;
    
    const logo = req.file ? req.file.buffer : null;

    try {
        const query = `
            INSERT INTO organizations_tbl (abbreviation, college, name, logo, secondary_color, accent_color) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
        `;
        const params = [abbreviation, college, name, logo, secondaryColor, accentColor];
        
        const result = await pool.query(query, params);
        res.json({ message: "Organization created successfully", id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;