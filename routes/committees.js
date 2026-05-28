import express from 'express';
import pool from '../config/db.js';
import upload from '../middleware/upload.js';
import { bucket } from '../config/firebase.js';

const router = express.Router();

// ---------------------------------------------------------
// GET: Single Committee Member
// ---------------------------------------------------------
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM committees_tbl WHERE id = $1`, [req.params.id]);
        // Returning as an array to match your original SQLite db.all() behavior
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---------------------------------------------------------
// POST: Add Committee Member (With Firebase Upload)
// ---------------------------------------------------------
router.post('/', upload.single('profilePicture'), async (req, res) => {
    const { firstName, lastName, college, program, section, orgId } = req.body;
    let profilePictureUrl = null;

    try {
        // 1. If they uploaded a profile picture, send it to Firebase!
        if (req.file) {
            const uniqueFilename = `profiles/${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`;
            const file = bucket.file(uniqueFilename);

            await file.save(req.file.buffer, {
                metadata: { contentType: req.file.mimetype }
            });

            await file.makePublic();
            profilePictureUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueFilename}`;
        }

        // 2. Save the URL and the rest of the data to PostgreSQL
        const query = `
            INSERT INTO committees_tbl (first_name, last_name, college, program, section, profile_picture, organization_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
        `;
        const params = [firstName, lastName, college, program, section, profilePictureUrl, orgId];
        
        const result = await pool.query(query, params);
        res.json({ message: "Committee member added successfully!", id: result.rows[0].id });
    } catch (err) {
        console.error("Error adding committee:", err);
        res.status(500).json({ error: err.message });
    }
});

// ---------------------------------------------------------
// PUT: Update Committee Member
// ---------------------------------------------------------
router.put('/:id', upload.single('profilePicture'), async (req, res) => {
    const { firstName, lastName, college, program, section, orgId } = req.body;
    const id = req.params.id;
    let profilePictureUrl = null;

    try {
        // If they uploaded a NEW picture, send it to Firebase
        if (req.file) {
            const uniqueFilename = `profiles/${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`;
            const file = bucket.file(uniqueFilename);

            await file.save(req.file.buffer, {
                metadata: { contentType: req.file.mimetype }
            });

            await file.makePublic();
            profilePictureUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueFilename}`;
            
            // Update everything, including the new Firebase URL
            const query = `
                UPDATE committees_tbl 
                SET first_name = $1, last_name = $2, college = $3, program = $4, section = $5, profile_picture = $6, organization_id = $7
                WHERE id = $8
            `;
            await pool.query(query, [firstName, lastName, college, program, section, profilePictureUrl, orgId, id]);
            
        } else {
            // If they didn't upload a new picture, update everything EXCEPT the picture
            const query = `
                UPDATE committees_tbl 
                SET first_name = $1, last_name = $2, college = $3, program = $4, section = $5, organization_id = $6
                WHERE id = $7
            `;
            await pool.query(query, [firstName, lastName, college, program, section, orgId, id]);
        }

        res.json({ message: "Committee member updated successfully!" });
    } catch (err) {
        console.error("Error updating committee:", err);
        res.status(500).json({ error: err.message });
    }
});

// ---------------------------------------------------------
// DELETE: Remove Committee Member
// ---------------------------------------------------------
router.delete('/:id', async (req, res) => {
    try {
        await pool.query(`DELETE FROM committees_tbl WHERE id = $1`, [req.params.id]);
        res.json({ message: "Committee member deleted successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;