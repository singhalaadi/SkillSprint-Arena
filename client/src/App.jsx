import React, { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const SERVER = "http://localhost:4000";

export default function App() {
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("not-connected");
  const [message, setMessage] = useState("");
  const [match, setMatch] = useState(null); // { matchId, opponent, questions }
  const [currentQ, setCurrentQ] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);

  const qStartRef = useRef(null);

  useEffect(() => {
    const s = io(SERVER);
    setSocket(s);

    s.on("connect", () => console.log("connected", s.id));
    s.on("lobby-status", d => setMessage(`Waiting players in queue: ${d.waitingCount}`));
    s.on("start-match", payload => {
      setMatch(payload);
      setCurrentQ(0);
      setMyScore(0);
      setOpponentScore(0);
      setStatus("in-match");
      setMessage(`Matched vs ${payload.opponent.username}. Starting...`);
      qStartRef.current = Date.now();
    });
    s.on("score-update", ({ playerId, score }) => {
      if (s.id === playerId) setMyScore(score);
      else setOpponentScore(score);
    });
    s.on("match-end", result => {
      setStatus("match-finished");
      setMessage(`Match ended. Winner: ${result.winner}`);
      // fetch leaderboard
      s.emit("get-leaderboard");
    });
    s.on("leaderboard-data", list => setLeaderboard(list));
    s.on("opponent-left", () => {
      setStatus("opponent-left");
      setMessage("Opponent disconnected.");
    });

    return () => s.disconnect();
  }, []);

  function joinLobby() {
    if (!username) {
      setMessage("Pick a username first.");
      return;
    }
    socket.emit("join-lobby", { username });
    setStatus("waiting");
    setMessage("Joined quick-match queue...");
  }

  function submitAnswer(selectedIndex) {
    if (!match) return;
    const qIndex = currentQ;
    const now = Date.now();
    const timeTakenMs = now - (qStartRef.current || now);
    // optimistic UI
    setCurrentQ(qIndex + 1);
    qStartRef.current = Date.now();
    // send to server
    socket.emit("submit-answer", {
      matchId: match.matchId,
      qIndex,
      selectedIndex,
      timeTakenMs
    });
    // if locally last question, show waiting
    if (qIndex + 1 >= match.questions.length) {
      setMessage("Waiting for opponent to finish...");
    }
  }

  function requestLeaderboard() {
    socket.emit("get-leaderboard");
  }

  // UI pieces
  if (!socket) return <div className="container">Connecting to server...</div>;

  return (
    <div className="container">
      <h1>SkillSprint Arena — Demo</h1>
      <p className="muted">Micro-learning + real-time duel (demo)</p>

      {status === "not-connected" && (
        <div className="card">
          <input
            placeholder="Your username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <div style={{display:"flex", gap:10, marginTop:10}}>
            <button onClick={joinLobby}>Quick Match</button>
            <button onClick={requestLeaderboard}>Refresh Leaderboard</button>
          </div>
          <p className="muted">Tip: open another browser to simulate opponent</p>
        </div>
      )}

      {status === "waiting" && (
        <div className="card">
          <p>{message}</p>
          <button onClick={() => { setStatus("not-connected"); setMessage(""); }}>Cancel</button>
        </div>
      )}

      {status === "in-match" && match && (
        <div className="card">
          <h3>Match vs {match.opponent.username}</h3>
          <div className="score-row">
            <div>You: {myScore}</div>
            <div>Opponent: {opponentScore}</div>
          </div>

          {currentQ < match.questions.length ? (
            <Question
              q={match.questions[currentQ]}
              qIndex={currentQ}
              total={match.questions.length}
              onAnswer={submitAnswer}
            />
          ) : (
            <p>{message}</p>
          )}
        </div>
      )}

      {status === "match-finished" && (
        <div className="card">
          <h3>Match results</h3>
          <p>{message}</p>
          <button onClick={() => { setStatus("not-connected"); setMatch(null); }}>Back to lobby</button>
          <button onClick={requestLeaderboard}>Show Leaderboard</button>
        </div>
      )}

      {status === "opponent-left" && (
        <div className="card">
          <p>Opponent left. Match canceled.</p>
          <button onClick={() => { setStatus("not-connected"); setMatch(null); }}>Back</button>
        </div>
      )}

      <div className="card leaderboard">
        <h3>Leaderboard</h3>
        <button onClick={requestLeaderboard}>Refresh</button>
        <ol>
          {leaderboard.length === 0 && <li>No data yet</li>}
          {leaderboard.map(item => (
            <li key={item.username}>{item.username} — {item.xp} XP</li>
          ))}
        </ol>
      </div>

      <div className="footer muted">Demo server: {SERVER}</div>
    </div>
  );
}

function Question({ q, qIndex, total, onAnswer }) {
  const [timeLeft, setTimeLeft] = useState(10);
  const timerRef = useRef(null);
  const startTsRef = useRef(Date.now());

  useEffect(() => {
    setTimeLeft(10);
    startTsRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTsRef.current) / 1000);
      setTimeLeft(10 - elapsed);
    }, 200);

    return () => clearInterval(timerRef.current);
  }, [q]);

  const handleSubmit = useCallback((choice) => {
    clearInterval(timerRef.current);
    onAnswer(choice);
  }, [onAnswer]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit(-1);
    }
  }, [timeLeft, handleSubmit]);

  return (
    <div>
      <h4>Q{qIndex + 1}/{total}</h4>
      <p style={{fontWeight:600}}>{q.q}</p>
      <div style={{display:"grid", gap:8}}>
        {q.options.map((opt, idx) => (
          <button
            key={idx}
            className="opt"
            onClick={() => { handleSubmit(idx); }}
          >
            {opt}
          </button>
        ))}
      </div>
      <div style={{marginTop:10}}>Time left: {Math.max(0, timeLeft)}s</div>
    </div>
  );
}
