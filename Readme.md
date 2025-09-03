# 🏆 SkillSprint Arena

A real-time multiplayer quiz duel application that combines micro-learning with competitive gameplay. Challenge opponents in fast-paced knowledge battles and climb the leaderboard!

## 🚀 Features

- **Real-time Multiplayer Duels**: Face off against opponents in live quiz battles
- **Quick Match System**: Automatic matchmaking with waiting queue
- **Timed Questions**: 15-second timer per question for added pressure
- **Live Scoring**: Real-time score updates during matches
- **Leaderboard**: Track your progress and compete for the top spot
- **Responsive Design**: Works seamlessly across different devices
- **Socket.io Integration**: Low-latency real-time communication

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI library with hooks
- **Vite** - Fast build tool and dev server
- **Socket.io Client** - Real-time communication
- **CSS3** - Styling and responsive design

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web application framework
- **Socket.io** - Real-time bidirectional communication
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
SkillSprint-Arena/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.jsx        # Main application component
│   │   ├── main.jsx       # React entry point
│   │   └── index.css      # Global styles
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── server/                # Node.js backend
│   ├── server.js          # Express server with Socket.io
│   ├── package.json       # Backend dependencies
│   └── .gitignore         # Git ignore rules
└── README.md              # Project documentation
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/singhalaadi/SkillSprint-Arena.git
   cd SkillSprint-Arena
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

#### Option 1: Run both servers separately

1. **Start the backend server**
   ```bash
   cd server
   npm start
   ```
   Server will run on `http://localhost:4000`

2. **Start the frontend development server**
   ```bash
   cd client
   npm run dev
   ```
   Client will run on `http://localhost:5173`

#### Option 2: Run both servers concurrently

From the client directory:
```bash
cd client
npm run start
```

This will start both the React dev server and the Node.js backend simultaneously.

### Testing the Application

1. Open your browser and navigate to `http://localhost:5173`
2. Enter a username and click "Quick Match"
3. Open another browser tab/window (or incognito mode) to simulate a second player
4. Repeat step 2 with a different username
5. Both players will be matched and the quiz duel will begin!

## 🎮 How to Play

1. **Join Lobby**: Enter your username and click "Quick Match"
2. **Wait for Opponent**: The system will find another player for you
3. **Answer Questions**: You have 10 seconds per question
4. **Scoring System**: 
   - Correct answers earn points
   - Faster answers earn bonus points
   - Wrong answers earn no points
5. **Win Condition**: Player with the highest score wins
6. **Leaderboard**: Track your progress and compete with others

## 🔧 Configuration

### Server Configuration

The server runs on port 4000 by default. You can modify this in `server/server.js`:

```javascript
const PORT = 4000; // Change this to your preferred port
```

### Client Configuration

The client connects to the server at `http://localhost:4000`. You can modify this in `client/src/App.jsx`:

```javascript
const SERVER = "http://localhost:4000"; // Update server URL here
```

## 🎯 Game Features

### Question Bank
- Web development focused questions
- HTML, CSS, JavaScript, and general programming concepts
- Multiple choice format with 4 options each

### Scoring System
- Points awarded for correct answers
- Time bonus for faster responses
- Real-time score updates

### Match System
- Automatic player matchmaking
- Graceful handling of player disconnections
- Match state synchronization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🐛 Known Issues

- Players need to be online simultaneously for matchmaking
- No persistence of user data (scores reset on server restart)
- Limited question bank (expandable)

## 🚀 Future Enhancements

- [ ] User authentication and persistent profiles
- [ ] Expanded question categories
- [ ] Private room creation
- [ ] Tournament mode
- [ ] Mobile app version
- [ ] Question difficulty levels
- [ ] Achievement system

## 📞 Support

If you encounter any issues or have questions, please [open an issue](https://github.com/singhalaadi/SkillSprint-Arena/issues) on GitHub.

---

**Happy Learning and Dueling! 🎯**