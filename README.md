# Freelancer Project Bidding Platform
*(Second-Year B.Tech CSE College Mini-Project)*

A simple, full-stack web application where **Clients** post freelance projects and **Freelancers** submit bids. Clients can review bids, accept one winning proposal, and award the project. Built with clean, student-level code using the MERN stack (MongoDB, Express, React, Node.js).

---

## 1. Project Purpose & Overview

In many real-world freelance marketplaces (like Upwork or Fiverr), clients require tasks done (e.g. web apps, logos, mobile apps) while freelancers propose their pricing and timelines. 

This college project implements core business logic and database-level integrity:
1. **Role-Based Access Control:** Separate roles for `client` and `freelancer`.
2. **Duplicate Bid Prevention:** A freelancer cannot submit more than one bid for the same project (enforced both in backend controller logic and MongoDB compound unique index).
3. **Ownership-Based Authorization:** Only the client who created a project has permission to accept bids, edit, or delete the project.
4. **Project Bidding Lifecycle:**
   - Client creates an `open` project with a budget.
   - Freelancers submit bids (amount + proposal).
   - Client selects and accepts one bid.
   - The accepted bid becomes `accepted`, other bids become `rejected`, and the project becomes `awarded` (blocking further bids).

---

## 2. Technologies Used

- **Backend:**
  - **Node.js & Express.js:** RESTful API server
  - **MongoDB & Mongoose:** NoSQL database and schema modeling
  - **JSON Web Token (jsonwebtoken):** Stateless authentication
  - **bcryptjs:** Password hashing
  - **cors & dotenv:** Cross-origin resource sharing & environment configuration
- **Frontend:**
  - **React (Vite):** User interface
  - **React Router (v7):** Client-side routing
  - **Axios:** HTTP client with auth token interceptor
  - **Vanilla CSS:** Responsive, clean styling without heavy external UI libraries

---

## 3. Project Folder Structure

```
main/
├── backend/
│   ├── middleware/
│   │   └── auth.js            # JWT verification & req.user attachment
│   ├── models/
│   │   ├── User.js            # Name, email, password (hashed), role
│   │   ├── Project.js         # Title, description, budget, client ref, status
│   │   └── Bid.js             # Project ref, freelancer ref, amount, proposal, status, compound index
│   ├── routes/
│   │   ├── auth.js            # /api/auth (register, login, me)
│   │   ├── projects.js        # /api/projects (CRUD, bids submission, client projects)
│   │   └── bids.js            # /api/bids (accept bid authorization, my bids)
│   ├── .env                   # Local backend configuration (PORT=5001, MONGO_URI, JWT_SECRET)
│   ├── .env.example           # Example environment template
│   ├── package.json           # Backend dependencies and scripts
│   ├── seed.js                # Database seeder with sample clients, freelancers & bids
│   ├── test_api.js            # Automated verification tests for all 8 assignment test cases
│   └── server.js              # Express app entry point & MongoDB connection
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx     # Navigation bar with role badges and auth actions
│   │   │   └── ProjectCard.jsx# Project card display
│   │   ├── pages/
│   │   │   ├── Login.jsx      # Login page with demo credentials
│   │   │   ├── Register.jsx   # Role selection (Client / Freelancer) registration
│   │   │   ├── Projects.jsx   # Public project listings with status filters
│   │   │   ├── ProjectDetails.jsx # Detailed view, proposal submission, bid acceptance
│   │   │   ├── CreateProject.jsx  # Client-only project posting
│   │   │   └── Dashboard.jsx  # Client (manage/accept bids) & Freelancer (track bids)
│   │   ├── context/
│   │   │   └── AuthContext.jsx# React Context for login state & localStorage sync
│   │   ├── api.js             # Axios instance with Authorization header interceptor
│   │   ├── App.jsx            # App routes
│   │   ├── App.css            # Clean CSS stylesheet
│   │   └── main.jsx           # React DOM root
│   ├── .env                   # Frontend environment (VITE_API_URL=http://localhost:5001/api)
│   ├── .env.example           # Example frontend environment template
│   └── package.json           # Frontend dependencies
│
├── prompt.md                  # Project requirements specification
└── README.md                  # Documentation and viva preparation guide
```

---

## 4. Database Schema & Relationships

### MongoDB Collections:
```
USER (Client / Freelancer)
  │
  │ creates (1 to many)
  ▼
PROJECT (Title, Budget, Status: open / awarded / closed)
  │
  │ has (1 to many)
  ▼
BID (Amount, Proposal, Status: pending / accepted / rejected)
  ▲
  │ submitted by (many to 1)
  │
USER (Freelancer)
```

1. **User Schema (`models/User.js`):**
   - `name`: String (required)
   - `email`: String (required, unique, lowercase)
   - `password`: String (bcrypt hashed)
   - `role`: String (enum: `['client', 'freelancer']`)
   - `timestamps`: true

2. **Project Schema (`models/Project.js`):**
   - `title`: String (required)
   - `description`: String (required)
   - `budget`: Number (required, min > 0)
   - `client`: ObjectId (ref: `'User'`, required)
   - `status`: String (enum: `['open', 'awarded', 'closed']`, default: `'open'`)
   - `timestamps`: true

3. **Bid Schema (`models/Bid.js`):**
   - `project`: ObjectId (ref: `'Project'`, required)
   - `freelancer`: ObjectId (ref: `'User'`, required)
   - `amount`: Number (required, min > 0)
   - `proposal`: String (required, max 1000 characters)
   - `status`: String (enum: `['pending', 'accepted', 'rejected']`, default: `'pending'`)
   - `timestamps`: true
   - **Compound Unique Index:** `bidSchema.index({ project: 1, freelancer: 1 }, { unique: true });`

