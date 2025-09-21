import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Caminho do banco
const dbPath = path.join("data", "database.sqlite");

// Conexão
const db = new sqlite3.Database(dbPath);

// Criar tabela se não existir
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT,
      lastName TEXT,
      email TEXT UNIQUE,
      phone TEXT,
      country TEXT,
      kycStatus TEXT DEFAULT 'pending'
    )
  `, (err) => {
    if (err) {
      console.error("Error creating users table:", err);
      return;
    }
    console.log("Users table created or already exists");
    
    // Inserir 1 usuário inicial se não existir
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
      if (err) {
        console.error("Error checking user count:", err);
        return;
      }
      
      if (row.count === 0) {
        db.run(
          `INSERT INTO users (firstName, lastName, email, phone, country, kycStatus) 
          VALUES (?, ?, ?, ?, ?, ?)`,
          ["John", "Doe", "john@email.com", "+258841234567", "mozambique", "pending"],
          function(err) {
            if (err) {
              console.error("Error inserting default user:", err);
            } else {
              console.log("Default user created successfully");
            }
          }
        );
      } else {
        console.log("Users already exist in the database");
      }
    });
  });
});

// 📌 Buscar usuário (sempre o primeiro para exemplo)
app.get("/api/users", (req, res) => {
  db.get("SELECT * FROM users LIMIT 1", (err, row) => {
    if (err) {
      console.error("Error fetching user:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json([row || {}]);
  });
});

// 📌 Atualizar usuário
app.post("/api/users/update", (req, res) => {
  const { firstName, lastName, email, phone, country } = req.body;

  db.run(
    `UPDATE users 
     SET firstName=?, lastName=?, email=?, phone=?, country=? 
     WHERE id=1`,
    [firstName, lastName, email, phone, country],
    function (err) {
      if (err) {
        console.error("Error updating user:", err);
        return res.status(500).json({ error: err.message });
      }

      db.get("SELECT * FROM users WHERE id=1", (err, row) => {
        if (err) {
          console.error("Error fetching updated user:", err);
          return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, user: row });
      });
    }
  );
});

// Inicia servidor
const PORT = process.env.USER_SERVER_PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ User Management API running on http://localhost:${PORT}`);
});
