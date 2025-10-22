# OfficeMoM (Smart Minutes of Meeting)

OfficeMoM is an intelligent AI Meeting Assistant designed to make meetings smarter, faster, and more productive. The platform automates meeting minutes seamlessly using advanced AI-powered transcription and smart formatting. With OfficeMoM, users can capture every important detail from online, offline, or recorded meetings — without having to take a single note manually.

The platform offers four main features:

1. Join Online Meetings (like Google Meet, Zoom, or Teams) where OfficeMoM can automatically record and transcribe conversations in real time.

2. Generate Notes from Files, allowing users to upload audio or video recordings and instantly turn them into clear, organized meeting summaries.

3. Start New Meetings for in-person sessions, making it easy to log and document face-to-face discussions.

4. Meeting Master, a smart meeting bot that can join virtual meetings on behalf of users to capture and summarize everything automatically.

The elegant, dark-themed interface provides quick access to all these tools with options to start a free trial or watch a demo, helping users explore the full capabilities of the platform. OfficeMoM helps teams save time, boost productivity, and ensure every meeting ends with actionable, structured outcomes — turning conversations into organized knowledge effortlessly.

---

## 🚀 Features

- 🎤 **Meeting Recording** – Record audio of meetings in real time.
- 📝 **Auto Transcription** – Convert recorded audio into structured text.
- 📊 **History Management** – Store and manage meeting notes in a database.
- 🔗 **File Export** – Download transcripts in **Word, Excel, PDF** formats.
- 📧 **Email Sharing** – Share transcripts and files via email.
- 🔐 **Authentication System**  
  - Signup/Login with email & password  
  - Google authentication  
  - JWT-based session management  
  - Email verification  
- 📌 **Dashboard** – Manage all meetings, recordings, and notes from one place.
- 🌍 **Multi-language Support** – Translations for global users.
- 📱 **Responsive UI** – Built with TailwindCSS for mobile & desktop views.

---

## 🛠️ Tech Stack

### Frontend
- **React.js** – UI development
- **TailwindCSS** – Styling
- **React Router** – Navigation
- **Axios** – API calls
- **React Icons** – Icons library

### Backend
- **Node.js** – Server-side runtime
- **Express.js** – REST API framework
- **MySQL** – Database for storing transcripts, users, and history
- **Sequelize/Knex** – ORM/Query builder
- **Nodemailer** – Email service (SMTP)

### Other Tools
- **bcryptjs** – Password hashing
- **jsonwebtoken (JWT)** – Authentication
- **Multer / FTP Upload** – File storage
- **docx, xlsx, pdfkit/reportlab** – File export utilities

---

## 📂 Project Structure

/

│── backend/ # Express + MySQL API

│ ├── config/ # DB & email configs

│ ├── routes/ # API routes

│ ├── controllers/ # Business logic

│ ├── models/ # Database models

│ └── validations/ # Zod validation schemas

│

│── frontend/ # React + Tailwind client

│ ├── src/

│ │ ├── components/ # Reusable components

│ │ ├── pages/ # Pages (Login, Dashboard, etc.)

│ │ ├── hooks/ # Custom hooks

│ │ └── utils/ # Helper functions

│

│── README.md

│── package.json

│── .env.example


---


## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)  
- MySQL  

### 1. Clone Repository
```bash
git clone https://github.com/Keshab1113/.git
cd client
npm i
npm run dev
cd server
npm i
npm run dev
```
