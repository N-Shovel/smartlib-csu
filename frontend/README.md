# SmartLib Frontend

React + Vite frontend for **SmartLib**, a library management system for Caraga State University.

## Features

- Role-based authentication (`staff` and `borrower`)
- Book browsing and book details page
- Borrow and return flow with borrower history tracking
- Room reservation with approval workflow
- Staff dashboard, approvals, borrower tracking, and borrower list views
- CSV export utilities for reports
- Protected routes by role

## Tech Stack

- React 19
- React Router 7
- Vite 7
- ESLint 9

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+

### Install

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The app runs on Vite's default local URL (usually `http://localhost:5173`).

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Demo Accounts

Pre-seeded users are available through local storage initialization:

- **Staff**: `staff@library.com` / `1234`
- **Borrower**: `borrower@library.com` / `1234`

## App Routes

### Public

- `/login`
- `/signup`

### Borrower (protected)

- `/borrower/browse`
- `/borrower/book/:id`
- `/borrower/reserve`

### Staff (protected)

- `/staff/dashboard`
- `/staff/approvals`
- `/staff/tracking`
- `/staff/borrowers`

## Data and Persistence

Current frontend behavior is mock-data driven and persisted in browser `localStorage`.

Main storage keys:

- `library_users`
- `library_current_user`
- `library_books`
- `library_activity_logs`
- `library_borrow_history`
- `library_reservations`
- `library_reservation_history`

To reset app state, clear site storage in your browser.

## Project Structure (Frontend)

```text
src/
	app/            # app-level providers and routes
	components/     # shared UI components
	constants/      # app constants (roles, statuses)
	context/        # auth context
	data/           # seed/mock data
	pages/          # route pages (auth, borrower, staff)
	services/       # domain logic and localStorage access
	utils/          # utility functions
```

## Notes

- This frontend currently works without requiring a live backend API.
- A backend exists in the repository and can be integrated later for persistent server-side data.
