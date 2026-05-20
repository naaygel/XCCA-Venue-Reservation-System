# XCCA Venue Reservation System - Azure SQL + Custom Auth Version

test redeploy

This version keeps the frontend pages and design, but replaces localStorage users/reservations with:

- Azure Functions API
- Azure SQL Database
- Custom username/password account registration
- JWT-based login session
- Backend time-range conflict checking
- Admin approval/delete support

## Folder Structure

```txt
xcca-reservation-azure-custom-auth/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── api/
│   ├── shared/
│   │   ├── auth.js
│   │   └── db.js
│   ├── register/
│   ├── login/
│   ├── reservations/
│   ├── reservationById/
│   ├── approveReservation/
│   ├── package.json
│   └── local.settings.sample.json
└── database.sql
```

## Azure Portal Setup

### 1. Create Azure SQL Database

Create a SQL Database in Azure Portal, then open Query Editor and run `database.sql`.

### 2. Add App Settings for the Azure Function API

Add these settings in Azure:

```txt
SQL_SERVER=your-server.database.windows.net
SQL_DATABASE=ReservationDB
SQL_USER=your-sql-admin
SQL_PASSWORD=your-sql-password
JWT_SECRET=use-a-long-random-secret
```

Never place these values in frontend JavaScript.

### 3. Deploy to Azure Static Web Apps

Use GitHub deployment. Set:

```txt
App location: /
API location: api
Output location: leave blank
```

### 4. Create Admin User

Register a normal user through the app first. Then run:

```sql
UPDATE Users SET role = 'admin' WHERE username = 'your_admin_username';
```

After logging in again, the Admin tab will appear.

## API Routes

```txt
POST   /api/register
POST   /api/login
GET    /api/reservations
POST   /api/reservations
PUT    /api/reservations/{id}
DELETE /api/reservations/{id}
PUT    /api/reservations/{id}/approve
```

## Conflict Checking

The backend blocks reservations for the same venue and date when the time range overlaps:

```txt
newStart < existingEnd
AND
newEnd > existingStart
```

This prevents reservations like:

```txt
Existing: 10:00 - 14:00
Blocked:  11:00 - 13:00
Blocked:  09:00 - 11:00
Allowed:  14:00 - 16:00
```
