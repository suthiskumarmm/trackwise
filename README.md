# TrackWise: Relational Expense Analytics Platform

A full-stack expense tracking and analytics platform with group expense splitting, visual dashboards, and smart insights.

## Tech Stack

- **Frontend**: React.js, Tailwind CSS, Recharts
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT

## Project Structure

```
trackwise/
├── backend/          # Express API
│   ├── models/       # Mongoose schemas
│   ├── routes/       # API routes
│   ├── middleware/   # JWT auth middleware
│   └── server.js
└── frontend/         # React app
    └── src/
        ├── pages/    # Landing, Dashboard, Expenses, Groups, Analytics, Settings
        ├── components/
        ├── context/  # Auth context
        └── utils/    # API client, helpers
```

## Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

The frontend proxies API calls to `http://localhost:5000`.

## Features

- JWT authentication (register/login)
- Dashboard with spending trend charts and smart insights
- Add/edit/delete expenses with category tags
- Group expense splitting (equal split, settle up)
- Analytics: monthly trends, category breakdown, budget alerts
- Search & filter by date, category, type
- CSV export
- Dark mode toggle
- Responsive mobile-friendly UI

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |
| GET | /api/expenses | List expenses (with filters) |
| POST | /api/expenses | Create expense |
| PUT | /api/expenses/:id | Update expense |
| DELETE | /api/expenses/:id | Delete expense |
| GET | /api/groups | List groups |
| POST | /api/groups | Create group |
| GET | /api/groups/:id | Group detail |
| POST | /api/groups/:id/expenses | Add group expense |
| PUT | /api/groups/:id/expenses/:expId/settle | Settle split |
| GET | /api/groups/:id/balances | Group balances |
| GET | /api/analytics/summary | Financial summary |
| GET | /api/analytics/by-category | Category breakdown |
| GET | /api/analytics/monthly-trend | Monthly trend |
| PUT | /api/users/profile | Update profile |
| PUT | /api/users/password | Change password |
