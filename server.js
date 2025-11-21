
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import sqlite3 from 'sqlite3';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);

// CONFIGURAÇÃO DE SEGURANÇA E CORS
// Aceita apenas origens confiáveis (localhost para dev). 
// Em produção, adicione o domínio real aqui.
const allowedOrigins = [
  "http://localhost:5173", 
  "http://127.0.0.1:5173",
  "http://localhost:3000"
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Bloqueado pelo CORS: ${origin}`);
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  methods: ["GET", "POST"],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Inicializa Banco de Dados
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) console.error('Erro ao abrir banco SQLite:', err.message);
  else console.log('SQLite conectado.');
});

// Cria tabelas se não existirem
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    data TEXT
  )`);
});

// Configuração Socket.io com Segurança
const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ['websocket', 'polling'] // Prioriza websocket
});

io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);

  // PERFORMANCE: Limita a carga inicial aos últimos 100 registros para não travar o cliente
  db.all("SELECT * FROM requests ORDER BY rowid DESC LIMIT 100", [], (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }
    // Parseia o JSON armazenado antes de enviar
    const parsedData = rows.map(row => {
        try { return JSON.parse(row.data); } catch(e) { return null; }
    }).filter(item => item !== null);
    
    socket.emit('initial_data', parsedData);
  });

  // Recebe nova requisição
  socket.on('new_request', (ticket) => {
    // SEGURANÇA: Validação básica de entrada
    if (!ticket || !ticket.id || !ticket.title || ticket.title.length > 200) {
        return; // Ignora dados inválidos ou muito grandes
    }

    const stmt = db.prepare("INSERT OR REPLACE INTO requests (id, data) VALUES (?, ?)");
    stmt.run(ticket.id, JSON.stringify(ticket), function(err) {
      if (!err) {
        // Broadcast para todos, inclusive o remetente para confirmar recebimento
        io.emit('request_added', ticket); 
      } else {
          console.error("Erro ao salvar:", err);
      }
    });
    stmt.finalize();
  });

  // Atualização de Status
  socket.on('update_status', ({ id, status, updatedAt }) => {
    // Busca o registro atual para atualizar apenas os campos necessários
    db.get("SELECT data FROM requests WHERE id = ?", [id], (err, row) => {
        if (err || !row) return;
        
        try {
            const ticket = JSON.parse(row.data);
            ticket.status = status;
            ticket.updatedAt = updatedAt;
            
            const stmt = db.prepare("INSERT OR REPLACE INTO requests (id, data) VALUES (?, ?)");
            stmt.run(id, JSON.stringify(ticket), (err) => {
                if(!err) io.emit('status_updated', { id, status, updatedAt });
            });
            stmt.finalize();
        } catch (e) {
            console.error("Erro ao processar update JSON", e);
        }
    });
  });

  socket.on('disconnect', () => {
    // console.log('Cliente desconectado'); // Log removido para limpar console
  });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Servidor rodando seguro em http://localhost:${PORT}`);
});
