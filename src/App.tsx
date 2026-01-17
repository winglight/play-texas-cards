import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { SinglePlayerPage } from './pages/SinglePlayerPage';
import { MultiplayerPage } from './pages/MultiplayerPage';
import { GithubLink } from './components/GithubLink';
import { AnalyticsTracker } from './components/AnalyticsTracker';
import { initGA } from './utils/analytics';

function App() {
  useEffect(() => {
    initGA();
  }, []);

  return (
    <Router>
      <AnalyticsTracker />
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
