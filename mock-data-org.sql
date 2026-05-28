INSERT INTO organizations_tbl (
    abbreviation, 
    college, 
    name, 
    logo, 
    secondary_color, 
    accent_color
) VALUES 
-- 1. LYCESGO
(
    'LYCESGO', 
    'Uni-wide', 
    'Lyceum Central Student Government', 
    readfile('/Users/macbookpro/Documents/School Works/2nd Year College/FINAL PROJECTS/logo-org/1.jpeg'), 
    '#890A13', 
    '#C08A1A'
),
-- 2. CCS SG
(
    'CCS SG', 
    'CCS', 
    'College of Information Technology and Computer Science Student Government', 
    readfile('/Users/macbookpro/Documents/School Works/2nd Year College/FINAL PROJECTS/logo-org/2.jpeg'), 
    '#0A2441', 
    '#C3BFBD'
),
-- 3. CAMS SG
(
    'CAMS SG', 
    'CAMS', 
    'College of Allied Medical Science Student Government', 
    readfile('/Users/macbookpro/Documents/School Works/2nd Year College/FINAL PROJECTS/logo-org/3.jpeg'), 
    '#262B22', 
    '#BBC2BA'
),
-- 4. CON SG
(
    'CON SG', 
    'CON', 
    'College of Nursing Student Government', 
    readfile('/Users/macbookpro/Documents/School Works/2nd Year College/FINAL PROJECTS/logo-org/4.jpeg'), 
    '#FF895B', 
    '#FDD6C7'
),
-- 5. CFAD SG
(
    'CFAD SG', 
    'CFAD', 
    'College of Fine Arts and Design Student Government', 
    readfile('/Users/macbookpro/Documents/School Works/2nd Year College/FINAL PROJECTS/logo-org/5.jpeg'), 
    '#53096C', 
    '#161712'
),
-- 6. CLAE SG
(
    'CLAE SG', 
    'CLAE', 
    'College of Liberal Arts and Education Student Government', 
    readfile('/Users/macbookpro/Documents/School Works/2nd Year College/FINAL PROJECTS/logo-org/6.jpeg'), 
    '#101834', 
    '#BDB861'
),
-- 7. CITHM SG
(
    'CITHM SG', 
    'CITHM', 
    'College of International Tourism and Hospitality Management', 
    readfile('/Users/macbookpro/Documents/School Works/2nd Year College/FINAL PROJECTS/logo-org/7.jpeg'), 
    '#DCB826', 
    '#852426'
),
-- 8. CEA SG
(
    'CEA SG', 
    'CEA', 
    'College of Engineering and Architecture Student Government', 
    readfile('/Users/macbookpro/Documents/School Works/2nd Year College/FINAL PROJECTS/logo-org/8.jpeg'), 
    '#720C0E', 
    '#F56B00'
);

SELECT * FROM organizations_tbl;
DELETE FROM organizations_tbl;