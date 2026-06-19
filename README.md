# LearnEase

LearnEase is an AI-powered learning web application built for students. It helps users create study materials, generate quizzes from uploaded files, chat with an AI assistant, take quizzes, and track learning progress through a dashboard.

The project is split into two main parts:

- `frontend/` - React + Vite user interface
- `backend/` - Node.js + Express API server

## What the Project Does

LearnEase lets students upload learning materials such as PDF, DOCX, or TXT files, then uses AI to help turn those materials into useful study outputs. Users can create reviewers, generate quizzes, answer quizzes with timers, view quiz history, and monitor their activity/progress.

## Key Features

### User Authentication

- Email and password sign up
- Login and logout
- Google sign in support
- Email verification support
- Forgot password support
- Protected routes for logged-in users only

### AI Assistant

- Chat with an AI assistant
- Save conversation threads
- Rename and delete chat history
- User-specific chat storage using Firebase/Firestore

### Study Materials Generator

- Upload PDF, DOCX, or TXT files
- Generate AI-based reviewers from study content
- Save generated reviewers to history
- Search and filter saved reviewers
- Uses a local K-12 dataset as extra context when available

### Quiz Generator

- Upload learning materials and generate quizzes
- Supports multiple question types such as multiple choice and true/false
- Adjustable number of questions
- Adjustable difficulty
- Optional timer settings
- Quiz history saved per user

### Quiz Taking and Progress

- Take generated quizzes inside the app
- Automatic score calculation
- Save quiz results
- Track recent activity
- Track learning progress and active time

### Security Features

- Environment variables are used for private keys
- `.env` is ignored and should not be uploaded to GitHub
- `.env.example` is included as a safe template
- API rate limiting is enabled
- Helmet security middleware is enabled
- Backend validation is used for auth inputs
- Firebase Admin credentials are optional but supported for metrics

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios
- Firebase Authentication
- Firestore
- Tailwind CSS
- Lucide React icons

### Backend

- Node.js
- Express.js
- Firebase REST API
- Firebase Admin SDK
- Gemini AI API
- Multer for file uploads
- PDF/DOCX/TXT text extraction
- Express Rate Limit
- Helmet
- CSV/XLSX dataset handling

## Project Structure

```text
LearnEase/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── data/
│   ├── ledger/
│   ├── middleware/
│   ├── routes/
│   ├── uploads/
│   ├── utils/
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── axiosConfig.js
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── firestore.rules
├── SECURITY_CHECKPOINT2.md
├── .gitignore
└── README.md
```

## Requirements

Before running the project, install:

- Node.js
- npm
- Firebase project
- Gemini API key

## Environment Setup

The real environment file is not included for security reasons.

Inside the `backend` folder, copy this file:

```text
.env.example
```

Then rename the copy to:

```text
.env
```

Fill in the values inside `backend/.env`.

Example:

```env
PORT=5000

# Firebase Config
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_firebase_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id

# Frontend
CLIENT_URL=http://localhost:5173
FRONTEND_ORIGIN=http://localhost:5173

NODE_ENV=development

# Gemini AI Config
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
GEMINI_MODEL_FAST=gemini-1.5-flash
GEMINI_MODEL_PRO=gemini-1.5-pro

# Optional Firebase Admin / Service Account
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="your_private_key_here"
```

> Important: Do not upload your real `.env` file to GitHub. Only `.env.example` should be public.

## How to Run the Project

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/your-repository.git
cd your-repository
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Create the Backend `.env` File

Create `backend/.env` by copying `backend/.env.example`, then fill in your Firebase and Gemini values.

### 4. Start the Backend Server

```bash
npm run dev
```

The backend should run at:

```text
http://localhost:5000
```

You can test it by opening:

```text
http://localhost:5000/health
```

### 5. Install Frontend Dependencies

Open a second terminal, then run:

```bash
cd frontend
npm install
```

### 6. Start the Frontend

```bash
npm run dev
```

The frontend should run at:

```text
http://localhost:5173
```

## Common Commands

### Backend

```bash
cd backend
npm run dev
```

Run backend in production mode:

```bash
npm start
```

### Frontend

```bash
cd frontend
npm run dev
```

Build frontend:

```bash
npm run build
```

Preview frontend build:

```bash
npm run preview
```

## Main API Routes

### Auth Routes

```text
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/google
POST /api/auth/forgot-password
POST /api/auth/resend-verification
GET  /api/auth/verify
POST /api/auth/logout
GET  /api/auth/metrics
```

### AI Routes

```text
POST /api/ai/chat
POST /api/ai/quiz
POST /api/ai/validate-content
POST /api/ai/quiz-from-file
POST /api/ai/reviewer
```

## Supported Upload Files

The app supports these study material formats:

```text
.pdf
.docx
.txt
```

The backend upload limit is currently set to 12 MB per file.

## How It Works

1. The user creates an account or logs in.
2. The frontend stores the login token locally.
3. Protected pages check the token before allowing access.
4. The frontend sends requests to the backend API.
5. The backend verifies the Firebase token.
6. Uploaded files are temporarily stored in `backend/uploads/`.
7. The backend extracts text from the uploaded file.
8. Gemini AI generates reviewers, quiz questions, or chat responses.
9. Firestore stores user-specific progress, quiz history, reviewer history, and chat threads.
10. The dashboard displays activity, progress, and user metrics.

## Notes for GitHub Upload

This repository should not include:

```text
node_modules/
.env
backend/uploads/*
dist/
build/
```

These are already handled by `.gitignore`.

After cloning the project, users must run:

```bash
npm install
```

inside both `backend` and `frontend` because `node_modules` is intentionally not uploaded.

## Troubleshooting

### Backend does not start

Check that you created:

```text
backend/.env
```

Also make sure `PORT`, `FIREBASE_API_KEY`, and `GEMINI_API_KEY` are filled in.

### Frontend cannot connect to backend

Make sure the backend is running at:

```text
http://localhost:5000
```

Also check that this value exists in `backend/.env`:

```env
FRONTEND_ORIGIN=http://localhost:5173
```

### AI features do not work

Check that your Gemini API key is correct:

```env
GEMINI_API_KEY=your_gemini_api_key
```

### Login or signup does not work

Check your Firebase project settings and make sure Email/Password and Google sign-in are enabled in Firebase Authentication.

## Important Security Reminder

Never commit real API keys, Firebase private keys, service account credentials, or `.env` files to GitHub.

Use `.env.example` only as a guide for what values are needed.

## Author

Created as a student project for an AI-powered learning and quiz generation system.
