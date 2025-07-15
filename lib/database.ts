import Database from 'better-sqlite3';
import path from 'path';

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
}

class DatabaseManager {
  private db: Database.Database;

  constructor() {
    const dbPath = path.join(process.cwd(), 'todos.db');
    this.db = new Database(dbPath);
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  getAllTodos(): Todo[] {
    const stmt = this.db.prepare('SELECT * FROM todos ORDER BY created_at DESC');
    return stmt.all() as Todo[];
  }

  getTodoById(id: number): Todo | undefined {
    const stmt = this.db.prepare('SELECT * FROM todos WHERE id = ?');
    return stmt.get(id) as Todo | undefined;
  }

  createTodo(title: string): Todo {
    const stmt = this.db.prepare('INSERT INTO todos (title) VALUES (?)');
    const result = stmt.run(title);
    return this.getTodoById(result.lastInsertRowid as number)!;
  }

  updateTodo(id: number, updates: Partial<Pick<Todo, 'title' | 'completed'>>): Todo | null {
    const fields = [];
    const values = [];
    
    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    
    if (updates.completed !== undefined) {
      fields.push('completed = ?');
      values.push(updates.completed ? 1 : 0);
    }
    
    if (fields.length === 0) {
      return this.getTodoById(id) || null;
    }
    
    values.push(id);
    const stmt = this.db.prepare(`UPDATE todos SET ${fields.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);
    
    return result.changes > 0 ? this.getTodoById(id) || null : null;
  }

  deleteTodo(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM todos WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  close() {
    this.db.close();
  }
}

let dbInstance: DatabaseManager | null = null;

export function getDatabase(): DatabaseManager {
  if (!dbInstance) {
    dbInstance = new DatabaseManager();
  }
  return dbInstance;
}