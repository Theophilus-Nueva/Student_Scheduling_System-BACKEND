import PDFDocument from 'pdfkit';

export const generateMasterList = async (res, pool, eventId, memberIds) => {
    try {
        // 1. Fetch Event and Organization Details from PostgreSQL
        const eventQuery = `
            SELECT e.*, o.name as org_name 
            FROM events_tbl e
            JOIN organizations_tbl o ON e.organization_id = o.id
            WHERE e.id = $1
        `;
        const eventResult = await pool.query(eventQuery, [eventId]);

        if (eventResult.rows.length === 0) {
            return res.status(404).json({ error: "Event not found" });
        }
        const event = eventResult.rows[0];

        // 2. Fetch the Selected Committee Members
        // We use ANY($1::int[]) to safely search for an array of IDs in Postgres
        const membersQuery = `
            SELECT first_name, last_name, program, section 
            FROM committees_tbl 
            WHERE id = ANY($1::int[])
        `;
        const membersResult = await pool.query(membersQuery, [memberIds]);
        const members = membersResult.rows;

        // 3. Initialize the PDF Document
        const doc = new PDFDocument({ margin: 50 });
        
        // Tell the browser we are sending a PDF file
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition', 
            `inline; filename=Excuse_Letter_${event.title.replace(/\s+/g, '_')}.pdf`
        );
        
        // Pipe the PDF directly to the user's browser
        doc.pipe(res);

        // --- PDF DESIGN & LAYOUT ---

        // University Header
        doc.fontSize(16).font('Helvetica-Bold').text('Lyceum of the Philippines University - Cavite', { align: 'center' });
        doc.fontSize(12).font('Helvetica').text('Official Student Organization Excuse Letter', { align: 'center' });
        doc.moveDown(2);

        // Event Details Section
        doc.fontSize(14).font('Helvetica-Bold').text('Event Details:');
        doc.fontSize(12).font('Helvetica');
        doc.text(`Organization: ${event.org_name}`);
        doc.text(`Event Title: ${event.title}`);
        
        // Format the date nicely
        const eventDate = new Date(event.date).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        doc.text(`Date: ${eventDate}`);
        
        doc.text(`Venue: ${event.venue}`);
        doc.text(`Time: ${event.start_time || 'TBA'} - ${event.end_time || 'TBA'}`);
        doc.moveDown(2);

        // The Formal Request Body
        doc.text(
            `To whom it may concern,\n\nPlease excuse the following students from their respective classes. They are officially involved in the preparation and execution of the aforementioned event sanctioned by the university.`, 
            { align: 'justify' }
        );
        doc.moveDown(1.5);

        // The Student List
        doc.fontSize(14).font('Helvetica-Bold').text('List of Excused Students:');
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica');

        if (members.length === 0) {
            doc.text('No students selected.');
        } else {
            members.forEach((student, index) => {
                doc.text(`${index + 1}. ${student.first_name} ${student.last_name} - ${student.program} (${student.section})`);
            });
        }

        doc.moveDown(4);

        // Signatures Area
        doc.text('Approved by:', { align: 'left' });
        doc.moveDown(3);
        doc.text('_________________________', { align: 'left' });
        doc.text('Organization Adviser', { align: 'left' });

        // Finalize and send the PDF
        doc.end();

    } catch (error) {
        console.error("PDF Generation Error:", error);
        // Only send an error response if the PDF streaming hasn't started yet
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to generate excuse letter PDF." });
        }
    }
};