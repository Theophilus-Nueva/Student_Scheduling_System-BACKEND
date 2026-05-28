import express from 'express';
import sqlite3 from 'sqlite3';
import bodyParser from 'body-parser';
import cors from 'cors';
import multer from 'multer'; 

import { generateMasterList } from './pdfGenerator.js';

const app = express();

const sql = sqlite3.verbose();

app.use(cors());
app.use(bodyParser.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const db = new sql.Database('./scheduling.db', (err) => {
    if (err) console.error('Error opening database:', err.message);
    else console.log('Connected to SQLite database.');
});

// ---------------------------------------------------------
// Setup Database Tables
// ---------------------------------------------------------
function setupDB() {
    db.serialize(() => {
        // Organizations Table (with BLOB logo)
        db.run(`CREATE TABLE IF NOT EXISTS organizations_tbl (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            abbreviation TEXT,
            college TEXT,
            name TEXT,
            logo BLOB,
            secondary_color TEXT,
            accent_color TEXT
        )`);

        // Committees Table (with BLOB profile_picture)
        db.run(`CREATE TABLE IF NOT EXISTS committees_tbl (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT,
            last_name TEXT,
            college TEXT,
            program TEXT,
            section TEXT,
            profile_picture BLOB,
            organization_id INTEGER,
            FOREIGN KEY (organization_id) REFERENCES organizations_tbl(id)
        )`);

        // Class Schedules Table
        db.run(`CREATE TABLE IF NOT EXISTS schedules_tbl (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            start_time TEXT,
            end_time TEXT,
            day TEXT,
            section TEXT,
            subject_title TEXT,
            subject_code TEXT,
            instructor TEXT,
            committee_id INTEGER,
            FOREIGN KEY (committee_id) REFERENCES committees_tbl(id)
        )`);

        // Event Schedules Table
        db.run(`CREATE TABLE IF NOT EXISTS events_tbl (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            date TEXT,
            venue TEXT,
            start_time TEXT,
            end_time TEXT,
            description TEXT,
            organization_id INTEGER,
            FOREIGN KEY (organization_id) REFERENCES organizations_tbl(id)
        )`);
        
        console.log("Database tables initialized.");
    });
}
setupDB();

// ---------------------------------------------------------
// 5. READ Functions (GET Requests)
// ---------------------------------------------------------

// Get All Organizations
app.get('/api/organizations', (req, res) => {
    db.all(`SELECT * FROM organizations_tbl`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get Single Organization
app.get('/api/organizations/:id', (req, res) => {
    db.all(`SELECT * FROM organizations_tbl WHERE id = ?`, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get Committees by Organization
app.get('/api/organizations/:id/committees', (req, res) => {
    db.all(`SELECT * FROM committees_tbl WHERE organization_id = ?`, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get Single Committee Member
app.get('/api/committees/:committee', (req, res) => {
    db.all(`SELECT * FROM committees_tbl WHERE id = ?`, [req.params.committee], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get Schedule of a Specific Committee Member (Validation Join)
app.get('/api/organizations/:id/committee-schedule/:committee', (req, res) => {
    const orgId = req.params.id;
    const committeeId = req.params.committee;

    const query = `
        SELECT schedules_tbl.* FROM schedules_tbl
        JOIN committees_tbl ON schedules_tbl.committee_id = committees_tbl.id
        WHERE committees_tbl.organization_id = ? 
        AND committees_tbl.id = ?
        ORDER BY schedules_tbl.day, schedules_tbl.start_time
    `;

    db.all(query, [orgId, committeeId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get Events of Organization (All)
app.get('/api/organizations/:id/events', (req, res) => {
    db.all(`SELECT * FROM events_tbl WHERE organization_id = ?`, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get Upcoming Events
app.get('/api/organizations/:id/upcoming-events', (req, res) => {
    const query = `SELECT * FROM events_tbl WHERE organization_id = ? AND date > DATE('now') ORDER BY date ASC`;
    db.all(query, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get Recent Events
app.get('/api/organizations/:id/recent-events', (req, res) => {
    const query = `SELECT * FROM events_tbl WHERE organization_id = ? AND date < DATE('now') ORDER BY date DESC`;
    db.all(query, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ---------------------------------------------------------
// WRITE Functions (POST/PUT Requests)
// ---------------------------------------------------------

// POST: Add Organization (with Logo upload)
app.post('/api/organizations', upload.single('logo'), (req, res) => {
    const { abbreviation, college, name, secondaryColor, accentColor } = req.body;
    const logo = req.file ? req.file.buffer : null; // Get buffer if file exists

    const query = `INSERT INTO organizations_tbl (abbreviation, college, name, logo, secondary_color, accent_color) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [abbreviation, college, name, logo, secondaryColor, accentColor];

    db.run(query, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Organization created successfully", id: this.lastID });
    });
});

// POST: Add Committee (with Profile Picture upload)
app.post('/api/committees', upload.single('profilePicture'), (req, res) => {
    const { firstName, lastName, college, program, section, orgId } = req.body;
    const profilePicture = req.file ? req.file.buffer : null;

    const query = `INSERT INTO committees_tbl (first_name, last_name, college, program, section, profile_picture, organization_id) VALUES (?,?,?,?,?,?,?)`;
    const params = [firstName, lastName, college, program, section, profilePicture, orgId];

    db.run(query, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Committee member added", id: this.lastID });
    });
});

// POST: Add Schedule
app.post('/api/schedules', (req, res) => {
    const { startTime, endTime, day, section, subjectTitle, subjectCode, instructor, userId } = req.body;
    
    const query = `INSERT INTO schedules_tbl (start_time, end_time, day, section, subject_title, subject_code, instructor, committee_id) VALUES (?,?,?,?,?,?,?,?)`;
    const params = [startTime, endTime, day, section, subjectTitle, subjectCode, instructor, userId];

    db.run(query, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Schedule added", id: this.lastID });
    });
});

// POST: Add Event
app.post('/api/events', (req, res) => {
    const { title, date, venue, startTime, endTime, description, organizationId } = req.body;
    
    // Optional: Add overlap check logic here if desired
    
    const query = `INSERT INTO events_tbl (title, date, venue, start_time, end_time, description, organization_id) VALUES (?,?,?,?,?,?,?)`;
    const params = [title, date, venue, startTime, endTime, description, organizationId];

    db.run(query, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Event added", id: this.lastID });
    });
});

app.post('/api/generate-excuse', (req, res) => {
    console.log("1. ROUTE HIT! Request received.");
    console.log("Body:", req.body);

    const { eventId, memberIds } = req.body;
    
    if (!generateMasterList) {
        console.error("CRITICAL ERROR: generateMasterList function is undefined. Check your imports.");
        return res.status(500).send("Server Misconfiguration");
    }

    generateMasterList(res, db, eventId, memberIds);
});

// PUT: Update Committee (Handle optional new image)
app.put('/api/committees/:id', upload.single('profilePicture'), (req, res) => {
    const { firstName, lastName, college, program, section, orgId } = req.body;
    const id = req.params.id;

    let query, params;

    if (req.file) {
        query = `
            UPDATE committees_tbl 
            SET first_name = ?, last_name = ?, college = ?, program = ?, section = ?, profile_picture = ?, organization_id = ? 
            WHERE id = ?
        `;
        params = [firstName, lastName, college, program, section, req.file.buffer, orgId, id];
    } else {
        query = `
            UPDATE committees_tbl 
            SET first_name = ?, last_name = ?, college = ?, program = ?, section = ?, organization_id = ? 
            WHERE id = ?
        `;
        params = [firstName, lastName, college, program, section, orgId, id];
    }

    db.run(query, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Committee member not found." });
        res.json({ message: "Committee member updated successfully", changes: this.changes });
    });
});

// PUT: Update Schedule
app.put('/api/schedules/:id', (req, res) => {
    const { startTime, endTime, day, section, subjectTitle, subjectCode, instructor, userId } = req.body;
    const id = req.params.id;

    const query = `
        UPDATE schedules_tbl 
        SET start_time = ?, end_time = ?, day = ?, section = ?, subject_title = ?, subject_code = ?, instructor = ?, committee_id = ? 
        WHERE id = ?
    `;

    const params = [startTime, endTime, day, section, subjectTitle, subjectCode, instructor, userId, id];

    db.run(query, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Schedule entry not found." });
        res.json({ message: "Schedule updated successfully", changes: this.changes });
    });
});

app.delete('/api/committees/:id', (req, res) => {
    const id = req.params.id;

    db.run(`DELETE FROM schedules_tbl WHERE committee_id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: "Error deleting schedules: " + err.message });

        db.run(`DELETE FROM committees_tbl WHERE id = ?`, [id], function(err) {
            if (err) return res.status(500).json({ error: "Error deleting member: " + err.message });
            
            if (this.changes === 0) {
                return res.status(404).json({ error: "Member not found." });
            }

            res.json({ message: "Member and schedules deleted successfully." });
        });
    });
});

// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});