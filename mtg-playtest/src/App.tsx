// import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";

// Zmieniono ścieżki importu, dodając rozszerzenie pliku, aby poprawić błąd kompilacji.
import Home from "./pages/Home.jsx";
import Playtest from "./pages/Playtest.jsx";
import DeckManager from "./pages/DeckManager.jsx";

function Nav() {
 const location = useLocation();

 // Nie pokazuj nawigacji na stronie /playtest
 if (location.pathname === "/playtest") return null;

 // Sprawdzenie, czy jesteśmy na stronie Deck Manager
 const isDeckManager = location.pathname === "/decks";

 return (
  <nav style={{ marginBottom: "1rem" }}>
   <Link to="/" className="nav-button" style={{ marginRight: "1rem" }}>Home</Link>
   <Link to="/playtest" className="nav-button" style={{ marginRight: "1rem" }}>Playtest</Link>
   <Link to="/decks" className="nav-button" style={{ marginRight: "1rem" }}>Deck Manager</Link>
   
   {/* WARUNKOWE RENDEROWANIE: Link do Moxfield widoczny tylko w /decks */}
   {isDeckManager && (
    <a 
     href="https://moxfield.com/" 
     target="_blank" 
     rel="noopener noreferrer" 
     className="nav-button external-link"
     style={{ 
      backgroundColor: '#7C4DFF', // Fioletowy kolor dla Moxfield
      color: 'white',
      fontWeight: 'bold',
      textDecoration: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '0.375rem',
      transition: 'background-color 0.2s',
     }}
    >
     Moxfield 🔗
    </a>
   )}
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