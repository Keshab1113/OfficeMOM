# OfficeMoM (Smart Minutes of Meeting)

OfficeMoM is a web application that helps teams automatically **record meetings, generate transcripts, manage history, and share minutes of meeting (MoM)** efficiently.  
It combines **frontend (React + TailwindCSS)** and **backend (Node.js + Express + MySQL)** technologies, providing a seamless experience for both meeting admins and participants.

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
