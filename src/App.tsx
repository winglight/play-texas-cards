import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { SinglePlayerPage } from './pages/SinglePlayerPage';
import { MultiplayerPage } from './pages/MultiplayerPage';
import { GithubLink } from './components/GithubLink';

function App() {
  return (
    <Router>
      <GithubLink />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/single-player" element={<SinglePlayerPage />} />
        <Route path="/multiplayer" element={<MultiplayerPage />} />
      </Routes>
    </Router>
  );
}

export default App;
