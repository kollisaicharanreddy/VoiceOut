# VoiceOut

VoiceOut is an anonymous complaint tracker with a Spring Boot backend and a React + Vite frontend.

## Structure

- `src/backend` - Spring Boot API, security, persistence, and enrichment scaffolding
- `src/frontend` - Vite React UI for anonymous submission and admin review
- `docs` - planning and design notes

## Run locally

### Prerequisites

- Java 17
- Maven 3.9+
- Node.js 18+
- PostgreSQL 14+ running locally

### 1. Create the database

Create a database and user that match the default backend settings, or override them with environment variables.

Default values used by the backend:

- `VOICEOUT_DB_URL=jdbc:postgresql://localhost:5432/voiceout`
- `VOICEOUT_DB_USERNAME=voiceout`
- `VOICEOUT_DB_PASSWORD=voiceout`

Example PostgreSQL setup commands:

```sql
CREATE USER voiceout WITH PASSWORD 'voiceout';
CREATE DATABASE voiceout OWNER voiceout;
GRANT ALL PRIVILEGES ON DATABASE voiceout TO voiceout;
```

Connect as the new user and verify the database is reachable before starting the backend.

#### In pgAdmin

1. Open pgAdmin and connect to your PostgreSQL server.
2. In the left tree, right-click `Login/Group Roles` and choose `Create` > `Login/Group Role`.
3. On the `General` tab, set the role name to `voiceout`.
4. On the `Definition` tab, set the password to `voiceout`.
5. Open the `Privileges` tab and keep the defaults, or enable `Can login` if needed.
6. Click `Save`.
7. Right-click `Databases` and choose `Create` > `Database`.
8. Set the database name to `voiceout`.
9. Set the owner to `voiceout`.
10. Click `Save`.
11. Expand the `voiceout` database and open `Query Tool`.
12. Run a simple check such as `SELECT current_database();` to confirm the connection.

### 1b. If you want pgvector

The current code stores embeddings as a text placeholder, so pgvector is not required for the app to start today. If you want the database prepared for the real vector column, install the extension now:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

If you are using Docker for Postgres, use an image that already includes pgvector, or install the extension in the container and then run the command above.

The backend code will need a follow-up change before it can store a true `vector(...)` column instead of the current text-based embedding field.

#### In pgAdmin

1. Expand your `voiceout` database.
2. Open `Query Tool`.
3. Run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

4. Refresh the database tree if the extension does not appear immediately.
5. If you plan to use real pgvector columns later, keep this extension enabled before switching the backend schema.

### 2. Start the backend

From the repository root:

```powershell
cd src/backend
mvn spring-boot:run
```

Optional environment variables:

- `VOICEOUT_ADMIN_USERNAME` default: `admin`
- `VOICEOUT_ADMIN_PASSWORD` default: `admin123`
- `VOICEOUT_FRONTEND_ORIGIN` default: `http://localhost:5173`

The API runs on `http://localhost:8080`.

### 3. Start the frontend

In a second terminal:

```powershell
cd src/frontend
npm install
npm run dev
```

The app runs on `http://localhost:5173` and proxies `/api` requests to the backend.

### 4. Use the app

- Open the frontend in your browser.
- Submit an anonymous complaint on the public form.
- Copy the tracking code that is returned.
- Use the admin panel with the seeded admin credentials to review complaints, update status, and add notes.

### 5. Build checks

```powershell
cd src/backend
mvn -DskipTests compile

cd ..\frontend
npm run build
```

If you want, you can also set the backend database variables directly in PowerShell before starting the app:

```powershell
$env:VOICEOUT_DB_URL = 'jdbc:postgresql://localhost:5432/voiceout'
$env:VOICEOUT_DB_USERNAME = 'voiceout'
$env:VOICEOUT_DB_PASSWORD = 'voiceout'
```

## Default admin access

The backend seeds an admin user from these values:

- `VOICEOUT_ADMIN_USERNAME` default: `admin`
- `VOICEOUT_ADMIN_PASSWORD` default: `admin123`

## Notes

- Public submissions are anonymous.
- Admin routes are protected with HTTP Basic auth.
- The similarity and enrichment flow is advisory and does not block complaint submission.