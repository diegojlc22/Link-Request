const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

// --- CONFIGURAÇÃO ---
const PORT = 3000;
const DB_FILE = './database.sqlite';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Permite conexões de qualquer origem (para dev)
    methods: ["GET", "POST"]
  }
});

// --- BANCO DE DADOS ---
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Erro ao conectar ao SQLite:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite.');
    initDb();
  }
});

// Inicializa tabelas se não existirem
// Armazenamos os objetos JSON inteiros na coluna 'data' para simplicidade e flexibilidade (NoSQL-like over SQL)
function initDb() {
  const tables = ['companies', 'units', 'users', 'requests', 'comments'];
  tables.forEach(table => {
    db.run(`CREATE TABLE IF NOT EXISTS ${table} (
      id TEXT PRIMARY KEY,
      data TEXT
    )`);
  });
}

// --- SOCKET.IO LOGIC ---

const TABLES = ['companies', 'units', 'users', 'requests', 'comments'];

io.on('connection', (socket) => {
  console.log('Novo cliente conectado:', socket.id);

  // 1. Enviar dados iniciais ao conectar
  socket.on('request_initial_data', () => {
    const payload = {};
    let completed = 0;

    TABLES.forEach(table => {
      db.all(`SELECT data FROM ${table}`, [], (err, rows) => {
        if (err) {
          console.error(`Erro ao ler ${table}:`, err);
          payload[table] = [];
        } else {
          payload[table] = rows.map(r => JSON.parse(r.data));
        }
        
        completed++;
        if (completed === TABLES.length) {
          socket.emit('initial_data', payload);
        }
      });
    });
  });

  // 2. Criar Item
  socket.on('create_item', ({ collection, item }) => {
    if (!TABLES.includes(collection)) return;
    
    const stmt = db.prepare(`INSERT INTO ${collection} (id, data) VALUES (?, ?)`);
    stmt.run(item.id, JSON.stringify(item), (err) => {
      if (err) {
        console.error(`Erro ao inserir em ${collection}:`, err);
      } else {
        // Broadcast para todos os clientes (incluindo o remetente para confirmação, ou filtrar no front)
        io.emit('item_created', { collection, item });
      }
    });
    stmt.finalize();
  });

  // 3. Atualizar Item
  socket.on('update_item', ({ collection, id, data }) => {
    if (!TABLES.includes(collection)) return;

    // Primeiro busca o dado atual para fazer o merge (patch update)
    db.get(`SELECT data FROM ${collection} WHERE id = ?`, [id], (err, row) => {
      if (err || !row) return;

      const currentItem = JSON.parse(row.data);
      const updatedItem = { ...currentItem, ...data };

      const stmt = db.prepare(`UPDATE ${collection} SET data = ? WHERE id = ?`);
      stmt.run(JSON.stringify(updatedItem), id, (err) => {
        if (!err) {
          io.emit('item_updated', { collection, id, item: updatedItem });
        }
      });
      stmt.finalize();
    });
  });

  // 4. Deletar Item
  socket.on('delete_item', ({ collection, id }) => {
    if (!TABLES.includes(collection)) return;

    const stmt = db.prepare(`DELETE FROM ${collection} WHERE id = ?`);
    stmt.run(id, (err) => {
      if (!err) {
        io.emit('item_deleted', { collection, id });
      }
    });
    stmt.finalize();
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor Link-Request rodando em http://localhost:${PORT}`);
});