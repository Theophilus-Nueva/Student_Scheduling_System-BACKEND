INSERT INTO schedules_tbl (
    start_time, 
    end_time, 
    day, 
    section, 
    subject_title, 
    subject_code, 
    instructor, 
    committee_id
) VALUES 
(
    '07:00:00', 
    '08:30:00', 
    'Monday', 
    'IT201-WM', 
    'Computational Probability and Statistics', 
    'PSTN01E', 
    'Dr. Severino, John Paolo P.', 
    9
),
(
    '07:00:00', 
    '08:30:00', 
    'Wednesday', 
    'IT201-WM', 
    'Computational Probability and Statistics', 
    'PSTN01E', 
    'Dr. Severino, John Paolo P.', 
    9
),
(
    '10:30:00', 
    '13:30:00', 
    'Monday', 
    'IT201-WM', 
    'Object Oriented Programming', 
    'CSCN02C', 
    'Mr. Prince Cxedrick Nava', 
    9
),
(
    '10:30:00', 
    '12:30:00', 
    'Wednesday', 
    'IT201-WM', 
    'Object Oriented Programming', 
    'CSCN02C', 
    'Mr. Prince Cxedrick Nava', 
    9
),
(
    '14:00:00', 
    '16:00:00', 
    'Monday', 
    'IT201-WM', 
    'Fundamentals of Database Systems', 
    'ITEN03C', 
    'Mr. Janniel Macadangdang', 
    9
),
(
    '13:30:00', 
    '16:30:00', 
    'Wednesday', 
    'IT201-WM', 
    'Fundamentals of Database Systems', 
    'ITEN03C', 
    'Mr. Janniel Macadangdang', 
    9
),
(
    '16:30:00', 
    '19:30:00', 
    'Monday', 
    'IT201-WM', 
    'Introduction to Human Computer Interaction', 
    'ITEN01C', 
    'Mr. Arsenio Arellano Jr.', 
    9
),
(
    '16:30:00', 
    '18:30:00', 
    'Wednesday', 
    'IT201-WM', 
    'Introduction to Human Computer Interaction', 
    'ITEN01C', 
    'Mr. Arsenio Arellano Jr.', 
    9
);

INSERT INTO schedules_tbl (
    start_time, 
    end_time, 
    day, 
    section, 
    subject_title, 
    subject_code, 
    instructor, 
    committee_id
) VALUES 
/* -------------------------------------------------------------------------- */
/* COMMITTEE 10: IT202-WM (Tuesday / Thursday Schedule)                       */
/* -------------------------------------------------------------------------- */
(
    '07:30:00', 
    '10:30:00', 
    'Tuesday', 
    'IT202-WM', 
    'Data Structures and Algorithms', 
    'CSCN03C', 
    'Engr. Mark De Guzman', 
    10
),
(
    '07:30:00', 
    '09:30:00', 
    'Thursday', 
    'IT202-WM', 
    'Data Structures and Algorithms', 
    'CSCN03C', 
    'Engr. Mark De Guzman', 
    10
),
(
    '11:00:00', 
    '14:00:00', 
    'Tuesday', 
    'IT202-WM', 
    'Platform Technologies', 
    'ITEN04C', 
    'Ms. Sarah L. Bautista', 
    10
),
(
    '11:00:00', 
    '13:00:00', 
    'Thursday', 
    'IT202-WM', 
    'Platform Technologies', 
    'ITEN04C', 
    'Ms. Sarah L. Bautista', 
    10
),
(
    '14:30:00', 
    '17:30:00', 
    'Tuesday', 
    'IT202-WM', 
    'Discrete Mathematics', 
    'MATH01E', 
    'Mr. Roberto Sanchez', 
    10
),
(
    '14:30:00', 
    '16:30:00', 
    'Thursday', 
    'IT202-WM', 
    'Discrete Mathematics', 
    'MATH01E', 
    'Mr. Roberto Sanchez', 
    10
),

/* -------------------------------------------------------------------------- */
/* COMMITTEE 11: CS301-AM (Friday / Saturday Schedule)                        */
/* -------------------------------------------------------------------------- */
(
    '08:00:00', 
    '11:00:00', 
    'Friday', 
    'CS301-AM', 
    'Operating Systems', 
    'CSCN05C', 
    'Dr. Emily Tan', 
    11
),
(
    '08:00:00', 
    '10:00:00', 
    'Saturday', 
    'CS301-AM', 
    'Operating Systems', 
    'CSCN05C', 
    'Dr. Emily Tan', 
    11
),
(
    '12:00:00', 
    '15:00:00', 
    'Friday', 
    'CS301-AM', 
    'Web Systems and Technologies', 
    'ITEN05C', 
    'Mr. Jason Cruz', 
    11
),
(
    '12:00:00', 
    '14:00:00', 
    'Saturday', 
    'CS301-AM', 
    'Web Systems and Technologies', 
    'ITEN05C', 
    'Mr. Jason Cruz', 
    11
),
(
    '15:30:00', 
    '18:30:00', 
    'Friday', 
    'CS301-AM', 
    'Information Assurance and Security', 
    'ITEN06C', 
    'Ms. Katrina Reyes', 
    11
),
(
    '14:30:00', 
    '16:30:00', 
    'Saturday', 
    'CS301-AM', 
    'Information Assurance and Security', 
    'ITEN06C', 
    'Ms. Katrina Reyes', 
    11
);

SELECT * FROM schedules_tbl;
SELECT * FROM committees_tbl;