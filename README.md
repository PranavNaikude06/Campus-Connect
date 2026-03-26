
# Campus Connect - Project Overview


## 1. Introduction
**Campus Connect** is a comprehensive, centralized web-based portal developed for Terna Engineering College. It provides seamless event registration, event management, and real-time tracking for the college ecosystem spanning across students, event organizers (e.g., student committees, clubs), and administrative staff.

The application entirely replaces manual event tracking and hardcoded mock data with a fully dynamic, database-driven system.

---

## 2. Tech Stack
**Frontend Layer**:
- **Framework**: React 19 built with Vite.
- **Language**: TypeScript (`.tsx`).
- **Styling**: TailwindCSS (v4), supplemented by inline vanilla CSS for dynamic glassmorphic elements and curated gradients.
- **Icons & Animations**: `lucide-react` and `framer-motion`.

**Backend API Layer**:
- **Runtime**: Node.js with Express.js.
- **Architecture**: Standard REST API serving JSON.
- **Security**: Password hashing via `bcryptjs`, CORS configured for frontend/backend decoupled running.

**Database Layer**:
- **Engine**: MySQL.
- **Connection**: `mysql2/promise` using a connection pool.

---

## 3. Role-Based Architecture
The platform strictly enforces three isolated roles:

### 1. Student (`student`)
- **Authentication**: Self-service Signup/Login using an Email, Password, and a unique **TUF ID** (Terna Unique Form ID). Validations prevent duplicate registrations for the same TUF ID or Email.
- **Features**:
  - Dynamically browse events currently marked as `Active`.
  - One-click register for upcoming events (with real-time seat capacity tracking).
  - View personal dashboard containing historical registrations and mock certificates.

### 2. Organizer (`organizer`)
- **Authentication**: Cannot simply sign up. An Organizer relies on **Admin-provisioned credentials** (a pre-generated username and password). Upon the first successful login, the organizer sets up their profile (linking themselves to a committee name like "GDSC", year, branch).
- **Features**:
  - Create new events. Newly created events default to a `Pending` status.
  - Track live registrant metrics (total seats vs. filled seats).
  - **Export Registrants**: Can securely download a `.csv` file containing the specific student details (Name, TE/BE Year, Branch, Division, TUF ID, Mobile No) of everyone who enrolled in their event.

### 3. System Admin (`admin`)
- **Authentication**: Master account oversight (e.g., manual/hardcoded admin credentials in the backend environment).
- **Features**:
  - **Event Approvals**: Dashboard contains an approval queue. Admins must `Approve` (making it `Active`) or `Reject` any event submitted by Organizers before it is publicly shown to students.
  - **Credential Management**: Generates, monitors, and deletes `organizer_credentials` for the various campus clubs.
  - **Analytics**: Tracks global system users. The admin tracking tables dynamically fetch from both the `users` (students) table and the `organizer_credentials` table to provide a birds-eye view of all platform actors.

---

## 4. Database Schema Overview
The database (default: `campus_connect`) relies on four primary tables:

1. **`users`**: Tracks all standard student profiles.
   - `id`, `name`, `email`, `role` (ENUM: 'student'), `class` (branch), `year` (FE/SE/TE/BE), `tuf_id`, `password`, `mobile_no`.
2. **`organizer_credentials`**: Specifically isolated for trackable committee accounts.
   - `id`, `username`, `password_hash`, `is_activated` (boolean flag for first-time setup), `name`, `year`, `branch`, `committee`, `valid_until` (admin-controlled expiration date).
3. **`events`**:
   - `id`, `title`, `category`, `event_date`, `time`, `venue`, `seats` (max limit), `filled` (dynamic sum), `organizer_name` (linked to `committee` string or ID), `status` (Pending/Active/Rejected), `color`/`emoji` (for UI styling).
4. **`registrations`**: Mapping table resolving Many-to-Many between typical Students and Events.
   - `id`, `event_id`, `user_id`, `registered_at`.
   - Has a `UNIQUE(event_id, user_id)` constraint to prevent double-bookings.

---

## 5. Recent System Upgrades
If you are analyzing this codebase, note the following recent architectural evolutions:
1. **Dynamic Data Engine**: All frontend views (`AdminDashboard`, `OrganizerDashboard`, `StudentDashboard`, and `LandingPage`) previously contained hardcoded mockup arrays (`const EVENTS = []`, `const REGISTRANTS = []`, etc). These have successfully been stripped out. The entire platform calculates state using `useEffect` API calls directly bridging to the MySQL schemas.
2. **Admin User-Tracking Fix**: The `/api/admin/users` endpoint uses a SQL query to aggregate rows to ensure admins get a directory of organizers and admins in the system without tracking students.
3. **CSS Layout Repairs**: The Admin tracking tables use rigorous `minmax(0, 1fr)`, `overflowX: 'auto'`, and `textOverflow: 'ellipsis'` rules on their grid wrappers to ensure that extraordinarily long email addresses or names do not break or push grid boundaries outside of the glassmorphic modal containers.
