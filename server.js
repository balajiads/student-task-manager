const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// API Routes

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'StudyFlow API Server is running', timestamp: new Date().toISOString() });
});

// GET all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await db.getAllTasks();
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET task by ID
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const task = await db.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create or update task
app.post('/api/tasks', async (req, res) => {
  try {
    if (!req.body || !req.body.title) {
      return res.status(400).json({ success: false, error: 'Task title is required' });
    }
    const savedTask = await db.saveTask(req.body);
    res.status(201).json({ success: true, data: savedTask });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update task by ID
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const taskData = { ...req.body, id: req.params.id };
    const updatedTask = await db.saveTask(taskData);
    res.json({ success: true, data: updatedTask });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE task by ID
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const result = await db.deleteTask(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST bulk sync tasks from localStorage
app.post('/api/tasks/bulk-sync', async (req, res) => {
  try {
    const taskList = Array.isArray(req.body) ? req.body : (req.body.tasks || []);
    const syncedTasks = await db.bulkSyncTasks(taskList);
    res.json({ success: true, count: syncedTasks.length, data: syncedTasks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 StudyFlow Server running on http://localhost:${PORT}`);
  console.log(`📡 API Endpoints available at http://localhost:${PORT}/api/tasks`);
  console.log(`=================================================`);
});
