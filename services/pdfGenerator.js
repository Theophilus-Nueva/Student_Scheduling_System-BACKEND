import PDFDocument from 'pdfkit';

export const generateMasterList = async (res, db, eventId, memberIds) => {
    console.log("--- STARTING PDF GENERATION (NO BANNERS) ---");

    try {
        if (!memberIds || memberIds.length === 0) {
            throw new Error("No members selected for generation.");
        }

        // Fetch Event
        const eventResult = await db.query(`SELECT * FROM events_tbl WHERE id = $1`, [eventId]);
        
        if (eventResult.rowCount === 0) {
            return res.status(404).json({ error: "Event not found" });
        }
        const event = eventResult.rows[0];
        
        const eventDateObj = new Date(event.date);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const eventDay = days[eventDateObj.getDay()];

        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Excuse_Letter_Tables_${event.date}.pdf`);
        doc.pipe(res);

        const startX = 30;
        let currentY = 30;

        const columnWidths = [95, 90, 75, 175, 100]; 
        const colStarts = [
            startX, 
            startX + columnWidths[0], 
            startX + columnWidths[0] + columnWidths[1], 
            startX + columnWidths[0] + columnWidths[1] + columnWidths[2], 
            startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3]
        ];

        const drawStudentEntry = (student, schedule) => {
            const rowHeight = 30;
            const tableItems = schedule.length > 0 ? schedule.length : 1;
            // Recalculated height needed for the block without banners
            const totalRequiredHeight = 50 + 60 + (tableItems * rowHeight) + 40; 

            if (currentY + totalRequiredHeight > doc.page.height - 30) {
                doc.addPage();
                currentY = 30;
            }

            // Student Information
            const studentFullName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
            doc.font('Helvetica-Bold').fontSize(10).fillColor('black');
            doc.text(studentFullName, startX, currentY);
            currentY += 15;
            doc.font('Helvetica').text(student.section || '', startX, currentY);
            currentY += 20;

            // Main Header
            const mainHeaderHeight = rowHeight;
            doc.fontSize(9);
            doc.text("CLASS SCHEDULE", colStarts[0], currentY + 10, { width: columnWidths[0] + columnWidths[1], align: 'center' });
            doc.text("SECTION", colStarts[2], currentY + 10, { width: columnWidths[2], align: 'center' });
            doc.text("INSTRUCTOR", colStarts[3], currentY + 10, { width: columnWidths[3], align: 'center' });
            doc.text("SIGNATURE", colStarts[4], currentY + 10, { width: columnWidths[4], align: 'center' });
            
            doc.lineWidth(1).stroke('black');
            doc.moveTo(colStarts[0], currentY).lineTo(colStarts[4] + columnWidths[4], currentY).stroke();
            doc.moveTo(colStarts[2], currentY).lineTo(colStarts[2], currentY + mainHeaderHeight * 2).stroke();
            doc.moveTo(colStarts[3], currentY).lineTo(colStarts[3], currentY + mainHeaderHeight * 2).stroke();
            doc.moveTo(colStarts[4], currentY).lineTo(colStarts[4], currentY + mainHeaderHeight * 2).stroke();
            currentY += mainHeaderHeight;

            // Sub Header
            const subHeaderHeight = rowHeight;
            doc.text("TIME", colStarts[0], currentY + 10, { width: columnWidths[0], align: 'center' });
            doc.text("SUBJECT CODE", colStarts[1], currentY + 10, { width: columnWidths[1], align: 'center' });
            
            doc.moveTo(colStarts[0], currentY).lineTo(colStarts[2], currentY).stroke(); 
            doc.moveTo(colStarts[1], currentY).lineTo(colStarts[1], currentY + subHeaderHeight).stroke();
            doc.moveTo(startX, currentY - mainHeaderHeight).lineTo(startX, currentY + subHeaderHeight).stroke();
            doc.moveTo(colStarts[4] + columnWidths[4], currentY - mainHeaderHeight).lineTo(colStarts[4] + columnWidths[4], currentY + subHeaderHeight).stroke();
            currentY += subHeaderHeight;

            // Schedule Data Rows
            if (schedule.length > 0) {
                schedule.forEach((item, index) => {
                    doc.moveTo(startX, currentY).lineTo(colStarts[4] + columnWidths[4], currentY).stroke(); 
                    const rowStart = currentY;

                    let timeText = "-";
                    if (item.start_time && item.end_time) {
                        timeText = `${item.start_time} - ${item.end_time}`;
                    } else if (item.start_time) {
                        timeText = item.start_time;
                    }

                    const textY = currentY + 10;
                    doc.text(timeText, colStarts[0], textY, { width: columnWidths[0], align: 'center' });
                    doc.text(item.subject_code || '', colStarts[1], textY, { width: columnWidths[1], align: 'center' });
                    doc.text(item.section || student.section || '', colStarts[2], textY, { width: columnWidths[2], align: 'center' });
                    doc.text(item.instructor || '', colStarts[3], textY, { width: columnWidths[3], align: 'center' });

                    [startX, colStarts[1], colStarts[2], colStarts[3], colStarts[4], colStarts[4] + columnWidths[4]].forEach(x => {
                        doc.moveTo(x, rowStart).lineTo(x, rowStart + rowHeight).stroke();
                    });
                    
                    currentY += rowHeight;

                    // Close the bottom of the table on the last item
                    if (index === schedule.length - 1) {
                        doc.moveTo(startX, currentY).lineTo(colStarts[4] + columnWidths[4], currentY).stroke();
                    }
                });
            } else {
                // Empty Fallback
                doc.moveTo(startX, currentY).lineTo(colStarts[4] + columnWidths[4], currentY).stroke();
                doc.text("No classes scheduled", colStarts[0], currentY + 10, { width: columnWidths[0] + columnWidths[1], align: 'center' });
                
                [startX, colStarts[2], colStarts[3], colStarts[4], colStarts[4] + columnWidths[4]].forEach(x => {
                    doc.moveTo(x, currentY).lineTo(x, currentY + rowHeight).stroke();
                });
                currentY += rowHeight;
                doc.moveTo(startX, currentY).lineTo(colStarts[4] + columnWidths[4], currentY).stroke();
            }

            // Margin before next student
            currentY += 50; 
        };

        for (const memberId of memberIds) {
            const memberResult = await db.query(`SELECT * FROM committees_tbl WHERE id = $1`, [memberId]);
            const member = memberResult.rows[0];
            
            if (member) {
                const scheduleResult = await db.query(
                    `SELECT * FROM schedules_tbl WHERE committee_id = $1 AND day = $2 ORDER BY start_time`, 
                    [memberId, eventDay]
                );
                const schedule = scheduleResult.rows;
                drawStudentEntry(member, schedule);
            }
        }

        doc.end();
    } catch (error) {
        console.error(error);
        if (!res.headersSent) res.status(500).send("Server Error: " + error.message);
    }
};