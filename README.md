# 📚 StudyFlow – Student Task Manager & Study Companion

StudyFlow is a modern, feature-rich, glassmorphic web application designed for students to organize tasks, track assignment deadlines, manage focus sessions with a Pomodoro timer, and visualize study progress—backed by a **Node.js & Express REST API with SQLite database persistence**.

![StudyFlow Demo](https://img.shields.io/badge/Status-Complete-success?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Tech-Express%20%7C%20SQLite%20%7C%20Vanilla%20JS-7c6af7?style=for-the-badge)

---

## ✨ Key Features

- **⚡ Express REST API Backend**: Full CRUD endpoints (`/api/tasks`) with SQLite database (`tasks.db`) storage and JSON fallback.
- **🔄 Hybrid Sync**: Automatic synchronization between the backend API and browser `localStorage` (with seamless offline mode fallback).
- **🎨 Modern Glassmorphism UI**: Deep space dark mode and crisp light mode toggle.
- 🔊 **Web Audio Chimes**: Synthesized audio feedback for task completions and focus alerts.
- 📋 **Checklists & Subtasks**: Create subtask checklists with progress percentages.
- 📌 **Task Pinning & Quick Actions**: Pin tasks (`★`), duplicate, edit, mark done, and restore deleted items with Undo toasts.
- 🗂️ **Multi-View Modes**:
  - **Grid View**: Card grid with subject badges and priority bars.
  - **Kanban Board**: Workflow columns (`To Do`, `In Progress`, `Completed`).
  - **Pomodoro Focus Timer**: 25m focus / 5m short break / 15m long break timer linked to study tasks.
  - **Analytics Dashboard**: Graphical subject workload distribution and category metrics.
- 🔍 **Filtering & Search**: Multi-keyword search, dynamic subject filter, category & priority filters, and status tabs.
- 💾 **Export & Import**: Backup and restore task data as JSON files + automatic database persistence.

---

## 🚀 Quick Start (Running the Server)

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Express & SQLite Backend Server**:
   ```bash
   npm start
   ```

3. **Open the Web App**:
   Open your browser and navigate to:
   **[http://localhost:3000](http://localhost:3000)**

---

## 📡 REST API Endpoints

- `GET /api/health` - Server health check
- `GET /api/tasks` - Fetch all tasks
- `GET /api/tasks/:id` - Fetch task by ID
- `POST /api/tasks` - Create or update a task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
- `POST /api/tasks/bulk-sync` - Sync multiple tasks
