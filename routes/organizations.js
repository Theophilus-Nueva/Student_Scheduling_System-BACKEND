import express from 'express';
import pool from '../config/db.js';
import upload from '../middleware/upload.js';
import { bucket } from '../config/firebase.js';

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
    
    let logoUrl = null;

    try {
        if (req.file) {
            const uniqueFilename = `logos/${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`;
            const file = bucket.file(uniqueFilename);

            await file.save(req.file.buffer, {
                metadata: { contentType: req.file.mimetype }
            });

            await file.makePublic();
            
            logoUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueFilename}`;
        }

        const query = `
            INSERT INTO organizations_tbl (abbreviation, college, name, logo, secondary_color, accent_color) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
        `;
        const params = [abbreviation, college, name, logoUrl, secondaryColor, accentColor];
        
        const result = await pool.query(query, params);
        
        res.json({ 
            message: "Organization created successfully", 
            id: result.rows[0].id, 
            logo_url: logoUrl 
        });

    } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id/events', async (req, res) => {
    try {
        const query = `
            SELECT * FROM events_tbl 
            WHERE organization_id = $1 AND is_archived = FALSE
        `;
        const result = await pool.query(query, [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id/upcoming-events', async (req, res) => {
    try {
        // Notice we use CURRENT_DATE for PostgreSQL instead of SQLite's DATE('now')
        const query = `
            SELECT * FROM events_tbl 
            WHERE organization_id = $1 
            AND date >= CURRENT_DATE 
            AND is_archived = FALSE
            ORDER BY date ASC, start_time ASC
        `;
        const result = await pool.query(query, [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id/committees', async (req, res) => {
    try {
        const query = `
            SELECT * FROM committees_tbl 
            WHERE organization_id = $1
        `;
        const result = await pool.query(query, [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;