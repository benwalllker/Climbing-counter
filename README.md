# ClimbCycle React Application

## Overview
ClimbCycle is a React-based web application designed for tracking climbing scores and managing player information during climbing games. The application allows users to add players, select game modes, and view scores in real-time.

## Project Structure
The project is organized into the following directories and files:

```
climbcycle-react
├── public
│   ├── index.html          # Main HTML template for the React application
│   └── manifest.json       # Metadata for Progressive Web App (PWA) support
├── src
│   ├── components          # Contains all React components
│   │   ├── App.jsx         # Main application component
│   │   ├── PlayerSetup.jsx  # Component for player setup
│   │   ├── Gameplay.jsx     # Component for gameplay interface
│   │   ├── PlayerList.jsx   # Component to display player list
│   │   ├── Scoreboard.jsx    # Component for score summary
│   │   └── FinalLeaderboard.jsx # Component for final leaderboard
│   ├── hooks               # Custom hooks
│   │   └── useTimer.js     # Hook for managing countdown timer
│   ├── utils               # Utility functions
│   │   └── scoring.js      # Scoring logic functions
│   ├── serviceWorker.js     # Service worker for offline capabilities
│   ├── index.js            # Entry point of the React application
│   └── styles              # CSS styles
│       └── app.css         # Main stylesheet
├── package.json            # npm configuration file
├── .gitignore              # Git ignore file
└── README.md               # Project documentation
```

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm (Node Package Manager)

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd climbcycle-react
   ```
3. Install the dependencies:
   ```
   npm install
   ```

### Running the Application
To start the development server, run:
```
npm start
```
This will launch the application in your default web browser at `http://localhost:3000`.

### Building for Production
To create a production build of the application, run:
```
npm run build
```
This will generate an optimized build in the `build` directory.

## Usage
- Add players using the Player Setup interface.
- Select the game mode and start the game.
- Track scores and grades in real-time during gameplay.
- View the final leaderboard and score summary after the game ends.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any suggestions or improvements.

## License
This project is licensed under the MIT License.