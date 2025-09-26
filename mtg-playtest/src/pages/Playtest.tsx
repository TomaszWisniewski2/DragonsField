import { useState, useCallback, useEffect } from "react";
import { useSocket } from "../hooks/useSocket";
import "./Playtest.css";
import Navbar from "./PlaytestComponents/Navbar";
import Battlefield from "./PlaytestComponents/Battlefield";
import Sidebar from "./PlaytestComponents/Sidebar";
import Bottombar from "./PlaytestComponents/Bottombar";
import LibraryViewer from "./PlaytestComponents/LibraryViewer";
import GraveyardViewer from "./PlaytestComponents/GraveyardViewer";
import ExileViewer from "./PlaytestComponents/ExileViewer";
import ManaPanel from "../components/ManaPanel";
import type { CardType, Player, SessionType } from "../components/types";
import StartGameModal from "../components/StartGameModal";
import CardPreview from "../components/CardPreview";
import { Link } from "react-router-dom"; // <= DODAJ TEN IMPORT

export default function Playtest() {
  const {
    connected,
    session,
    playerId,
    createSession,
    joinSession,
    startGame,
    draw,
    shuffle,
    resetPlayer,
    changeLife,
    moveCard,
    rotateCard,
    nextTurn,
    changeMana,
    changeCounters,
    incrementCardStats,
  } = useSocket(import.meta.env.VITE_SERVER_URL || "http://localhost:3001");

  const [sessionCode, setSessionCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [sessionType, setSessionType] = useState<SessionType>("standard"); // NOWY STAN
  const [zoom, setZoom] = useState(100);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [viewedPlayerId, setViewedPlayerId] = useState<string | null>(null);
  const [shuffleMessage, setShuffleMessage] = useState<string>('');
  const [isLibraryViewerOpen, setIsLibraryViewerOpen] = useState(false);
  const [isGraveyardViewerOpen, setIsGraveyardViewerOpen] = useState(false);
  const [isExileViewerOpen, setIsExileViewerOpen] = useState(false);
  const [isManaPanelVisible, setIsManaPanelVisible] = useState(false);
  const player = session?.players.find((p) => p.id === playerId);
  const otherPlayers = session?.players.filter((p) => p.id !== playerId) || [];
  const viewedPlayer = session?.players.find(p => p.id === viewedPlayerId) || player;
  const [isStartGameModalOpen, setIsStartGameModalOpen] = useState(false);
  const [selectedCards, setSelectedCards] = useState<CardType[]>([]);

  const [hoveredCard, setHoveredCard] = useState<CardType | null>(null);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  
  const getPlayerColorClass = useCallback((pId: string) => `color-player-${(session?.players.findIndex(p => p.id === pId) ?? 0) + 1}`, [session]);

  const handleCreateSession = () => {
    const savedDeck = localStorage.getItem("currentDeck");
    const deck: CardType[] = savedDeck ? JSON.parse(savedDeck) : [];
    if (!sessionCode || !playerName) {
      alert("Kod sesji i nazwa gracza nie mogą być puste.");
      return;
    }
    if (sessionType === "commander" && deck.length === 0) {
      alert("W trybie Commander talia musi zawierać kartę dowódcy.");
      return;
    }
    if (deck.length === 0) {
      alert("Talia jest pusta! Zbuduj talię w Deck Managerze.");
      return;
    }
    createSession(sessionCode, playerName, deck, sessionType);
  };

  const handleJoinSession = () => {
    const savedDeck = localStorage.getItem("currentDeck");
    const deck: CardType[] = savedDeck ? JSON.parse(savedDeck) : [];
    if (!sessionCode || !playerName) {
      alert("Kod sesji i nazwa gracza nie mogą być puste.");
      return;
    }
    if (sessionType === "commander" && deck.length === 0) {
      alert("W trybie Commander talia musi zawierać kartę dowódcy.");
      return;
    }
    if (deck.length === 0) {
      alert("Talia jest pusta! Zbuduj talię w Deck Managerze.");
      return;
    }
    joinSession(sessionCode, playerName, deck, sessionType);
  };
  
  const handleShuffle = () => {
    if (player && session) {
      shuffle(session.code, player.id);
      setShuffleMessage("Biblioteka została potasowana!");
      setTimeout(() => {
        setShuffleMessage('');
      }, 500);
    }
  };

  const handleNextTurn = () => {
    if (player && session) {
      nextTurn(session.code, player.id);
    }
  };

  const handleManaChange = (color: keyof Player['manaPool'], amount: number) => {
    if (session && player) {
      const newManaValue = Math.max(0, player.manaPool[color] + amount);
      changeMana(session.code, player.id, color, newManaValue);
    }
  };

  const toggleLibraryViewer = () => {
    setIsLibraryViewerOpen(!isLibraryViewerOpen);
    setIsGraveyardViewerOpen(false);
    setIsExileViewerOpen(false);
  };

  const toggleGraveyardViewer = () => {
    setIsGraveyardViewerOpen(!isGraveyardViewerOpen);
    setIsLibraryViewerOpen(false);
    setIsExileViewerOpen(false);
  };
  
  const toggleExileViewer = () => {
    setIsExileViewerOpen(!isExileViewerOpen);
    setIsGraveyardViewerOpen(false);
    setIsLibraryViewerOpen(false);
  };

  const toggleManaPanel = useCallback(() => {
    setIsManaPanelVisible(prev => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'm' || event.key === 'M') {
        toggleManaPanel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleManaPanel]);

  const handleOpenStartGameModal = () => {
    setIsStartGameModalOpen(true);
  };

  const handleCloseStartGameModal = () => {
    setIsStartGameModalOpen(false);
  };

  const handleConfirmStartGame = () => {
    if (session) {
      // Przekazujemy typ sesji podczas restartu/startu gry
      startGame(session.code, session.sessionType);
      handleCloseStartGameModal();
    }
  };

  const clearSelectedCards = useCallback(() => {
    setSelectedCards([]);
  }, []);

  const handleCardHover = useCallback((card: CardType | null) => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }

    if (card) {
      const timer = setTimeout(() => {
        setHoveredCard(card);
      }, 500);
      setHoverTimer(timer);
    } else {
      setHoveredCard(null);
    }
  }, [hoverTimer]);

  console.log('Connected:', connected, 'Session:', session, 'Player:', player);

  if (!connected || !session || !player) {
  return (
   <div className="login-container">

          {/* === NOWA SEKCJA NAWIGACJI DLA LOGIN-CONTAINER === */}
          <nav style={{ marginBottom: "1rem" }}>
              <Link to="/" className="nav-button" style={{ marginRight: "1rem" }}>Home</Link>
              <Link to="/playtest" className="nav-button" style={{ marginRight: "1rem" }}>Playtest</Link>
              <Link to="/decks" className="nav-button">Deck Manager</Link>
          </nav>
          {/* ================================================= */}
        <h1>MTG Playtest</h1>
        <p>Wprowadź kod sesji i swoje imię, aby rozpocząć.</p>
        <div className="input-group">
          <input
            type="text"
            placeholder="Kod sesji"
            value={sessionCode}
            onChange={(e) => setSessionCode(e.target.value)}
          />
          <input
            type="text"
            placeholder="Twoje imię"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
        </div>
        <div className="mode-select">
          <label>
            <input 
              type="radio" 
              value="standard" 
              checked={sessionType === "standard"}
              onChange={() => setSessionType("standard")}
            />
            Tryb Standard
          </label>
          <label>
            <input 
              type="radio" 
              value="commander" 
              checked={sessionType === "commander"}
              onChange={() => setSessionType("commander")}
            />
            Tryb Commander
          </label>
        </div>
        <div className="button-group">
          <button onClick={handleCreateSession}>Stwórz sesję</button>
          <button onClick={handleJoinSession}>Dołącz do sesji</button>
        </div>
        {!connected && (
          <p className="status-text disconnected">Łączenie z serwerem...</p>
        )}
        {connected && (
          <p className="status-text">Połączono z serwerem. Oczekuje na akcję.</p>
        )}
      </div>
    );
  }

  return (
    <div className="playtest-container">
      <Navbar
        player={player}
        session={session}
        changeLife={changeLife}
        setZoom={setZoom}
        setViewedPlayerId={setViewedPlayerId}
        getPlayerColorClass={getPlayerColorClass}
        zoom={zoom}
        otherPlayers={otherPlayers}
        viewedPlayerId={viewedPlayerId}
        changeCounters={changeCounters}
      />
       <Battlefield
        viewedPlayer={viewedPlayer}
        viewedPlayerId={viewedPlayerId}
        dragOffset={dragOffset}
        zoom={zoom}
        getPlayerColorClass={getPlayerColorClass}
        moveCard={moveCard}
        player={player}
        setDragOffset={setDragOffset}
        sessionCode={session.code}
        rotateCard={rotateCard}
        shuffleMessage={shuffleMessage}
        setSelectedCards={setSelectedCards}
        selectedCards={selectedCards}
        playerColorClass={viewedPlayerId ? getPlayerColorClass(viewedPlayerId) : ''}
        handleCardHover={handleCardHover}
        incrementCardStats={incrementCardStats} 
      />
      <Sidebar
        startGame={handleOpenStartGameModal}
        resetPlayer={resetPlayer}
        shuffle={handleShuffle}
        draw={draw}
        sessionCode={session.code}
        player={player}
        nextTurn={handleNextTurn}
        toggleLibraryViewer={toggleLibraryViewer}
        toggleGraveyardViewer={toggleGraveyardViewer}
        toggleExileViewer={toggleExileViewer}
      />
      
      {isStartGameModalOpen && (
        <StartGameModal
          onClose={handleCloseStartGameModal}
          onConfirm={handleConfirmStartGame}
        />
      )}

      {player && isManaPanelVisible && (
        <ManaPanel 
          manaPool={player.manaPool} 
          onManaChange={handleManaChange}
          isOwnedPlayer={player.id === playerId}
        />
      )}

      <Bottombar
        player={player}
        session={session}
        getPlayerColorClass={getPlayerColorClass}
        setDragOffset={setDragOffset}
        moveCard={moveCard}
        clearSelectedCards={clearSelectedCards}
        handleCardHover={handleCardHover}
      />

        {isLibraryViewerOpen && (
        <LibraryViewer 
          player={player} 
          toggleLibraryViewer={toggleLibraryViewer}
          playerColorClass={playerId ? getPlayerColorClass(playerId) : ''} 
        />
      )}
      {isGraveyardViewerOpen && (
          <GraveyardViewer
              player={player}
              toggleGraveyardViewer={toggleGraveyardViewer}
              playerColorClass={playerId ? getPlayerColorClass(playerId) : ''}
          />
      )}
      {isExileViewerOpen && (
          <ExileViewer
              player={player}
              toggleExileViewer={toggleExileViewer}
              playerColorClass={playerId ? getPlayerColorClass(playerId) : ''}
          />
      )}

      {hoveredCard && (
        <CardPreview card={hoveredCard} />
      )}
    </div>
  );
}