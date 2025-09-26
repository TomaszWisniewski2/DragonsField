// import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";

import Home from "./pages/Home";
import Playtest from "./pages/Playtest";
import DeckManager from "./pages/DeckManager";

function Nav() {
  const location = useLocation();

  // Nie pokazuj nawigacji na stronie /playtest
  if (location.pathname === "/playtest") return null;

  return (
    <nav style={{ marginBottom: "1rem" }}>
      <Link to="/" className="nav-button" style={{ marginRight: "1rem" }}>Home</Link>
      <Link to="/playtest" className="nav-button" style={{ marginRight: "1rem" }}>Playtest</Link>
      <Link to="/decks" className="nav-button">Deck Manager</Link>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div style={{ padding: "1rem" }}>
        <Nav />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/playtest" element={<Playtest />} />
          <Route path="/decks" element={<DeckManager />} />
        </Routes>
      </div>
    </Router>
  );
}
