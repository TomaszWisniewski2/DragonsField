// Playtest.tsx

import { useState, useCallback, useEffect, useRef } from "react";
import { useSocket,type SessionType, type Zone, } from "../hooks/useSocket"; // 💡 Import Spectator
import "./Playtest.css";
import Navbar from "./PlaytestComponents/Navbar";
import Battlefield from "./PlaytestComponents/Battlefield";
import Sidebar from "./PlaytestComponents/Sidebar";
import Bottombar from "./PlaytestComponents/Bottombar";
import LibraryViewer from "./PlaytestComponents/LibraryViewer";
import GraveyardViewer from "./PlaytestComponents/GraveyardViewer";
import ExileViewer from "./PlaytestComponents/ExileViewer";
import CommanderViewer from "./PlaytestComponents/CommanderViewer"; 
import ManaPanel from "../components/ManaPanel";
import type { CardType, Player, TokenData } from "../components/types"; 
import StartGameModal from "../components/StartGameModal";
import CardPreview from "../components/CardPreview";
import { Link } from "react-router-dom"; 
import { useNavigate } from "react-router-dom"; 
import ResetHandModalComponent from "../components/ResetHandModal";
import ExitGameModalComponent from "../components/ExitGameModal"
import TokenViewer from "./PlaytestComponents/TokenViewer";
import SideboardViewer from "./PlaytestComponents/SideboardViewer";
import ResetSessionModalComponent from "../components/ResetSessionModalComponent";

const log = (...args: Array<unknown>) => {
  if (process.env.NODE_ENV === "development") {
    console.log(...args);
  }
};

