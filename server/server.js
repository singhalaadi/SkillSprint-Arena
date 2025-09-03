const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = 4000;

// Tiny question bank (micro-course demo)
const QUESTIONS = [
  {
    id: 1,
    q: "What is HTML primarily used for?",
    options: ["Styling", "Structure of web pages", "Server-side logic", "Database"],
    correct: 1
  },
  {
    id: 2,
    q: "Which language is primarily used for styling web pages?",
    options: ["JavaScript", "C++", "CSS", "Python"],
    correct: 2
  },
  {
    id: 3,
    q: "What does JSON stand for?",
    options: ["Java Simple Object Notation","JavaScript Object Notation","Just Simple Object Name","Joined Standard Object Notation"],
    correct: 1
  },
  {
    id: 4,
    q: "Which one is not a JavaScript framework?",
    options: ["React","Angular","Laravel","Vue"],
    correct: 2
  },
  {
    id: 5,
    q: "What is REST used for?",
    options: ["Styling", "APIs/HTTP architecture", "Database storage", "Testing frameworks"],
    correct: 1
  },
  {
    id: 6,
    q: "Which HTTP method is idempotent?",
    options: ["POST","PATCH","GET","CONNECT"],
    correct: 2
  }
];

let waiting = []; // sockets waiting
const matches = {}; // matchId -> data
const leaderboard = {}; // username -> xp

// Utility: pick N random questions
function pickQuestions(n = 5) {
  const shuffled = QUESTIONS.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

io.on("connection", socket => {
  console.log("socket connected:", socket.id);

  socket.on("join-lobby", ({ username }) => {
    socket.data.username = username || `Anon-${socket.id.slice(0,4)}`;
    console.log(`${socket.data.username} joined lobby`);

    // quick-match logic
    waiting.push(socket);
    socket.emit("lobby-status", { waitingCount: waiting.length });

    // If two or more waiting, pair the first two
    if (waiting.length >= 2) {
      const a = waiting.shift();
      const b = waiting.shift();
      const matchId = `m_${Date.now()}_${Math.floor(Math.random()*1000)}`;
      const questions = pickQuestions(5);

      matches[matchId] = {
        players: {
          [a.id]: { socket: a, username: a.data.username, score: 0, answers: 0 },
          [b.id]: { socket: b, username: b.data.username, score: 0, answers: 0 }
        },
        questions,
        startedAt: Date.now()
      };

      // Join socket.io room
      a.join(matchId); b.join(matchId);

      // Notify both players
      const payload = {
        matchId,
        opponent: { id: b.id, username: b.data.username },
        questions: questions.map(q => ({ id: q.id, q: q.q, options: q.options }))
      };
      a.emit("start-match", { ...payload, opponent: { id: b.id, username: b.data.username } });

      const payloadB = {
        matchId,
        opponent: { id: a.id, username: a.data.username },
        questions: questions.map(q => ({ id: q.id, q: q.q, options: q.options }))
      };
      b.emit("start-match", { ...payloadB, opponent: { id: a.id, username: a.data.username } });
      console.log(`Match ${matchId} started between ${a.data.username} and ${b.data.username}`);
    }
  });

  socket.on("submit-answer", ({ matchId, qIndex, selectedIndex, timeTakenMs }) => {
    const match = matches[matchId];
    if (!match) return;
    const player = match.players[socket.id];
    if (!player) return;

    const q = match.questions[qIndex];
    if (!q) return;

    const correct = q.correct === selectedIndex;
    // scoring: 1000 base for correct, minus time penalty (faster -> more)
    let gain = 0;
    if (correct) {
      gain = 1000 - Math.min(800, Math.floor(timeTakenMs / 10)); // simple
      player.score += gain;
    }
    player.answers += 1;

    // notify room of this player's new score (for live UI)
    io.to(matchId).emit("score-update", {
      playerId: socket.id,
      username: player.username,
      score: player.score,
      qIndex
    });

    // If both players answered all questions => finish
    const players = Object.values(match.players);
    const allDone = players.every(p => p.answers >= match.questions.length);
    if (allDone) {
      // compute winner, xp
      const [p1, p2] = players;
      let result = {
        players: [
          { id: p1.socket.id, username: p1.username, score: p1.score },
          { id: p2.socket.id, username: p2.username, score: p2.score }
        ]
      };
      // award XP: winner +100, loser +30, tie both +60
      if (p1.score > p2.score) {
        leaderboard[p1.username] = (leaderboard[p1.username] || 0) + 100;
        leaderboard[p2.username] = (leaderboard[p2.username] || 0) + 30;
        result.winner = p1.username;
      } else if (p2.score > p1.score) {
        leaderboard[p2.username] = (leaderboard[p2.username] || 0) + 100;
        leaderboard[p1.username] = (leaderboard[p1.username] || 0) + 30;
        result.winner = p2.username;
      } else {
        leaderboard[p1.username] = (leaderboard[p1.username] || 0) + 60;
        leaderboard[p2.username] = (leaderboard[p2.username] || 0) + 60;
        result.winner = "tie";
      }

      // send match-end to room
      io.to(matchId).emit("match-end", result);

      // cleanup
      delete matches[matchId];
    }
  });

  socket.on("get-leaderboard", () => {
    // return sorted top 10
    const list = Object.entries(leaderboard)
      .map(([username, xp]) => ({ username, xp }))
      .sort((a,b)=>b.xp - a.xp)
      .slice(0, 10);
    socket.emit("leaderboard-data", list);
  });

  socket.on("disconnect", () => {
    console.log("disconnect", socket.id);
    waiting = waiting.filter(s => s.id !== socket.id);
    // if socket was in a match, notify opponent
    for (const [matchId, match] of Object.entries(matches)) {
      if (match.players[socket.id]) {
        // find opponent
        const opponent = Object.values(match.players).find(p => p.socket.id !== socket.id);
        if (opponent) {
          opponent.socket.emit("opponent-left");
        }
        delete matches[matchId];
      }
    }
  });
});

app.get("/", (req, res) => res.send("SkillSprint Arena minimal server up"));

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
