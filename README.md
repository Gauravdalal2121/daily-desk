<div align="center">
  <img width="1200" height="475" alt="Daily Desk Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Daily Desk 🗓️

Daily Desk is an **AI-powered task management web application** designed to help users plan, organize, and manage their daily activities efficiently.  
The application uses artificial intelligence to assist in **task breakdown, prioritization, and reminders**, helping users stay productive and focused.

---

## 🔗 Live Demo

👉 **https://daily-desk-deploy.vercel.app**

> This is the deployed, working version of the project and can be accessed without any local setup.

---

## 📌 Problem Statement

Managing daily tasks manually can be inefficient and overwhelming, especially when users have multiple deadlines, priorities, and recurring activities.  
Traditional to-do applications often lack intelligent assistance for task planning, prioritization, and contextual understanding.

---

## 💡 Proposed Solution

Daily Desk provides a **smart task management system** that integrates AI to:

- Understand natural language task inputs
- Generate task breakdowns and checklists
- Suggest task priorities
- Manage reminders and recurring schedules

This approach reduces manual effort and improves overall productivity.

---

## ✨ Features

- AI-assisted task creation
- Automatic task prioritization
- Checklist and subtask generation
- Reminder and scheduling support
- Light / Dark theme toggle
- Responsive user interface
- Data persistence using browser LocalStorage

---

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- Vite

### AI Integration
- Google Gemini API

### Storage
- Browser LocalStorage

### Deployment
- Vercel

### Version Control
- Git & GitHub

---

## 🏗️ System Architecture

The application follows a **client-side architecture**:

- The React frontend handles UI rendering and user interaction
- AI requests are processed securely using environment variables
- Task data is stored locally in the browser using LocalStorage
- Vercel manages build, deployment, and hosting

> No traditional backend server is required for this application.

---

## ⚙️ Run Locally

### Prerequisites
- Node.js (v18 or later)
- npm

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/Gauravdalal2121/daily-desk.git
   cd daily-desk
2. Install dependencies:
   ```bash
   npm install
3. Create a .env.local file in the root directory and add:
   GEMINI_API_KEY=your_api_key_here
4. Run the development server:
   ```bash
   npm run dev
5. Open your browser and visit:
   http://localhost:3000
   


## 🔐 Security Note

- API keys are managed using environment variables and are not included in the repository to ensure security.

## 👤 Author
- Gaurav Dalal
- Daily Desk – Final Year Project