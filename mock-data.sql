INSERT INTO events_tbl (title, date, venue, start_time, end_time, description, organization_id) VALUES 
('General Assembly 2025', '2025-08-20', 'LPU Gymnasium', '08:00', '12:00', 'Annual gathering of all students for the state of the campus address and organization orientation.', 10),
('Lycean Sports Fest', '2025-10-15', 'University Grounds', '07:00', '17:00', 'Inter-college sports competition including basketball, volleyball, and e-sports.', 11),
('Year-End Concert: Veritas', '2025-12-10', 'Main Auditorium', '18:00', '22:00', 'A celebration of the academic year with performances from local bands and student organizations.', 11),
('Leadership Seminar', '2025-09-05', 'Audio Visual Room 1', '13:00', '16:00', 'Workshop for class mayors and organization officers regarding effective leadership strategies.', 11),
('Community Outreach', '2025-11-20', 'Brgy. San Jose', '07:00', '11:00', 'Distribution of relief goods and school supplies to partner communities.', 11);

SELECT * from organizations_tbl;

SELECT * FROM committees_tbl WHERE id = 1;

SELECT * FROM events_tbl;
SELECT * FROM committees_tbl