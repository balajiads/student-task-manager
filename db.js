const path = require('path');
const fs = require('fs');

let db = null;
let useSqlite = false;
const jsonFilePath = path.join(__dirname, 'tasks_store.json');

// Helper for JSON file fallback
function loadJsonStore() {
  if (!fs.existsSync(jsonFilePath)) {
    const initial = { tasks: [], settings: {} };
    fs.writeFileSync(jsonFilePath, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const content = fs.readFileSync(jsonFilePath, 'utf8');
    return JSON.parse(content || '{"tasks":[],"settings":{}}');
  } catch (e) {
    return { tasks: [], settings: {} };
  }
}

function saveJsonStore(data) {
  fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2), 'utf8');
}

// Try initializing SQLite, fallback to JSON file store if sqlite3 driver isn't built
try {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(__dirname, 'tasks.db');
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.warn('SQLite connection error, using JSON file fallback:', err.message);
      useSqlite = false;
    } else {
      console.log('Connected to SQLite database at', dbPath);
      useSqlite = true;
      initSqliteTables();
    }
  });
} catch (err) {
  console.warn('sqlite3 package not available, using JSON file database fallback');
  useSqlite = false;
}

function initSqliteTables() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        subject TEXT,
        category TEXT,
        priority TEXT,
        due TEXT,
        est INTEGER,
        tags TEXT,
        subtasks TEXT,
        done INTEGER DEFAULT 0,
        pinned INTEGER DEFAULT 0,
        createdAt TEXT,
        updatedAt TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);
  });
}

// Database API Methods (Promisified)
const dbApi = {
  getAllTasks: () => {
    return new Promise((resolve, reject) => {
      if (useSqlite && db) {
        db.all('SELECT * FROM tasks ORDER BY pinned DESC, createdAt DESC', [], (err, rows) => {
          if (err) return reject(err);
          const tasks = rows.map(r => ({
            ...r,
            done: Boolean(r.done),
            pinned: Boolean(r.pinned),
            tags: typeof r.tags === 'string' ? JSON.parse(r.tags || '[]') : (r.tags || []),
            subtasks: typeof r.subtasks === 'string' ? JSON.parse(r.subtasks || '[]') : (r.subtasks || [])
          }));
          resolve(tasks);
        });
      } else {
        const store = loadJsonStore();
        resolve(store.tasks || []);
      }
    });
  },

  getTaskById: (id) => {
    return new Promise((resolve, reject) => {
      if (useSqlite && db) {
        db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
          if (err) return reject(err);
          if (!row) return resolve(null);
          resolve({
            ...row,
            done: Boolean(row.done),
            pinned: Boolean(row.pinned),
            tags: typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : (row.tags || []),
            subtasks: typeof row.subtasks === 'string' ? JSON.parse(row.subtasks || '[]') : (row.subtasks || [])
          });
        });
      } else {
        const store = loadJsonStore();
        const task = store.tasks.find(t => t.id === id) || null;
        resolve(task);
      }
    });
  },

  saveTask: (task) => {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const taskData = {
        id: task.id || Date.now().toString(36) + Math.random().toString(36).slice(2),
        title: task.title || 'Untitled Task',
        subject: task.subject || 'General',
        category: task.category || 'Assignment',
        priority: task.priority || 'Medium',
        due: task.due || '',
        est: Number(task.est) || 30,
        tags: JSON.stringify(task.tags || []),
        subtasks: JSON.stringify(task.subtasks || []),
        done: task.done ? 1 : 0,
        pinned: task.pinned ? 1 : 0,
        createdAt: task.createdAt || now,
        updatedAt: now
      };

      if (useSqlite && db) {
        const query = `
          INSERT INTO tasks (id, title, subject, category, priority, due, est, tags, subtasks, done, pinned, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title=excluded.title,
            subject=excluded.subject,
            category=excluded.category,
            priority=excluded.priority,
            due=excluded.due,
            est=excluded.est,
            tags=excluded.tags,
            subtasks=excluded.subtasks,
            done=excluded.done,
            pinned=excluded.pinned,
            updatedAt=excluded.updatedAt
        `;
        db.run(query, [
          taskData.id, taskData.title, taskData.subject, taskData.category,
          taskData.priority, taskData.due, taskData.est, taskData.tags,
          taskData.subtasks, taskData.done, taskData.pinned,
          taskData.createdAt, taskData.updatedAt
        ], function (err) {
          if (err) return reject(err);
          dbApi.getTaskById(taskData.id).then(resolve).catch(reject);
        });
      } else {
        const store = loadJsonStore();
        const idx = store.tasks.findIndex(t => t.id === taskData.id);
        const parsed = {
          ...taskData,
          done: Boolean(taskData.done),
          pinned: Boolean(taskData.pinned),
          tags: JSON.parse(taskData.tags),
          subtasks: JSON.parse(taskData.subtasks)
        };
        if (idx >= 0) {
          store.tasks[idx] = parsed;
        } else {
          store.tasks.unshift(parsed);
        }
        saveJsonStore(store);
        resolve(parsed);
      }
    });
  },

  deleteTask: (id) => {
    return new Promise((resolve, reject) => {
      if (useSqlite && db) {
        db.run('DELETE FROM tasks WHERE id = ?', [id], function (err) {
          if (err) return reject(err);
          resolve({ success: true, deletedId: id });
        });
      } else {
        const store = loadJsonStore();
        store.tasks = store.tasks.filter(t => t.id !== id);
        saveJsonStore(store);
        resolve({ success: true, deletedId: id });
      }
    });
  },

  bulkSyncTasks: (taskList) => {
    return new Promise(async (resolve, reject) => {
      try {
        const savedList = [];
        for (const t of taskList) {
          const saved = await dbApi.saveTask(t);
          savedList.push(saved);
        }
        resolve(savedList);
      } catch (e) {
        reject(e);
      }
    });
  }
};

module.exports = dbApi;
