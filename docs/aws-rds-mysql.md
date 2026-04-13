# Amazon RDS MySQL for this project

The backend uses **MySQL** via `mysql2` and a single **`DATABASE_URL`**. All app data (users, blood banks, stock, requests) lives in whatever database that URL points to—local MySQL or **Amazon RDS for MySQL**.

## 1. Create the RDS instance (console)

1. AWS Console → **RDS** → **Create database**.
2. Engine: **MySQL** (8.0 is a good match for this project).
3. Template: **Free tier** or **Production** as needed.
4. Set **DB instance identifier**, **Master username**, **Master password**, and **Initial database name** (e.g. `bloodbank`).
5. **Connectivity**
   - **Public access**: `Yes` only if your app runs outside the VPC (e.g. laptop hitting RDS). Prefer **No** and reach RDS from **EC2 in the same VPC** for production.
   - **VPC security group**: allow inbound **MySQL (3306)** from:
     - your **EC2 instance security group**, or  
     - your **office IP /32** for development.
6. Create the database and wait until status is **Available**.

## 2. Connection string (`backend/.env`)

Format:

```env
DATABASE_URL=mysql://MASTER_USER:MASTER_PASSWORD@RDS_ENDPOINT:3306/DATABASE_NAME
DATABASE_SSL=true
```

Example:

```env
DATABASE_URL=mysql://admin:MySecurePass%21@blood-bank.xxxxx.ap-south-1.rds.amazonaws.com:3306/bloodbank
DATABASE_SSL=true
```

- **Endpoint**: copy from RDS → your DB → **Connectivity & security** → **Endpoint** (hostname only, no `https://`).
- **Password**: if it contains `@`, `:`, `/`, `?`, `#`, or `%`, [URL-encode](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding) those characters in the URL (e.g. `@` → `%40`).

## 3. TLS (`DATABASE_SSL`)

For RDS, set:

```env
DATABASE_SSL=true
```

Node verifies the server certificate by default (`rejectUnauthorized: true`). If you hit certificate errors in a dev environment, you can temporarily set (not recommended for production):

```env
DATABASE_SSL_REJECT_UNAUTHORIZED=false
```

For stricter setups, use the [AWS RDS CA bundle](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html) and configure `mysql2` with a custom `ca` (code change or wrapper)—this repo uses the simple TLS flag above.

## 4. Apply the schema

From a machine that can reach RDS (same network or bastion):

```bash
mysql -h YOUR_RDS_ENDPOINT -u MASTER_USER -p DATABASE_NAME < backend/schema.sql
```

Or use MySQL Workbench / DBeaver with the same host, user, password, and database.

If you already ran an older schema locally, use **`backend/migrations/`** for incremental changes (e.g. extra columns on `blood_requests`) before going live.

## 5. Run the API

```bash
cd backend
# .env contains DATABASE_URL + DATABASE_SSL=true
npm start
```

The server logs `Database connection successful` on startup if the pool can reach RDS.

## 6. Terraform (optional)

This repo includes optional RDS in `infrastructure/terraform/` (`enable_rds = true`). That creates MySQL in **private subnets**; only the **app** security group can use port **3306**. Your `DATABASE_URL` must use that instance’s **endpoint** from Terraform output `rds_endpoint`.

---

**Security tips**

- Do not commit `.env` or store the master password in git.
- Prefer **IAM database authentication** only if you extend the app to use it; the current code uses password auth via `DATABASE_URL`.
- Restrict the RDS security group to the smallest set of sources (EC2 SG, not `0.0.0.0/0`).
