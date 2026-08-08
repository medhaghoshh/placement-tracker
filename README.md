# PlacementTrack — Student Placement Application Tracker

A clean, full-stack web app that lets a college student manage every placement application in one place: companies, roles, rounds, assessment and interview dates, packages, notes, deadlines, and a dashboard that summarises the whole journey.

Built intentionally with a **simple, explainable stack** — plain HTML/CSS/JavaScript on the front end and Node.js + Express + MySQL on the back end — so it's easy to walk an interviewer through every layer.

---

## Description

Placement season means applying to many companies at once and juggling assessments, interviews, and deadlines across all of them. Spreadsheets get messy fast. **PlacementTrack** replaces that chaos with a focused dashboard: add each application as you apply, update its status as you move through rounds, and see upcoming deadlines and overall progress at a glance.

---

## Features

- **Authentication** — register and log in; passwords hashed with bcrypt; sessions via JWT stored in `localStorage`.
- **Dashboard** — four live KPI cards (total, active, interviews, offers), a status doughnut chart, an application funnel, a per-month bar chart, an upcoming list, and recent applications.
- **Applications** — full create / read / update / delete, with company logo initials, status badges, and package info.
- **Search, filter, sort** — search by company or role; filter by status and job type; sort by newest, oldest, or nearest upcoming date.
- **Application details** — a visual placement timeline (Applied → Assessment → Technical → HR → Final → Offer) highlighting the current stage, plus every stored field.
- **Upcoming** — assessments, interviews, and deadlines grouped and sorted by nearest date, with a live "days remaining" badge.
- **Profile** — view account details and update name, college, branch, and graduation year.
- **Polished UX** — responsive layout (hamburger sidebar and card view on mobile), toast notifications, loading states, and friendly empty states.

---

## Tech Stack

**Frontend:** HTML5, CSS3, Vanilla JavaScript, Chart.js, Font Awesome
**Backend:** Node.js, Express.js
**Database:** MySQL
**Packages:** express, mysql2, cors, dotenv, bcryptjs, jsonwebtoken (+ nodemon for dev)

---

## Architecture

```
Browser (HTML + CSS)
       │
       ▼
JavaScript (Fetch API, localStorage for the JWT)
       │  HTTP + JSON
       ▼
REST API  →  Express.js  →  routes → controllers → middleware (JWT)
       │
       ▼
   mysql2 (parameterized queries)
       │
       ▼
     MySQL
```

Requests from the browser go through Fetch to the Express REST API. A JWT middleware protects every application and profile route. Controllers run parameterized SQL through `mysql2` against MySQL and return JSON.

---

## Project Structure

```
placement-tracker/
├── frontend/
│   ├── index.html                # redirects to dashboard or login
│   ├── login.html  register.html
│   ├── dashboard.html
│   ├── applications.html  application-details.html
│   ├── upcoming.html  profile.html
│   ├── css/   (style.css, auth.css, dashboard.css)
│   └── js/    (auth.js, dashboard.js, applications.js,
│               application-details.js, upcoming.js, profile.js)
├── backend/
│   ├── server.js
│   ├── .env  .env.example
│   ├── config/db.js
│   ├── routes/   (authRoutes, applicationRoutes, profileRoutes)
│   ├── controllers/ (authController, applicationController, profileController)
│   └── middleware/authMiddleware.js
├── database/placement_tracker.sql
├── package.json
└── README.md
```

---

## Database Schema

**One-to-many relationship: one `user` has many `applications`.**

```
USERS ──1────< APPLICATIONS
```

### `users`
| Column | Type | Notes |
|---|---|---|
| id | INT, AUTO_INCREMENT | PRIMARY KEY |
| name | VARCHAR | |
| email | VARCHAR | UNIQUE |
| password | VARCHAR | bcrypt hash |
| college, branch | VARCHAR | |
| graduation_year | INT | |
| created_at | TIMESTAMP | |

### `applications`
| Column | Type | Notes |
|---|---|---|
| id | INT, AUTO_INCREMENT | PRIMARY KEY |
| user_id | INT | FOREIGN KEY → users.id (ON DELETE CASCADE) |
| company_name, job_role | VARCHAR | |
| job_type | ENUM | Full Time / Internship / Internship + Full Time |
| location, package | VARCHAR | |
| application_date, application_deadline | DATE | |
| status | ENUM | Applied / Assessment / Interview / Selected / Rejected / On Hold |
| current_round | ENUM | Application / Online Assessment / Technical Interview / HR Interview / Final Interview / Offer |
| assessment_date, interview_date | DATE | |
| job_link | VARCHAR | |
| notes | TEXT | |
| created_at, updated_at | TIMESTAMP | |

---

## API Documentation

All application and profile routes require an `Authorization: Bearer <token>` header.

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account, returns a JWT |
| POST | `/api/auth/login` | Log in, returns a JWT |
| GET | `/api/auth/profile` | Current user's details *(protected)* |

### Applications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/applications` | List the user's applications |
| GET | `/api/applications/stats` | Dashboard KPIs, status distribution, funnel, monthly counts |
| GET | `/api/applications/upcoming` | Future assessments, interviews, deadlines (sorted) |
| GET | `/api/applications/:id` | One application |
| POST | `/api/applications` | Create |
| PUT | `/api/applications/:id` | Update |
| DELETE | `/api/applications/:id` | Delete |

### Profile
| Method | Endpoint | Description |
|---|---|---|
| PUT | `/api/profile` | Update name, college, branch, graduation year |

---

## Installation

1. **Install [Node.js](https://nodejs.org)** and **[MySQL](https://dev.mysql.com/downloads/)**.
2. **Unzip** and open the `placement-tracker` folder in VS Code.
3. **Check `backend/.env`** — set `DB_PASSWORD` to your MySQL password, or leave it blank if you didn't set one:
   ```
   DB_USER=root
   DB_PASSWORD=
   ```
4. **Install packages:**
   ```bash
   npm install
   ```
5. **Create the database (one command, one time):**
   ```bash
   npm run setup
   ```
   This creates the database, both tables, and the sample data automatically.
6. **Start the server:**
   ```bash
   npm start
   ```
7. **Open** http://localhost:5000

> If anything is wrong (MySQL not running, wrong password, database missing) the terminal prints exactly what to fix.

### Demo login
The SQL file seeds a demo account with sample applications:

- **Email:** `demo@placementtrack.com`
- **Password:** `demo1234`

Or register your own account from the sign-up page.

---

## How Authentication Works

1. On register/login the server verifies credentials (bcrypt compares the password against the stored hash) and signs a **JWT** containing the user's id and name.
2. The frontend stores that token in `localStorage` and attaches it as `Authorization: Bearer <token>` on every API call.
3. An Express **middleware** verifies the token on protected routes and attaches the user to the request, so each query is scoped to that user's own data.
4. Protected pages check for a token on load and redirect to the login page if it's missing or expired.

---

## Sample Data

The applications seeded by `database/placement_tracker.sql` (Amazon, Microsoft, TCS, Infosys, Deloitte, Accenture, Wipro, IBM) are **fictional sample records** for demonstration only. The app works entirely on MySQL and needs no external dataset.

---

## Screenshots

*(Add your own screenshots here once you run it.)*

- `screenshots/login.png`
- `screenshots/dashboard.png`
- `screenshots/applications.png`
- `screenshots/details.png`

---

## Future Improvements

Ideas to extend the project (not implemented):

- Email/deadline reminders
- Resume management
- Company recommendations
- Interview preparation resources
- Calendar integration

---

## License

MIT — free to use, learn from, and put on your GitHub.