---

## 5. Duplicate Bid Protection Logic

A freelancer is only allowed to submit **one bid** per project. This is protected at two layers:
1. **Application Layer (`routes/projects.js`):**
   ```javascript
   const existingBid = await Bid.findOne({
     project: project._id,
     freelancer: req.user._id
   });
   if (existingBid) {
     return res.status(400).json({
       message: "You have already submitted a bid for this project."
     });
   }
   ```
2. **Database Layer (`models/Bid.js`):**
   ```javascript
   bidSchema.index({ project: 1, freelancer: 1 }, { unique: true });
   ```
   If a duplicate insert ever bypassed the controller check, MongoDB throws duplicate key error `11000`, which our route catches and responds with HTTP 400.

---

## 6. Ownership-Based Authorization Logic

Security rules are enforced on the backend, never trusting the client:
1. **Project Creation:**
   - Enforces `req.user.role === 'client'`.
   - `client` field is automatically set to `req.user._id`.
2. **Project Modification & Deletion:**
   ```javascript
   if (project.client.toString() !== req.user._id.toString()) {
     return res.status(403).json({
       message: "You are not allowed to modify this project"
     });
   }
   ```
3. **Accepting a Bid (`PATCH /api/bids/:id/accept`):**
   ```javascript
   if (req.user.role !== 'client') {
     return res.status(403).json({ message: "Only clients can accept bids" });
   }
   if (project.client.toString() !== req.user._id.toString()) {
     return res.status(403).json({ message: "You are not authorized to accept bids on this project" });
   }
   ```
   When accepted:
   - Winning bid status $\rightarrow$ `'accepted'`
   - All other bids for the project $\rightarrow$ `'rejected'`
   - Project status $\rightarrow$ `'awarded'`

---

## 7. API Endpoints List

### Authentication:
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user (name, email, password, role) | No |
| `POST` | `/api/auth/login` | Login user and receive JWT | No |
| `GET` | `/api/auth/me` | Fetch logged-in user details | Yes (Bearer Token) |

### Projects:
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/projects` | List all projects | No |
| `GET` | `/api/projects/:id` | Get project details and all submitted bids | No |
| `POST` | `/api/projects` | Create a new project (Client only) | Yes (Client) |
| `PUT` | `/api/projects/:id` | Update project details (Owner Client only) | Yes (Owner Client) |
| `DELETE` | `/api/projects/:id` | Delete project and associated bids (Owner Client only) | Yes (Owner Client) |
| `GET` | `/api/projects/my-projects`| Get projects created by logged-in client with bid counts | Yes (Client) |

### Bids:
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/projects/:id/bids` | Submit a bid for an open project (Freelancer only) | Yes (Freelancer) |
| `PATCH` | `/api/bids/:id/accept` | Accept a bid (Owner Client only) | Yes (Owner Client) |
| `GET` | `/api/bids/my-bids` | Get all bids submitted by logged-in freelancer | Yes (Freelancer) |

---

## 8. Sample Seed Credentials

All accounts use the password: `password123`

| Role | Name | Email |
|---|---|---|
| **Client** | Rahul | `rahul@example.com` |
| **Client** | Priya | `priya@example.com` |
| **Freelancer** | Aman | `aman@example.com` |
| **Freelancer** | Rohit | `rohit@example.com` |
| **Freelancer** | Sneha | `sneha@example.com` |

---

## 9. Setup & Running Instructions

### Prerequisites:
- Node.js (v18+)
- MongoDB running locally on `mongodb://127.0.0.1:27017` OR a MongoDB Atlas cluster URI.

### Step 1: Backend Setup
```bash
cd backend
npm install
```

Configure `backend/.env`:
```env
PORT=5001
MONGO_URI=
JWT_SECRET=mysecretkey123456studentbtechproject
```
*(Note: If using MongoDB Atlas, set `MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/main?retryWrites=true&w=majority`)*

Seed the sample database:
```bash
npm run seed
```

Run automated verification tests:
```bash
node test_api.js
```

Start the backend server:
```bash
npm run dev
# OR: npm start
```
Backend runs at: `http://localhost:5001`

### Step 2: Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
```

Configure `frontend/.env`:
```env
VITE_API_URL=http://localhost:5001/api
```

Start the React development server:
```bash
npm run dev
```
Frontend runs at: `http://localhost:5173`

---

## 10. Viva Explanation Guide

When explaining this project to the viva examiner:
1. **Explain the Architecture:** "This is a 3-tier MERN stack architecture: React frontend handles views and routing, Express REST API exposes endpoints, and MongoDB stores documents using Mongoose schemas."
2. **Explain Authentication:** "We use JSON Web Tokens (JWT). When a user logs in, we verify the hashed password using bcrypt. If valid, we issue a signed token containing the user ID and role, which the client stores and sends in the `Authorization: Bearer <token>` header."
3. **Explain Authorization:** "Routes check `req.user.role`. Furthermore, resource modification endpoints compare `project.client.toString()` with `req.user._id.toString()` to guarantee only the creator can edit, delete, or accept bids."
4. **Explain Bid Acceptance:** "When a bid is accepted, we update the selected bid to `accepted`, set all other bids on the same project to `rejected`, and set the project status to `awarded`, preventing any further bids."
