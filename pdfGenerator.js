import PDFDocument from 'pdfkit';

const dbAll = (db, query, params) => {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

export const generateMasterList = async (res, db, eventId, memberIds) => {
    console.log("--- STARTING PDF GENERATION ---");
    console.log(`Event ID: ${eventId}, Member Count: ${memberIds ? memberIds.length : 0}`);

    try {
        if (!memberIds || memberIds.length === 0) {
            throw new Error("No members selected for generation.");
        }

        console.log("Fetching Event...");
        const events = await dbAll(db, `SELECT * FROM events_tbl WHERE id = ?`, [eventId]);
        
        if (!events || events.length === 0) {
            console.error(`Event with ID ${eventId} not found.`);
            return res.status(404).json({ error: "Event not found" });
        }
        const event = events[0];
        console.log("Event Found:", event.title);

        const eventDateObj = new Date(event.date);
        if (isNaN(eventDateObj.getTime())) {
            throw new Error(`Invalid event date format: ${event.date}`);
        }
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const eventDay = days[eventDateObj.getDay()];

        console.log("Initializing PDF Document...");
        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Master_List_${event.date}.pdf`);
        doc.pipe(res);

        const startX = 30;
        let currentY = 30;
        
        // A4 width is ~595. Total drawable width = 595 - 60 (margins) = 535
        const colW = { time: 100, subject: 90, section: 80, instructor: 160, signature: 105 };
        
        const xTime = startX;
        const xSubject = xTime + colW.time;
        const xSectionTbl = xSubject + colW.subject;
        const xInstructor = xSectionTbl + colW.section;
        const xSignature = xInstructor + colW.instructor; 
        const endX = xSignature + colW.signature;

        doc.font('Helvetica-Bold').fontSize(14).text("MASTER LIST", { align: 'center' });
        doc.fontSize(10).text(`Event: ${event.title} (${event.date} - ${eventDay})`, { align: 'center' });
        doc.moveDown(2);
        currentY = doc.y;

        const drawStudentTable = (student, schedule) => {
            const rowHeight = 30;
            const subjectCount = schedule.length > 0 ? schedule.length : 1; 
            // Calculate required height for page break logic (Name + Sec + Title + Headers + Data)
            const requiredHeight = 15 + 20 + 20 + 20 + (subjectCount * rowHeight);

            if (currentY + requiredHeight > doc.page.height - 50) {
                doc.addPage();
                currentY = 30;
            }

            // 1. Draw Student Name and Section Above the Table
            doc.font('Helvetica-Bold').fontSize(12).text(`${student.first_name} ${student.last_name}`, startX, currentY);
            currentY += 15;
            doc.font('Helvetica').fontSize(10).text(student.section || '', startX, currentY);
            currentY += 20;

            // 2. Draw "CLASS SCHEDULE" Title Header
            const titleHeight = 20;
            doc.rect(startX, currentY, endX - startX, titleHeight).fillAndStroke('#eeeeee', 'black');
            doc.fillColor('black').font('Helvetica-Bold').fontSize(10);
            doc.text('CLASS SCHEDULE', startX + 5, currentY + 6);
            currentY += titleHeight;

            // 3. Draw Column Headers
            const headerHeight = 20;
            doc.rect(startX, currentY, endX - startX, headerHeight).stroke();
            
            // Vertical lines for headers
            [xSubject, xSectionTbl, xInstructor, xSignature].forEach(x => {
                doc.moveTo(x, currentY).lineTo(x, currentY + headerHeight).stroke();
            });

            const textY = currentY + 6;
            doc.font('Helvetica-Bold').fontSize(9);
            doc.text('TIME', xTime, textY, { width: colW.time, align: 'center' });
            doc.text('SUBJECT CODE', xSubject, textY, { width: colW.subject, align: 'center' });
            doc.text('SECTION', xSectionTbl, textY, { width: colW.section, align: 'center' });
            doc.text('INSTRUCTOR', xInstructor, textY, { width: colW.instructor, align: 'center' });
            doc.text('SIGNATURE', xSignature, textY, { width: colW.signature, align: 'center' });

            currentY += headerHeight;

            // 4. Draw Data Rows
            doc.font('Helvetica').fontSize(9);

            if (schedule.length > 0) {
                schedule.forEach((item) => {
                    // Row Box
                    doc.rect(startX, currentY, endX - startX, rowHeight).stroke();
                    
                    // Vertical Lines
                    [xSubject, xSectionTbl, xInstructor, xSignature].forEach(x => {
                        doc.moveTo(x, currentY).lineTo(x, currentY + rowHeight).stroke();
                    });

                    const itemY = currentY + 10;
                    
                    // Time format check (supports standard time or strings like "CLINICAL DUTY")
                    let timeText = item.start_time ? `${item.start_time} - ${item.end_time}` : (item.time || '');
                    
                    doc.text(timeText, xTime, itemY, { width: colW.time, align: 'center' });
                    doc.text(item.subject_code || '', xSubject, itemY, { width: colW.subject, align: 'center' });
                    // Default to student.section if schedule doesn't explicitly have its own section
                    doc.text(item.section || student.section || '', xSectionTbl, itemY, { width: colW.section, align: 'center' });
                    doc.text(item.instructor || '', xInstructor, itemY, { width: colW.instructor, align: 'center' });

                    currentY += rowHeight;
                });
            } else {
                // Empty state if no schedule is found
                doc.rect(startX, currentY, endX - startX, rowHeight).stroke();
                doc.text("No classes scheduled", startX, currentY + 10, { width: endX - startX, align: 'center' });
                currentY += rowHeight;
            }

            // Margin at the bottom before the next student starts
            currentY += 30; 
        };

        console.log("Looping through members...");
        for (const memberId of memberIds) {
            const members = await dbAll(db, `SELECT * FROM committees_tbl WHERE id = ?`, [memberId]);
            const member = members[0];
            
            if (member) {
                const schedule = await dbAll(db, 
                    `SELECT * FROM schedules_tbl WHERE committee_id = ? AND day = ? ORDER BY start_time`, 
                    [memberId, eventDay]
                );
                drawStudentTable(member, schedule);
            }
        }

        doc.end();
        console.log("--- PDF GENERATION SUCCESSFUL ---");

    } catch (error) {
        console.error("!!! PDF GENERATION CRASHED !!!");
        console.error(error);
        if (!res.headersSent) res.status(500).send("Server Error: " + error.message);
    }
};