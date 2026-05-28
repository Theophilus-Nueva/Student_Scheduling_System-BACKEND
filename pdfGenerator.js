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
        const colWidths = { name: 100, section: 60, subject: 130, time: 90, instructor: 100, signature: 60 };
        
        const xName = startX;
        const xSection = xName + colWidths.name;
        const xSubject = xSection + colWidths.section;
        const xTime = xSubject + colWidths.subject;
        const xInstructor = xTime + colWidths.time;
        const xSignature = xInstructor + colWidths.instructor; 
        const endX = xSignature + colWidths.signature;

        doc.font('Helvetica-Bold').fontSize(14).text("MASTER LIST", { align: 'center' });
        doc.fontSize(10).text(`Event: ${event.title} (${event.date} - ${eventDay})`, { align: 'center' });
        doc.moveDown(2);
        currentY = doc.y;

        const drawStudentTable = (student, schedule) => {
            const rowHeight = 30;
            const subjectCount = schedule.length > 0 ? schedule.length : 1; 
            const headerHeight = 30;
            const totalTableHeight = headerHeight + (subjectCount * rowHeight);

            if (currentY + totalTableHeight > doc.page.height - 50) {
                doc.addPage();
                currentY = 30;
            }

            const headerY = currentY;
            doc.font('Helvetica-Bold').fontSize(9);
            doc.rect(startX, headerY, endX - startX, headerHeight).stroke();
            
            [xSection, xSubject, xTime, xInstructor, xSignature].forEach(x => {
                doc.moveTo(x, headerY).lineTo(x, headerY + headerHeight).stroke();
            });

            const textY = headerY + 10;
            doc.text('NAME OF STUDENT', xName + 5, textY, { width: colWidths.name - 10 });
            doc.text('SECTION', xSection + 5, textY, { width: colWidths.section - 10, align: 'center' });
            doc.text('AFFECTED SUBJECT', xSubject + 5, textY, { width: colWidths.subject - 10, align: 'center' });
            doc.text('CLASS SCHEDULE', xTime + 5, textY, { width: colWidths.time - 10, align: 'center' });
            doc.text('FACULTY MEMBERS', xInstructor + 5, textY, { width: colWidths.instructor - 10, align: 'center' });
            doc.text('SIGNATURE', xSignature + 5, textY, { width: colWidths.signature - 10, align: 'center' });

            currentY += headerHeight;

            const blockStartY = currentY;
            const blockHeight = subjectCount * rowHeight;
            doc.font('Helvetica').fontSize(9);

            let subjectY = blockStartY;
            if (schedule.length > 0) {
                schedule.forEach((item, index) => {
                    doc.text(item.subject_code || '', xSubject + 5, subjectY + 5, { width: colWidths.subject - 10 });
                    doc.font('Helvetica-Oblique').fontSize(8)
                       .text(item.subject_title || '', xSubject + 5, subjectY + 15, { width: colWidths.subject - 10, color: 'gray' });
                    doc.font('Helvetica').fontSize(9).fillColor('black');

                    doc.text(`${item.start_time} - ${item.end_time}`, xTime + 5, subjectY + 10, { width: colWidths.time - 10, align: 'center' });
                    doc.text(item.instructor || '', xInstructor + 5, subjectY + 10, { width: colWidths.instructor - 10, align: 'center' });

                    if (index < schedule.length - 1) {
                        const lineY = subjectY + rowHeight;
                        doc.moveTo(xSubject, lineY).lineTo(endX, lineY).stroke();
                    }
                    subjectY += rowHeight;
                });
            } else {
                doc.text("No classes", xSubject + 5, subjectY + 10);
            }

            const textCenterY = blockStartY + (blockHeight / 2) - 5;
            doc.text(`${student.last_name}, ${student.first_name}`, xName + 5, blockStartY + 10, { width: colWidths.name - 10 });
            doc.text(student.section || '', xSection + 5, textCenterY, { width: colWidths.section - 10, align: 'center' });

            doc.rect(startX, blockStartY, endX - startX, blockHeight).stroke();
            [xSection, xSubject, xTime, xInstructor, xSignature].forEach(x => {
                doc.moveTo(x, blockStartY).lineTo(x, blockStartY + blockHeight).stroke();
            });

            currentY += blockHeight + 30; 
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