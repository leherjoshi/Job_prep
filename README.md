# InterviewForge – Adversarial Interview Preparation Engine

Ever felt unprepared walking into an interview? I built this to fix that.

**Interview AI** is a full-stack web app that uses Google's Gemini AI to help you ace your next interview. Upload your resume, paste a job description, and get personalized interview questions with real-time feedback on your answers.

[**Try it live**](https://jobprep-ou7a3q9ho-lehers-projects.vercel.app) | [**View Source**](https://github.com/leherjoshi/Job_prep)

---

## Why I Built This

After seeing friends struggle with interview prep - not knowing what questions to expect, how to answer them, or if their answers were even good - I thought: what if AI could be your interview coach? 

So I built Interview AI. It analyzes your resume against job descriptions, generates relevant questions, and gives you instant feedback on your practice answers. No more guessing if you're prepared.

---

## What It Does

### 📄 Smart Resume Analysis
Drop in your resume (PDF) and a job description. The AI reads through everything and creates a personalized interview prep plan:
- Technical questions based on your skills and the role
- Behavioral questions tailored to the job requirements  
- Honest feedback on your resume - what works, what doesn't
- A match score showing how well you fit the role

### 🎤 AI-Powered Mock Interviews
This is where it gets interesting. You can actually practice answering the questions:
- Choose technical, behavioral, or both types of questions
- Answer each question at your own pace
- Get instant AI feedback with a score (1-10)
- See what you nailed and what needs work
- Track your performance over time

The AI doesn't just give you a score - it tells you *why* and gives specific suggestions for improvement.

### 📊 Track Your Progress
- Review all your practice sessions
- See your scores improve over time
- Revisit old feedback to measure growth
- Download interview reports as PDFs

---

## Built With

I wanted this to be fast, secure, and actually useful, so I went with:

**Frontend**
- React 18 with Vite (because Create React App is slow)
- React Router for navigation
- SCSS for styling (went with a red/black theme)
- Axios for API calls

**Backend**
- Node.js and Express for the API
- MongoDB for storing everything
- Google's Gemini AI (the `gemini-3-flash-preview` model specifically)
- JWT tokens for auth (stored in httpOnly cookies for security)
- Multer for handling PDF uploads
- bcrypt for password hashing

**Infrastructure**
- Frontend hosted on Vercel (auto-deploys on push)
- Backend on Render (free tier with auto-deploy)
- MongoDB Atlas for the database
- GitHub Actions for CI/CD

---

## Getting It Running Locally

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account (free tier works)
- Google AI API key (get one from [Google AI Studio](https://makersuite.google.com/app/apikey))

### Backend Setup
```bash
cd backend
npm install

# Create a .env file with:
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_secret_key_here
GOOGLE_GEN_AI_KEY=your_google_ai_key
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
PORT=3000

npm start
```

### Frontend Setup
```bash
cd frontent
npm install

# Create a .env file with:
VITE_API_URL=http://localhost:3000

npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and you're good to go.

---

## The Features (What's New)

I started with basic resume analysis, but kept adding features that actually made sense:

### ✅ What's Working
- Secure user authentication (register, login, logout)
- Resume upload and text extraction from PDFs
- AI-generated interview questions (both technical and behavioral)
- Resume feedback with actionable suggestions
- Job match scoring
- **NEW: Interactive mock interviews** - This was the big one. You can now practice answering questions and get real-time AI evaluation
- **NEW: Detailed feedback system** - Not just scores, but actual insights on what to improve
- **NEW: Session analytics** - Track your performance across multiple practice sessions
- **NEW: Progress tracking** - See how you're improving over time
- PDF export for interview reports
- Fully responsive design (works on mobile, tablet, desktop)

### 🔐 Security Stuff
This was important to get right:
- Passwords are hashed with bcrypt (salt rounds: 10)
- JWTs with 24-hour expiration
- Tokens stored in httpOnly cookies (XSS protection)
- Secure cookies in production (HTTPS only)
- SameSite attribute for CSRF protection
- Token blacklisting on logout
- CORS configured properly (accepts only Vercel domains in production)
- Input validation on both frontend and backend

---

## Project Structure

Organized by features, not by file type. Makes it way easier to find things:

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Auth checks, file uploads
│   ├── model/          # MongoDB schemas
│   ├── routes/         # API endpoints
│   ├── services/       # AI integration
│   └── app.js          # Express setup
└── uploads/            # Stored resume files

frontent/
├── src/
│   ├── features/
│   │   ├── auth/           # Login, register, protected routes
│   │   └── Interview/      # Main app features
│   ├── config/             # API configuration
│   └── App.jsx
└── public/
```

---

## How the AI Works

The AI integration was the trickiest part. Here's what I learned:

### Interview Report Generation
The `gemini-3-flash-preview` model completely ignores the `responseSchema` parameter (took me hours to figure this out). So instead of relying on structured output, I:
1. Extract text from the PDF resume (limited to 6000 chars to avoid token limits)
2. Send resume + job description + user context to Gemini
3. Use explicit JSON examples in the prompt
4. Parse the response with Zod schemas for validation
5. Store everything in MongoDB

### Mock Interview Evaluation
For each answer the user submits:
1. Send the question, answer, and resume context to Gemini
2. AI evaluates based on relevance, completeness, and fit
3. Returns a score (1-10), detailed feedback, strengths, and improvement areas
4. All stored in the session for later review

The prompts are carefully crafted to get consistent, useful feedback. Not just "good answer" but actual insights.

---

## Deployment

Both frontend and backend auto-deploy when I push to GitHub:

- **Frontend**: Vercel (crazy fast, free tier is generous)
- **Backend**: Render (free tier sleeps after 15 min, wakes in ~30s)
- **Database**: MongoDB Atlas (512MB free tier is plenty)

**Cost**: About $2-5/month, mostly from Google AI API usage. Everything else is free.

To deploy your own:
1. Fork the repo
2. Connect Vercel to your frontend
3. Connect Render to your backend
4. Set environment variables in both dashboards
5. That's it - pushes to main auto-deploy

Check [DEPLOY_NOW.md](./DEPLOY_NOW.md) for detailed steps.

---

## Challenges I Faced

### 1. CORS Hell
Spent way too long on CORS errors. The issue? Cookies weren't working cross-origin because I hadn't set `sameSite: 'none'` and `secure: true` in production. Also had to make sure CORS accepted all Vercel preview URLs, not just the production one.

### 2. AI Response Format
Gemini's `responseSchema` parameter doesn't work with the preview model. Had to rely on prompt engineering and explicit examples to get structured JSON output. Zod schemas for validation were a lifesaver.

### 3. Database Schema Mismatch
Had a typo in an index (`usrname_1` instead of `username_1`) that broke registration. Took forever to debug because the error message was cryptic. Learned to double-check index names.

### 4. File Upload in Production
Multer works great locally but needed special config for production. Had to make sure the uploads directory exists and is writable.

---

## What's Next

Ideas I'm considering:
- **Email notifications** - Send interview reports via email
- **Voice recording** - Practice answering out loud, get feedback on delivery
- **Company database** - Pre-loaded job descriptions for popular companies
- **Collaborative features** - Share reports with mentors for feedback
- **Mobile app** - React Native version
- **Video interview practice** - Record yourself answering

---

## Documentation

I wrote a bunch of docs to help understand the project:
- [**Simple Documentation**](./PROJECT_DOCUMENTATION_SIMPLE.md) - Everything explained in plain English (60+ pages)
- [**Technical Overview**](./PROJECT_OVERVIEW.md) - Deep dive into architecture and implementation
- [**Deployment Guide**](./DEPLOY_NOW.md) - Step-by-step deployment instructions
- [**API Testing**](./API_TESTING.md) - How to test the API endpoints

---

## Contributing

This is a personal project, but if you find bugs or have suggestions, feel free to open an issue. Pull requests welcome!

---

## A Note on AI

The AI isn't perfect. Sometimes it gives generic feedback, sometimes it's spot-on. I'm continuously improving the prompts to make it more useful. The goal isn't to replace human interview prep, but to supplement it with instant, accessible practice.

---

## License

MIT License - do whatever you want with this code. Just don't blame me if something breaks 😄

---

## Contact

Built by Leher Joshi

- GitHub: [@leherjoshi](https://github.com/leherjoshi)
- Project: [Job_prep](https://github.com/leherjoshi/Job_prep)

---

If this helped you, star the repo ⭐ It helps others find it too.

Happy interviewing! 🎯
