# Al-Amal Clinic — Frontend

A clinic appointment management web app with an Arabic (RTL) interface and three user roles: **Patient**, **Doctor**, and **Admin**.

**Live demo:** https://clinic-frontend-omega-lake.vercel.app

> No account needed. On the login page, click **Patient**, **Doctor**, or **Admin** to explore the app with sample data.

## Features

- **Patients:** register, browse doctors, book appointments, track appointment status, edit profile.
- **Doctors:** view their appointments and confirm, complete, or cancel them; view patients.
- **Admins:** dashboard with stats, manage appointments, doctors, and patients, create users with roles.
- JWT authentication with automatic token refresh and role-based route guards.
- Responsive Arabic (RTL) UI.
## Screenshots

<p>
  <img src="docs/screenshots/Home.png" width="49%" alt="Home" />
  <img src="docs/screenshots/Login.png" width="49%" alt="login" />
    <img src="docs/screenshots/Register.png" width="49%" alt="Register" />
    <img src="docs/screenshots/Patient.png" width="49%" alt="Patient" />
   <img src="docs/screenshots/Doctor.png" width="49%" alt="Doctor" />
   <img src="docs/screenshots/Admin.png" width="49%" alt="Admin" />
</p>
## Tech Stack

- React 18 + Vite
- React Router
- Plain CSS
- Deployed on Vercel

## Getting Started

```bash
npm install
npm run dev
```

The app runs at http://localhost:5173.

## Configuration

The app can run with or without the backend, controlled by environment variables:

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_DEMO` | `true` runs the app with sample data (no backend needed) | `false` |
| `VITE_API_URL` | Backend API base URL | `https://localhost:7047/api` |

Create a `.env` file in the project root, for example:

```
VITE_DEMO=true
```

## Backend

The REST API (ASP.NET Core, Clean Architecture, JWT) lives in a separate repository: [clinic-backend](https://github.com/Samerthalji/clinic-backend).
To use it, set `VITE_DEMO=false`, point `VITE_API_URL` to the API, and enable CORS for `http://localhost:5173`.

