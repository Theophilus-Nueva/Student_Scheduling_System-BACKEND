import PDFDocument from 'pdfkit';

const dbAll = (db, query, params) => {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

export const generateExcuseLetter = async (res, db, eventId, memberIds, orgId) => {
    console.log("--- STARTING EXCUSE LETTER GENERATION ---");

    try {
        if (!memberIds || memberIds.length === 0) {
            throw new Error("No members selected for generation.");
        }

        // 1. Fetch Event Details
        const events = await dbAll(db, `SELECT * FROM events_tbl WHERE id = ?`, [eventId]);
        if (!events || events.length === 0) {
            return res.status(404).json({ error: "Event not found" });
        }
        const event = events[0];

        // Optional: Fetch Organization Details if you have an org table
        // const orgs = await dbAll(db, `SELECT * FROM organizations_tbl WHERE id = ?`, [orgId]);
        // const orgName = orgs.length > 0 ? orgs[0].name : "Student Organization";
        
        // For now, I'm setting a default based on your image
        const orgName = "College of Information Technology and Computer Science Student Government"; 

        // Format Date (e.g., "Saturday, May 30, 2026")
        const eventDateObj = new Date(event.date);
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = eventDateObj.toLocaleDateString('en-US', dateOptions);

        console.log("Initializing PDF Document...");
        // 50px margins all around for a clean, formal letter look
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Excuse_Letter_${event.date}.pdf`);
        doc.pipe(res);

        // --- HEADER ---
        doc.font('Helvetica-Bold').fontSize(16).text('Lyceum of the Philippines University - Cavite', { align: 'center' });
        doc.font('Helvetica').fontSize(12).text('Official Student Organization Excuse Letter', { align: 'center' });
        doc.moveDown(3);

        // --- EVENT DETAILS ---
        doc.font('Helvetica-Bold').fontSize(12).text('Event Details:');
        doc.font('Helvetica').fontSize(11);
        doc.text(`Organization: ${orgName}`);
        doc.text(`Event Title: ${event.title}`);
        doc.text(`Date: ${formattedDate}`);
        doc.text(`Venue: ${event.venue || 'TBA'}`); // Assuming your DB has a venue column
        doc.text(`Time: ${event.time_start || '07:00:00'} - ${event.time_end || '21:00:00'}`); 
        doc.moveDown(2);

        // --- BODY PARAGRAPH ---
        doc.text('To whom it may concern,');
        doc.moveDown(1);
        doc.text(
            'Please excuse the following students from their respective classes. They are officially involved in the preparation and execution of the aforementioned event sanctioned by the university.',
            { align: 'justify', lineGap: 2 }
        );
        doc.moveDown(2);

        // --- STUDENT LIST ---
        doc.font('Helvetica-Bold').fontSize(12).text('List of Excused Students:');
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(11);

        // Loop through all selected members and print them as a numbered list
        let counter = 1;
        for (const memberId of memberIds) {
            const members = await dbAll(db, `SELECT * FROM committees_tbl WHERE id = ?`, [memberId]);
            const member = members[0];
            
            if (member) {
                // Example Output: "1. Theophilus Nueva - BS Information Technology (IT201WM)"
                const fullName = `${member.first_name} ${member.last_name}`;
                const programInfo = `${member.program || 'Program'} (${member.section || 'Section'})`;
                
                doc.text(`${counter}. ${fullName} - ${programInfo}`);
                counter++;
            }
        }

        doc.moveDown(5);

        // --- SIGNATORY ---
        doc.font('Helvetica').fontSize(11).text('Approved by:');
        doc.moveDown(3); // Leave space for a physical signature
        
        // Draw the underline
        const signatureX = 50;
        const signatureWidth = 200;
        doc.moveTo(signatureX, doc.y).lineTo(signatureX + signatureWidth, doc.y).stroke();
        
        doc.moveDown(0.5);
        doc.text('Organization Adviser', signatureX);

        // Finalize PDF
        doc.end();
        console.log("--- EXCUSE LETTER GENERATION SUCCESSFUL ---");

    } catch (error) {
        console.error("!!! PDF GENERATION CRASHED !!!");
        console.error(error);
        if (!res.headersSent) res.status(500).send("Server Error: " + error.message);
    }
};