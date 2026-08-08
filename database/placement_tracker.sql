-- ============================================================
-- PlacementTrack — Database Schema
-- ============================================================
-- Import this file into MySQL to create the database, tables,
-- relationships, and a small set of sample data.
--
--   mysql -u root -p < database/placement_tracker.sql
--
-- NOTE: The sample applications below belong to a demo user
-- whose email is demo@placementtrack.com and password is
-- "demo1234". You can log in with those credentials to see
-- the app populated, or register your own account.
-- ============================================================

CREATE DATABASE IF NOT EXISTS placement_tracker
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE placement_tracker;

-- Drop in dependency order so re-imports are clean
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS users;

-- ------------------------------------------------------------
-- USERS
-- ------------------------------------------------------------
CREATE TABLE users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(120)  NOT NULL,
  email           VARCHAR(150)  NOT NULL UNIQUE,
  password        VARCHAR(255)  NOT NULL,          -- bcrypt hash
  college         VARCHAR(150),
  branch          VARCHAR(100),
  graduation_year INT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- APPLICATIONS  (one user -> many applications)
-- ------------------------------------------------------------
CREATE TABLE applications (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  user_id              INT NOT NULL,
  company_name         VARCHAR(150) NOT NULL,
  job_role             VARCHAR(150) NOT NULL,
  job_type             ENUM('Full Time','Internship','Internship + Full Time')
                         NOT NULL DEFAULT 'Full Time',
  location             VARCHAR(120),
  package              VARCHAR(60),
  application_date     DATE,
  application_deadline DATE,
  status               ENUM('Applied','Assessment','Interview','Selected','Rejected','On Hold')
                         NOT NULL DEFAULT 'Applied',
  current_round        ENUM('Application','Online Assessment','Technical Interview',
                            'HR Interview','Final Interview','Offer')
                         NOT NULL DEFAULT 'Application',
  assessment_date      DATE,
  interview_date       DATE,
  job_link             VARCHAR(500),
  notes                TEXT,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_applications_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

-- Helpful index for the most common lookup
CREATE INDEX idx_applications_user ON applications(user_id);

-- ------------------------------------------------------------
-- SAMPLE DATA (demo account)
-- ------------------------------------------------------------
-- Password hash below is bcrypt for "demo1234".
INSERT INTO users (name, email, password, college, branch, graduation_year)
VALUES (
  'Demo Student',
  'demo@placementtrack.com',
  '$2b$10$icc/G5BGIDA2IQwBlxpgzeWgF7NX/WPKf0sJBdH1TlgoxYhMy2XlK',
  'Institute of Engineering & Technology',
  'Computer Science & Engineering',
  2026
);

SET @uid = LAST_INSERT_ID();

INSERT INTO applications
  (user_id, company_name, job_role, job_type, location, package,
   application_date, application_deadline, status, current_round,
   assessment_date, interview_date, job_link, notes)
VALUES
  (@uid,'Amazon','SDE-1','Full Time','Bengaluru','₹32 LPA',
   '2026-07-20','2026-08-15','Interview','Technical Interview',
   '2026-08-02','2026-08-12','https://amazon.jobs/en/jobs/sde1',
   'Cleared OA with 2/2 problems. DSA-heavy loop expected.'),
  (@uid,'Microsoft','Software Engineer','Full Time','Hyderabad','₹28 LPA',
   '2026-07-22','2026-08-20','Assessment','Online Assessment',
   '2026-08-14',NULL,'https://careers.microsoft.com/swe',
   'Codility assessment scheduled. Revise graphs and DP.'),
  (@uid,'TCS','Digital Cadre','Full Time','Kolkata','₹7 LPA',
   '2026-07-10','2026-07-31','Selected','Offer',
   '2026-07-18','2026-07-25','https://tcs.com/careers','Offer received. Deadline to accept is Aug 25.'),
  (@uid,'Infosys','Systems Engineer','Full Time','Pune','₹6.5 LPA',
   '2026-07-12','2026-08-05','Rejected','Technical Interview',
   '2026-07-20','2026-07-28','https://infosys.com/careers','Did not clear the technical round.'),
  (@uid,'Deloitte','Analyst','Full Time','Gurugram','₹9 LPA',
   '2026-07-25','2026-08-18','Interview','HR Interview',
   '2026-08-05','2026-08-16','https://deloitte.com/careers','HR round pending. Prepare STAR stories.'),
  (@uid,'Accenture','ASE','Internship + Full Time','Remote','₹4.5 LPA',
   '2026-07-28','2026-08-22','Applied','Application',
   NULL,NULL,'https://accenture.com/careers','Applied via referral.'),
  (@uid,'Wipro','Project Engineer','Full Time','Chennai','₹6.5 LPA',
   '2026-07-30','2026-08-25','Applied','Application',
   NULL,NULL,'https://wipro.com/careers','Awaiting assessment invite.'),
  (@uid,'IBM','Associate Developer','Internship','Bengaluru','₹40k/month',
   '2026-08-01','2026-08-28','On Hold','Application',
   NULL,NULL,'https://ibm.com/careers','Waiting on internship confirmation.');