export default function Playtest() {
  const {
    connected,
    session,
    playerId,
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
    incrementCardCounters, 
    incrementCardStats,
    decreaseCardCounters,
    setCardStats, 
    allSessionStats, 
    moveAllCards,
    rotateCard180,
    flipCard,
    sortHand,
    moveAllCardsToBottomOfLibrary,
    discardRandomCard,
    allAvailableTokens,
    createToken,
    cloneCard,
    moveCardToBattlefieldFlipped,
    isMoving,
    disconnectPlayer,
    forceResetSession, 
    isReconnecting,
    joinAsSpectator, // ✅ POBIERAMY NOWĄ FUNKCJĘ
  } = useSocket(import.meta.env.VITE_SERVER_URL || "http://localhost:3001");

  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState(() => {
    if (typeof window !== 'undefined') {
    const savedName = localStorage.getItem("playerName");
    return savedName || "";
    }
    return "";
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
    localStorage.setItem("playerName", playerName);
    }
  }, [playerName]);

  const [zoom, setZoom] = useState(100);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [viewedPlayerId, setViewedPlayerId] = useState<string | null>(null);
  const [shuffleMessage, setShuffleMessage] = useState<string>('');
  const [viewedLibraryPlayerId, setViewedLibraryPlayerId] = useState<string | null>(null);
  const isLibraryViewerOpen = viewedLibraryPlayerId !== null;
  const [viewedExilePlayerId, setViewedExilePlayerId] = useState<string | null>(null);
  const isExileViewerOpen = viewedExilePlayerId !== null;
  const [isTokenViewerOpen, setIsTokenViewerOpen] = useState(false);
  const [isManaPanelVisible, setIsManaPanelVisible] = useState(false);
  const [isResetHandModalOpen, setIsResetHandModalOpen] = useState(false);
  const [isExitGameModalOpen, setIsExitGameModalOpen] = useState(false);
  const [isSideboardViewerOpen, setIsSideboardViewerOpen] = useState(false);
  const [viewedGraveyardPlayerId, setViewedGraveyardPlayerId] = useState<string | null>(null);
  const isGraveyardViewerOpen = viewedGraveyardPlayerId !== null;
  const [viewedCommanderPlayerId, setViewedCommanderPlayerId] = useState<string | null>(null);
  const isCommanderViewerOpen = viewedCommanderPlayerId !== null;
  const [isStartGameModalOpen, setIsStartGameModalOpen] = useState(false);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [hoveredCard, setHoveredCard] = useState<CardType | null>(null);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const [sessionToReset, setSessionToReset] = useState<{ 
    code: string; 
    name: string; 
    type: SessionType 
  } | null>(null);
  
  const reJoinSent = useRef(false);

  // === ✅ ZMIANA WIDZA: Definicje Gracza i Widza ===
  
  // 'localPlayer' to TY, jeśli jesteś GRACZEM. Będzie 'undefined', jeśli jesteś widzem.
  const localPlayer = session?.players.find((p) => p.id === playerId);
  
  // 'isSpectator' jest prawdą, jeśli Twoje ID znajduje się na liście widzów.
  const isSpectator = !!session?.spectators.some(s => s.id === playerId);

  const otherPlayers = session?.players.filter((p) => p.id !== playerId) || [];
  
  // 'viewedPlayer' to gracz, którego aktualnie oglądasz.
  // Domyślnie: oglądasz siebie (jeśli jesteś graczem) LUB pierwszego gracza z listy (jeśli jesteś widzem).
  const viewedPlayer = 
    session?.players.find(p => p.id === viewedPlayerId) || // Gracz wybrany do podglądu
    localPlayer ||                                         // Ty sam (jeśli jesteś graczem)
    (session?.players.length ? session.players[0] : undefined); // Pierwszy gracz (jeśli jesteś widzem i ktoś jest w sesji)

  // Używamy 'localPlayer' lub 'viewedPlayer' jako fallback
  const viewedGraveyardPlayer = session?.players.find(p => p.id === viewedGraveyardPlayerId) || localPlayer || viewedPlayer;
  const viewedLibraryPlayer = session?.players.find(p => p.id === viewedLibraryPlayerId) || localPlayer || viewedPlayer;
  const viewedExilePlayer = session?.players.find(p => p.id === viewedExilePlayerId) || localPlayer || viewedPlayer;
  const viewedCommanderPlayer = session?.players.find(p => p.id === viewedCommanderPlayerId) || localPlayer || viewedPlayer;
  // ===================================

  const FIXED_SESSIONS: { code: string; name: string; type: SessionType }[] = [
    { code: "STND1", name: "Standard 1 (20 HP)", type: "standard" },
    { code: "STND2", name: "Standard 2 (20 HP)", type: "standard" },
    { code: "CMDR1", name: "Commander 1 (40 HP)", type: "commander" },
    { code: "CMDR2", name: "Commander 2 (40 HP)", type: "commander" },
  ];
  
  const getPlayerColorClass = useCallback((pId: string) => `color-player-${(session?.players.findIndex(p => p.id === pId) ?? 0) + 1}`, [session]);

  // EFEKT PONOWNEGO DOŁĄCZENIA
  useEffect(() => {
    // Używamy 'localPlayer' zamiast 'player'
    if (connected && !isReconnecting && session && localPlayer && !reJoinSent.current) {
      log("🔌 Wykryto ponowne połączenie. Wysyłanie 'joinSession' w celu resynchronizacji...");
      
      const savedDeck = localStorage.getItem("currentDeck");
      const deck: CardType[] = savedDeck ? JSON.parse(savedDeck) : [];
      const savedSideboard = localStorage.getItem("currentSideboard");
      const savedCommanders = localStorage.getItem("commander"); 
      const sideboard: CardType[] = savedSideboard ? JSON.parse(savedSideboard) : [];
      const commanderCards: CardType[] = savedCommanders ? JSON.parse(savedCommanders) : []; 

      joinSession(
        session.code, 
        localPlayer.name, // Używamy 'localPlayer'
        deck, 
        session.sessionType, 
        sideboard, 
        commanderCards
      );
      reJoinSent.current = true;
    } else if (!connected) {
      reJoinSent.current = false;
    }
  }, [connected, isReconnecting, session, localPlayer, joinSession]); // Zależność od 'localPlayer'


  // ... (handlery open...ViewerForPlayer - bez zmian)
  const openLibraryViewerForPlayer = (pId: string) => {
    setViewedGraveyardPlayerId(null);
    setViewedExilePlayerId(null);
    setViewedCommanderPlayerId(null); 
    setIsTokenViewerOpen(false);
    setIsSideboardViewerOpen(false);
    setViewedLibraryPlayerId(pId);
  };
  const openGraveyardViewerForPlayer = (pId: string) => {
    setViewedLibraryPlayerId(null);
    setViewedExilePlayerId(null);
    setViewedCommanderPlayerId(null); 
    setIsTokenViewerOpen(false);
    setIsSideboardViewerOpen(false);
    setViewedGraveyardPlayerId(pId);
  };
  const openExileViewerForPlayer = (pId: string) => {
    setViewedLibraryPlayerId(null);
    setViewedGraveyardPlayerId(null);
    setViewedCommanderPlayerId(null); 
    setIsTokenViewerOpen(false);
    setIsSideboardViewerOpen(false);
    setViewedExilePlayerId(pId);
  };
  const openCommanderViewerForPlayer = (pId: string) => {
    setViewedLibraryPlayerId(null);
    setViewedGraveyardPlayerId(null);
    setViewedExilePlayerId(null);
    setIsTokenViewerOpen(false);
    setIsSideboardViewerOpen(false);
    setViewedCommanderPlayerId(pId); 
  };
  // =============================================================


  const handleJoinSession = (code: string, sessionType: SessionType) => {
    const savedDeck = localStorage.getItem("currentDeck");
    const deck: CardType[] = savedDeck ? JSON.parse(savedDeck) : [];
    const savedSideboard = localStorage.getItem("currentSideboard");
    const savedCommanders = localStorage.getItem("commander"); 
    const sideboard: CardType[] = savedSideboard ? JSON.parse(savedSideboard) : [];
    const commanderCards: CardType[] = savedCommanders ? JSON.parse(savedCommanders) : []; 

    if (!playerName) {
      alert("Nazwa gracza nie może być pusta.");
      return;
    }
    if (deck.length === 0) {
      alert("Talia jest pusta! Zbuduj talię w Deck Managerze.");
      return;
    }
    if (sessionType === "commander" && commanderCards.length === 0) {
      alert("W trybie Commander musisz wybrać co najmniej jedną kartę dowódcy.");
      return;
    }
    joinSession(code, playerName, deck, sessionType, sideboard, commanderCards); 
  };
  
  // ✅ NOWY HANDLER: Dołączanie jako widz
  const handleJoinAsSpectator = (code: string) => {
    if (!playerName) {
      alert("Nazwa widza nie może być pusta.");
      return;
    }
    joinAsSpectator(code, playerName);
  };

  const handleOpenResetSessionModal = (session: { code: string; name: string; type: SessionType }) => {
    setSessionToReset(session);
  };
  const handleCloseResetSessionModal = () => {
    setSessionToReset(null);
  };
  const handleConfirmResetSession = () => {
    if (sessionToReset) {
      forceResetSession(sessionToReset.code);
      console.log(`[FORCE RESET] Wysłano żądanie twardego resetu dla sesji: ${sessionToReset.code}`);
      handleCloseResetSessionModal();
    }
  };

  const handleShuffle = () => {
    if (localPlayer && session) {
    shuffle(session.code, localPlayer.id);
    setShuffleMessage("Biblioteka została potasowana!");
    setTimeout(() => {
    setShuffleMessage('');
    }, 500);
    }
  };

  const handleNextTurn = () => {
    if (localPlayer && session) {
    nextTurn(session.code, localPlayer.id);
    }
  };

  const handleManaChange = (color: keyof Player['manaPool'], amount: number) => {
    if (session && localPlayer) {
    const newManaValue = Math.max(0, localPlayer.manaPool[color] + amount);
    changeMana(session.code, localPlayer.id, color, newManaValue);
    }
  };

  const handleCreateToken = useCallback((tokenData: TokenData) => {
    if (!localPlayer || !session) return;
    const newTokenId = crypto.randomUUID();
    const tokenPayload = { ...tokenData, instanceId: newTokenId };
    console.log("🧩 Tworzenie nowego tokena:", tokenPayload);
    createToken(session.code, localPlayer.id, tokenPayload);
    setIsTokenViewerOpen(false);
  }, [localPlayer, session, createToken]);

  const handleMoveAllCards = useCallback((from: Zone, to: Zone) => {
    if (localPlayer && session) {
    moveAllCards(session.code, localPlayer.id, from, to);
    }
  }, [localPlayer, session, moveAllCards]);

  const toggleLibraryViewer = () => {
    // ✅ ZMIANA WIDZA: Otwiera viewer dla 'viewedPlayer', jeśli jesteś widzem
    const targetId = localPlayer ? localPlayer.id : (viewedPlayer ? viewedPlayer.id : null);
    if (!targetId) return;
    setViewedLibraryPlayerId(isLibraryViewerOpen ? null : targetId); 
    setViewedGraveyardPlayerId(null); 
    setViewedExilePlayerId(null);
    setViewedCommanderPlayerId(null); 
    setIsTokenViewerOpen(false);
    setIsSideboardViewerOpen(false);
  };
  const toggleGraveyardViewer = () => {
    const targetId = localPlayer ? localPlayer.id : (viewedPlayer ? viewedPlayer.id : null);
    if (!targetId) return;
    setViewedGraveyardPlayerId(isGraveyardViewerOpen ? null : targetId); 
    setViewedLibraryPlayerId(null);
    setViewedExilePlayerId(null);
    setViewedCommanderPlayerId(null); 
    setIsTokenViewerOpen(false);
    setIsSideboardViewerOpen(false);
  };
  const toggleExileViewer = () => {
    const targetId = localPlayer ? localPlayer.id : (viewedPlayer ? viewedPlayer.id : null);
    if (!targetId) return;
    setViewedExilePlayerId(isExileViewerOpen ? null : targetId);
    setViewedGraveyardPlayerId(null); 
    setViewedLibraryPlayerId(null);
    setViewedCommanderPlayerId(null); 
    setIsTokenViewerOpen(false);
    setIsSideboardViewerOpen(false);
  };
  const toggleCommanderViewer = () => {
    const targetId = localPlayer ? localPlayer.id : (viewedPlayer ? viewedPlayer.id : null);
    if (!targetId) return;
    setViewedCommanderPlayerId(isCommanderViewerOpen ? null : targetId);
    setViewedGraveyardPlayerId(null); 
    setViewedLibraryPlayerId(null);
    setViewedExilePlayerId(null);
    setIsTokenViewerOpen(false);
    setIsSideboardViewerOpen(false);
  }
  const toggleTokenViewer = () => {
    setIsTokenViewerOpen(!isTokenViewerOpen);
    setViewedGraveyardPlayerId(null); 
    setViewedLibraryPlayerId(null);
    setViewedExilePlayerId(null);
    setViewedCommanderPlayerId(null); 
    setIsSideboardViewerOpen(false);
  };
  const toggleSideboardViewer = () => {
    setIsSideboardViewerOpen(!isSideboardViewerOpen);
    setViewedGraveyardPlayerId(null); 
    setViewedLibraryPlayerId(null);
    setViewedExilePlayerId(null);
    setViewedCommanderPlayerId(null); 
    setIsTokenViewerOpen(false);
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
    startGame(session.code, session.sessionType);
    handleCloseStartGameModal();
    }
  };

  const handleOpenResetHandModal = () => {
    setIsResetHandModalOpen(true); 
  };
  const handleCloseResetHandModal = () => {
    setIsResetHandModalOpen(false);
  };
  const handleConfirmResetHand = () => {
    if (localPlayer && session) {
    resetPlayer(session.code, localPlayer.id); 
    handleCloseResetHandModal();
    }
  };

  const handleOpenExitGameModal = () => {
    setIsExitGameModalOpen(true);
  };
  const handleCloseExitGameModal = () => {
    setIsExitGameModalOpen(false);
  };
  const handleConfirmExitGame = () => {
    if (localPlayer && session) {
      disconnectPlayer(session.code, localPlayer.id);
      console.log(`Gracz ${localPlayer.name} (${localPlayer.id}) opuszcza sesję ${session.code} i zostanie usunięty.`);
    } else if (isSpectator && session) {
      log(`Widz ${playerName} opuszcza sesję ${session.code}.`);
      disconnectPlayer(session.code, playerId!); 
    }
    navigate('/');
    handleCloseExitGameModal();
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

  // ✅ ZMIANA WIDZA: Główny warunek renderowania
  if (!session || (!localPlayer && !isSpectator)) {
    // === EKRAN LOGOWANIA ===
    return (
    <div className="login-container">

    <nav style={{ marginBottom: "1rem" }}>
    <Link to="/" className="nav-button" style={{ marginRight: "1rem" }}>Home</Link>
    <Link to="/playtest" className="nav-button" style={{ marginRight: "1rem" }}>Playtest</Link>
    <Link to="/decks" className="nav-button">Deck Manager</Link>
    </nav>

    <h1>MTG Playtest</h1>
    <p>Wprowadź swoje imię i dołącz do jednej ze stałych sesji.</p>

    <div className="input-group">
    <input
    type="text"
    placeholder="Twoje imię"
    value={playerName}
    onChange={(e) => setPlayerName(e.target.value)}
    />
    </div>

    <div className="fixed-sessions-list" style={{ marginTop: "1rem", width: '100%', maxWidth: '400px' }}>
    <h2>Dostępne sesje:</h2>
    {FIXED_SESSIONS.map((s) => {
    const color = s.type === 'commander' ? 'darkorange' : 'darkgreen'; 
    const playersCount = allSessionStats[s.code] || 0; 

    return (
    <div 
    key={s.code} 
    className="session-item" 
    style={{ 
    margin: '0.5rem 0', 
    padding: '0.7rem', 
    border: `2px solid ${color}`, 
    borderRadius: '4px', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: color, 
    color: 'white', 
    textShadow: '1px 1px 2px black'
    }}
    >
    <div>
      <strong>{s.code}</strong>
      <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{s.name}</div>
      <div style={{ fontSize: '0.8rem', marginTop: '5px' }}>
        Gracze: {playersCount}/4
      </div>
    </div>
    
    <div className="session-button-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <button 
        onClick={() => handleJoinSession(s.code, s.type)}
        style={{ 
          padding: '0.5rem 1rem',
          backgroundColor: 'white',
          color: color,
          fontWeight: 'bold',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        Dołącz
      </button>

      {/* ✅ ZMIANA WIDZA: Przycisk "Obserwuj" */}
      <button
        onClick={() => handleJoinAsSpectator(s.code)}
        title={`Obserwuj sesję ${s.code}`}
        style={{
          padding: '0.5rem 0.8rem',
          backgroundColor: '#6c757d', // Szary
          color: 'white',
          fontWeight: 'bold',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        Obserwuj
      </button>
      
      <button
        onClick={() => handleOpenResetSessionModal(s)}
        title={`Zresetuj sesję ${s.code}`}
        style={{
          padding: '0.5rem 0.8rem',
          backgroundColor: '#dc3545',
          color: 'white',
          fontWeight: 'bold',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        Resetuj
      </button>
    </div>
    
    </div>
    );
    })}
    </div>

    {!connected && isReconnecting && (
      <p className="status-text reconnecting">Utracono połączenie. Próba ponownego połączenia...</p>
    )}
    {!connected && !isReconnecting && (
      <p className="status-text disconnected">Łączenie z serwerem...</p>
    )}
    {connected && (
      <p className="status-text">Połączono z serwerem. Wybierz sesję, aby dołączyć.</p>
    )}

    {sessionToReset && (
      <ResetSessionModalComponent
        sessionName={sessionToReset.name}
        onClose={handleCloseResetSessionModal}
        onConfirm={handleConfirmResetSession}
      />
    )}

    </div>
    );
  }

// ==== WIDOK POŁĄCZONEGO UŻYTKOWNIKA (Gracz LUB Widz) ====
return (
  // ✅ ZMIANA WIDZA: Dodajemy klasę CSS, gdy jesteśmy widzem
  <div className={`playtest-container ${isSpectator ? 'spectator-view' : ''}`}>

  {isReconnecting && (
    <div className="reconnecting-overlay">
      <div className="reconnecting-box">
        <p>Utracono połączenie...</p>
        <p>Próba ponownego połączenia.</p>
      </div>
    </div>
  )}

  <Navbar
    player={localPlayer} // ✅ ZMIANA WIDZA: Przekazujemy 'localPlayer'
    session={session}
    changeLife={changeLife}
    setZoom={setZoom}
    setViewedPlayerId={setViewedPlayerId}
    getPlayerColorClass={getPlayerColorClass}
    zoom={zoom}
    otherPlayers={otherPlayers}
    viewedPlayerId={viewedPlayerId}
    changeCounters={changeCounters}
    handleGoHome={handleOpenExitGameModal}
    openGraveyardViewerForPlayer={openGraveyardViewerForPlayer} 
    openExileViewerForPlayer={openExileViewerForPlayer} 
    openLibraryViewerForPlayer={openLibraryViewerForPlayer}
    openCommanderViewerForPlayer={openCommanderViewerForPlayer} 
  />
  <Battlefield
    viewedPlayer={viewedPlayer} // Oglądamy aktywnego (lub wybranego) gracza
    player={localPlayer} // ✅ ZMIANA WIDZA: Przekazujemy 'localPlayer' (dla uprawnień)
    viewedPlayerId={viewedPlayerId}
    dragOffset={dragOffset}
    zoom={zoom}
    getPlayerColorClass={getPlayerColorClass}
    moveCard={moveCard}
    setDragOffset={setDragOffset}
    sessionCode={session.code}
    rotateCard={rotateCard}
    shuffleMessage={shuffleMessage}
    setSelectedCards={setSelectedCards}
    selectedCards={selectedCards}
    playerColorClass={viewedPlayerId ? getPlayerColorClass(viewedPlayerId) : (playerId ? getPlayerColorClass(playerId) : '')}
    handleCardHover={handleCardHover}
    incrementCardStats={incrementCardStats} 
    decreaseCardCounters= {decreaseCardCounters}
    incrementCardCounters={incrementCardCounters}
    setCardStats={setCardStats} 
    rotateCard180={rotateCard180}
    flipCard={flipCard} 
    onCreateToken={handleCreateToken} 
    cloneCard={cloneCard}
    isMoving={isMoving} 
  />
  
  {/* ✅ ZMIANA WIDZA: Sidebar renderowany TYLKO dla graczy */}
  {!isSpectator && localPlayer && (
    <>
      <Sidebar
        startGame={handleOpenStartGameModal}
        resetPlayer={resetPlayer}
        shuffle={handleShuffle}
        draw={draw}
        sessionCode={session.code}
        player={localPlayer}
        nextTurn={handleNextTurn}
        toggleLibraryViewer={toggleLibraryViewer}
        toggleGraveyardViewer={toggleGraveyardViewer}
        toggleExileViewer={toggleExileViewer}
        toggleTokenViewer={toggleTokenViewer}
        toggleSideboardViewer={toggleSideboardViewer}
        resetHand={handleOpenResetHandModal}
      />

      {isManaPanelVisible && (
        <ManaPanel 
          manaPool={localPlayer.manaPool} 
          onManaChange={handleManaChange}
          isOwnedPlayer={localPlayer.id === playerId}
        />
      )}
    </>
  )}

  {/* ✅ ZMIANA WIDZA: Bottombar renderowany ZARÓWNO dla graczy, jak i widzów */}
  {viewedPlayer && ( // Renderuj Bottombar tylko jeśli jest kogo oglądać
    <Bottombar
      player={localPlayer} // 'player' to TY (może być undefined dla widza)
      session={session}
      getPlayerColorClass={getPlayerColorClass}
      setDragOffset={setDragOffset}
      moveCard={moveCard}
      clearSelectedCards={clearSelectedCards}
      handleCardHover={handleCardHover}
      toggleLibraryViewer={toggleLibraryViewer}
      toggleGraveyardViewer={toggleGraveyardViewer}
      toggleExileViewer={toggleExileViewer}
      handleMoveAllCards={handleMoveAllCards}
      zoom={zoom}
      sortHand={sortHand}
      sessionCode={session.code}
      viewedPlayer={viewedPlayer} // 'viewedPlayer' to ten, kogo oglądasz
      moveAllCardsToBottomOfLibrary={moveAllCardsToBottomOfLibrary}
      discardRandomCard={discardRandomCard}
      shuffle={shuffle}
      draw={draw}
      moveCardToBattlefieldFlipped={moveCardToBattlefieldFlipped}
      isMoving={isMoving} 
    />
  )}

  {/* Viewery i Modale (dostępne dla wszystkich) */}
  {isLibraryViewerOpen && viewedLibraryPlayer && (
    <LibraryViewer 
      player={viewedLibraryPlayer} 
      toggleLibraryViewer={toggleLibraryViewer}
      playerColorClass={getPlayerColorClass(viewedLibraryPlayer.id)} 
      isOwned={viewedLibraryPlayer.id === playerId} // 'isOwned' działa dla widza (zawsze false) i gracza
    />
  )}
  {isGraveyardViewerOpen && viewedGraveyardPlayer && ( 
    <GraveyardViewer
      player={viewedGraveyardPlayer} 
      toggleGraveyardViewer={toggleGraveyardViewer}
      playerColorClass={getPlayerColorClass(viewedGraveyardPlayer.id)}
      isOwned={viewedGraveyardPlayer.id === playerId} 
    />
  )}
  {isExileViewerOpen && viewedExilePlayer && (
    <ExileViewer
      player={viewedExilePlayer}
      toggleExileViewer={toggleExileViewer}
      playerColorClass={getPlayerColorClass(viewedExilePlayer.id)}
      isOwned={viewedExilePlayer.id === playerId}
    />
  )}
  {isCommanderViewerOpen && viewedCommanderPlayer && (
    <CommanderViewer
    player={viewedCommanderPlayer}
    toggleCommanderViewer={toggleCommanderViewer}
    playerColorClass={getPlayerColorClass(viewedCommanderPlayer.id)}
    />
  )}
  
  {/* TokenViewer i SideboardViewer (tylko dla gracza) */}
  {!isSpectator && localPlayer && (
    <>
      {isTokenViewerOpen && allAvailableTokens && ( 
        <TokenViewer
          allAvailableTokens={allAvailableTokens} 
          toggleTokenViewer={toggleTokenViewer}
          playerColorClass={playerId ? getPlayerColorClass(playerId) : ''}
          onCreateToken={handleCreateToken}
        />
      )}

      {isSideboardViewerOpen && (
        <SideboardViewer
          player={localPlayer}
          toggleSideboardViewer={toggleSideboardViewer}
          playerColorClass={playerId ? getPlayerColorClass(playerId) : ''}
          moveCard={moveCard}
          sessionCode={session.code}
          //isMoving={isMoving} // ✅ POPRAWKA: Przekazanie flagi
        />
      )}
    </>
  )}

  {/* Modale globalne */}
  {isStartGameModalOpen && (
    <StartGameModal
      onClose={handleCloseStartGameModal}
      onConfirm={handleConfirmStartGame}
    />
  )}
  {isResetHandModalOpen && (
    <ResetHandModalComponent 
      onClose={handleCloseResetHandModal}
      onConfirm={handleConfirmResetHand}
    />
  )}
  {isExitGameModalOpen && (
    <ExitGameModalComponent 
      onClose={handleCloseExitGameModal}
      onConfirm={handleConfirmExitGame}
    />
  )}
  {sessionToReset && (
    <ResetSessionModalComponent
      sessionName={sessionToReset.name}
      onClose={handleCloseResetSessionModal}
      onConfirm={handleConfirmResetSession}
    />
  )}

  {hoveredCard && (
    <CardPreview card={hoveredCard} />
  )}
</div>
);
}