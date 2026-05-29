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
    console.log("--- STARTING PDF GENERATION (TABLE FORMAT) ---");

    try {
        if (!memberIds || memberIds.length === 0) {
            throw new Error("No members selected for generation.");
        }

        const events = await dbAll(db, `SELECT * FROM events_tbl WHERE id = ?`, [eventId]);
        
        if (!events || events.length === 0) {
            return res.status(404).json({ error: "Event not found" });
        }
        const event = events[0];
        
        const eventDateObj = new Date(event.date);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const eventDay = days[eventDateObj.getDay()];

        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Excuse_Letter_Tables_${event.date}.pdf`);
        doc.pipe(res);

        const startX = 30;
        let currentY = 30;

        // Column widths for the schedule table
        const columnWidths = [95, 90, 75, 175, 100]; 
        const colStarts = [
            startX, 
            startX + columnWidths[0], 
            startX + columnWidths[0] + columnWidths[1], 
            startX + columnWidths[0] + columnWidths[1] + columnWidths[2], 
            startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3]
        ];

        const drawDecorativeHeaderFooter = (yStart, isFooter = false) => {
            const width = doc.page.width - (startX * 2);
            doc.save();
            doc.rect(startX, yStart, width, 15).fill('#800000'); // Maroon
            doc.rect(startX, isFooter ? yStart - 5 : yStart + 15, width, 5).fill('#A9A9A9'); // Gray
            doc.restore();
        };

        const drawStudentEntry = (student, schedule) => {
            const rowHeight = 30;
            const tableItems = schedule.length > 0 ? schedule.length : 1;
            const totalRequiredHeight = 20 + 50 + 60 + (tableItems * rowHeight) + 40; 

            if (currentY + totalRequiredHeight > doc.page.height - 30) {
                doc.addPage();
                currentY = 30;
            }

            drawDecorativeHeaderFooter(currentY, false);
            currentY += 40;

            // Header: Name and Course
            const studentFullName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
            doc.font('Helvetica-Bold').fontSize(10).fillColor('black');
            doc.text(studentFullName, startX, currentY);
            currentY += 15;
            doc.text(student.section || '', startX, currentY);
            currentY += 20;

            // Main Table Header ("CLASS SCHEDULE", "SECTION", etc.)
            const mainHeaderHeight = rowHeight;
            doc.font('Helvetica').fontSize(9);
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

            // Sub-header ("TIME", "SUBJECT CODE")
            const subHeaderHeight = rowHeight;
            doc.text("TIME", colStarts[0], currentY + 10, { width: columnWidths[0], align: 'center' });
            doc.text("SUBJECT CODE", colStarts[1], currentY + 10, { width: columnWidths[1], align: 'center' });
            
            doc.moveTo(colStarts[0], currentY).lineTo(colStarts[2], currentY).stroke(); 
            doc.moveTo(colStarts[1], currentY).lineTo(colStarts[1], currentY + subHeaderHeight).stroke();
            doc.moveTo(startX, currentY - mainHeaderHeight).lineTo(startX, currentY + subHeaderHeight).stroke();
            doc.moveTo(colStarts[4] + columnWidths[4], currentY - mainHeaderHeight).lineTo(colStarts[4] + columnWidths[4], currentY + subHeaderHeight).stroke();
            currentY += subHeaderHeight;

            // Schedule Rows
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

                    // Draw vertical lines
                    [startX, colStarts[1], colStarts[2], colStarts[3], colStarts[4], colStarts[4] + columnWidths[4]].forEach(x => {
                        doc.moveTo(x, rowStart).lineTo(x, rowStart + rowHeight).stroke();
                    });
                    
                    currentY += rowHeight;

                    // Bottom border for the last item
                    if (index === schedule.length - 1) {
                        doc.moveTo(startX, currentY).lineTo(colStarts[4] + columnWidths[4], currentY).stroke();
                    }
                });
            } else {
                // Empty fallback row
                doc.moveTo(startX, currentY).lineTo(colStarts[4] + columnWidths[4], currentY).stroke();
                doc.text("No classes scheduled", colStarts[0], currentY + 10, { width: columnWidths[0] + columnWidths[1], align: 'center' });
                
                [startX, colStarts[2], colStarts[3], colStarts[4], colStarts[4] + columnWidths[4]].forEach(x => {
                    doc.moveTo(x, currentY).lineTo(x, currentY + rowHeight).stroke();
                });
                currentY += rowHeight;
                doc.moveTo(startX, currentY).lineTo(colStarts[4] + columnWidths[4], currentY).stroke();
            }

            currentY += 20;
            drawDecorativeHeaderFooter(currentY, true);
            currentY += 50; 
        };

        for (const memberId of memberIds) {
            const members = await dbAll(db, `SELECT * FROM committees_tbl WHERE id = ?`, [memberId]);
            const member = members[0];
            
            if (member) {
                const schedule = await dbAll(db, 
                    `SELECT * FROM schedules_tbl WHERE committee_id = ? AND day = ? ORDER BY start_time`, 
                    [memberId, eventDay]
                );
                drawStudentEntry(member, schedule);
            }
        }

        doc.end();
    } catch (error) {
        console.error(error);
        if (!res.headersSent) res.status(500).send("Server Error: " + error.message);
    }
};