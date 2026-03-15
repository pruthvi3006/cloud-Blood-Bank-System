## Cloud Blood Bank System (AWS)

This project is a simple cloud-based blood bank system with:

- **Frontend**: React (Vite) SPA for users and blood bank admins.
- **Backend**: Node.js + Express REST API.
- **Database**: PostgreSQL (use AWS RDS in production).
- **File storage**: AWS S3 for user medical reports.
- **Hosting**: Intended to run on AWS EC2 (backend + frontend), with RDS + S3.

### Features

- **User (needs blood)**:
  - Register / login.
  - Manage profile and location.
  - Upload & download medical report (stored privately in S3).
  - Search for a blood group and see **nearby blood banks** that have stock.
  - Create and track blood requests (pending / accepted / rejected).

- **Admin (blood bank)**:
  - Register / login as blood bank admin.
  - Create/update blood bank profile (address + latitude/longitude).
  - Update blood stock by blood group.
  - View and accept/reject incoming user requests.

---

### Folder structure

- `backend/` – Node/Express API
  - `src/server.js` – main server entry.
  - `src/routes/` – auth, profile, blood bank search, admin, requests.
  - `src/config/db.js` – Postgres pool.
  - `src/s3/s3Client.js` – S3 presigned URL helpers.
  - `schema.sql` – database tables for users, blood_banks, blood_stock, blood_requests.

- `frontend/` – React SPA
  - `src/App.jsx` – routes and layout.
  - `src/pages/` – login, register, user and admin dashboards.
  - `src/components/MedicalReportUploader.jsx` – S3 upload/download integration.
  - `src/styles.css` – dark, modern UI styling.

---

### Running locally

#### 1. Database (PostgreSQL)

Create a PostgreSQL database (local or in the cloud), then run the schema:

```bash
psql -h HOST -U USER -d DB_NAME -f backend/schema.sql
```

#### 2. Backend

```bash
cd backend
cp .env.example .env
# edit .env with your DATABASE_URL, JWT_SECRET, AWS_REGION, MEDICAL_REPORTS_BUCKET
npm install
npm run dev
```

Backend will listen on port `4000` by default.

#### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server runs on port `5173` and proxies `/api` to `http://localhost:4000`.

---

### AWS setup (high level)

1. **S3 bucket**
   - Create a private bucket for medical reports (e.g. `blood-bank-medical-reports`).
   - Disable public access; backend uses presigned URLs for upload/download.

2. **RDS (PostgreSQL)**
   - Create a PostgreSQL instance in the same VPC as your EC2 instance.
   - Restrict inbound to the EC2 security group.
   - Run `backend/schema.sql` on this DB.

3. **EC2 instance**
   - Launch an Ubuntu EC2 instance.
   - Install Node.js, npm, Nginx, git (or copy the project).
   - Attach an IAM role with S3 access to the instance.
   - Set environment variables (`.env`) for backend: `DATABASE_URL`, `JWT_SECRET`, `AWS_REGION`, `MEDICAL_REPORTS_BUCKET`.
   - Use `pm2` or `systemd` to run `node src/server.js` in the background.

4. **Serving the frontend**
   - Build the React app:

```bash
cd frontend
npm run build
```

   - Serve the static `dist/` folder via Nginx and configure a reverse proxy:
     - `location /api` → `http://localhost:4000`
     - `location /` → React build (`/var/www/blood-bank/dist`).

This gives you a complete end-to-end blood bank system with cloud-hosted database and file storage on AWS.

