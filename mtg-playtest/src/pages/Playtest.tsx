// Playtest.tsx

import { useState, useCallback, useEffect } from "react";
// Importujemy useSocket, SessionStats i SessionType z useSocket
import { useSocket,type SessionType, type Zone } from "../hooks/useSocket";
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
// NOWOŚĆ: Import modala resetowania sesji
import ResetSessionModalComponent from "../components/ResetSessionModalComponent";

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
    forceResetSession, // Zaimportowano poprawnie
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


  const player = session?.players.find((p) => p.id === playerId);
  const otherPlayers = session?.players.filter((p) => p.id !== playerId) || [];
  const viewedPlayer = session?.players.find(p => p.id === viewedPlayerId) || player;

  const viewedGraveyardPlayer = session?.players.find(p => p.id === viewedGraveyardPlayerId) || player;
  const viewedLibraryPlayer = session?.players.find(p => p.id === viewedLibraryPlayerId) || player;
  const viewedExilePlayer = session?.players.find(p => p.id === viewedExilePlayerId) || player;
  const viewedCommanderPlayer = session?.players.find(p => p.id === viewedCommanderPlayerId) || player;

  const [isStartGameModalOpen, setIsStartGameModalOpen] = useState(false);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  const [hoveredCard, setHoveredCard] = useState<CardType | null>(null);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);

  // NOWOŚĆ: Stan do zarządzania modalem resetowania sesji
  const [sessionToReset, setSessionToReset] = useState<{ 
    code: string; 
    name: string; 
    type: SessionType 
  } | null>(null);


  // === STAŁA LISTA SESJI ===
  const FIXED_SESSIONS: { code: string; name: string; type: SessionType }[] = [
    { code: "STND1", name: "Standard 1 (20 HP)", type: "standard" },
    { code: "STND2", name: "Standard 2 (20 HP)", type: "standard" },
    { code: "CMDR1", name: "Commander 1 (40 HP)", type: "commander" },
    { code: "CMDR2", name: "Commander 2 (40 HP)", type: "commander" },
  ];
  // =========================

  const getPlayerColorClass = useCallback((pId: string) => `color-player-${(session?.players.findIndex(p => p.id === pId) ?? 0) + 1}`, [session]);
  
  // === NOWA LOGIKA OTWIERANIA VIEWERS DLA DOWOLNEGO GRACZA ===

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

  // === Funkcje obsługujące modal resetowania sesji ===
  const handleOpenResetSessionModal = (session: { code: string; name: string; type: SessionType }) => {
    setSessionToReset(session);
  };

  const handleCloseResetSessionModal = () => {
    setSessionToReset(null);
  };

  // ZMIANA: Ta funkcja wywołuje teraz "forceResetSession"
  const handleConfirmResetSession = () => {
    if (sessionToReset) {
      // Wywołujemy "twardy reset" (wyrzucenie graczy)
      forceResetSession(sessionToReset.code);
      console.log(`[FORCE RESET] Wysłano żądanie twardego resetu dla sesji: ${sessionToReset.code}`);
      handleCloseResetSessionModal();
    }
  };
  // =========================================================

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

  // --- WRAPPER DO TWORZENIA TOKENÓW ---
  const handleCreateToken = useCallback((tokenData: TokenData) => {
    if (!player || !session) return;
    const newTokenId = crypto.randomUUID();
    const tokenPayload = {
      ...tokenData,
      instanceId: newTokenId, 
    };
    console.log("🧩 Tworzenie nowego tokena:", tokenPayload);
    createToken(session.code, player.id, tokenPayload);
    setIsTokenViewerOpen(false);
  }, [player, session, createToken]);



  // WRAPPER DO PRZENOSZENIA WSZYSTKICH KART
  const handleMoveAllCards = useCallback((from: Zone, to: Zone) => {
    if (player && session) {
    moveAllCards(session.code, player.id, from, to);
    }
  }, [player, session, moveAllCards]);


  // ZMIANA: Aktualizacja toggleLibraryViewer
  const toggleLibraryViewer = () => {
    setViewedLibraryPlayerId(isLibraryViewerOpen ? null : playerId!); 
    setViewedGraveyardPlayerId(null); 
    setViewedExilePlayerId(null);
    setViewedCommanderPlayerId(null); 
    setIsTokenViewerOpen(false);
    setIsSideboardViewerOpen(false);
  };

  // ZMIANA: Aktualizacja toggleGraveyardViewer
  const toggleGraveyardViewer = () => {
    setViewedGraveyardPlayerId(isGraveyardViewerOpen ? null : playerId!); 
    setViewedLibraryPlayerId(null);
    setViewedExilePlayerId(null);
    setViewedCommanderPlayerId(null); 
    setIsTokenViewerOpen(false);
    setIsSideboardViewerOpen(false);
  };

  // ZMIANA: Aktualizacja toggleExileViewer
  const toggleExileViewer = () => {
    setViewedExilePlayerId(isExileViewerOpen ? null : playerId!);
    setViewedGraveyardPlayerId(null); 
    setViewedLibraryPlayerId(null);
    setViewedCommanderPlayerId(null); 
    setIsTokenViewerOpen(false);
    setIsSideboardViewerOpen(false);
  };

  // NOWA FUNKCJA: toggleCommanderViewer
  const toggleCommanderViewer = () => {
    setViewedCommanderPlayerId(isCommanderViewerOpen ? null : playerId!);
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
  //-----------------------------------------------
  const handleOpenStartGameModal = () => {
    setIsStartGameModalOpen(true);
  };

  const handleCloseStartGameModal = () => {
    setIsStartGameModalOpen(false);
  };
  //----------------------------------------------
  const handleConfirmStartGame = () => {
    if (session) {
    startGame(session.code, session.sessionType);
    handleCloseStartGameModal();
    }
  };

  //-----------------------------------------------------------
  //-----------------------------------------------------------
  // FUNKCJE OBSŁUGUJĄCE MODAL RESETUJĄCY RĘKĘ (MULLIGAN/RESET)
  const handleOpenResetHandModal = () => {
    setIsResetHandModalOpen(true); 
  };

  const handleCloseResetHandModal = () => {
    setIsResetHandModalOpen(false);
  };
  //----------------------------------------------
  const handleConfirmResetHand = () => {
    if (player && session) {
    resetPlayer(session.code, player.id); 
    handleCloseResetHandModal();
    }
  };
  ////////////////////////////////////////////////////////
  //-----------------------------------------------------------
  // FUNKCJE OBSŁUGUJĄCE MODAL WYJŚCIA Z GRY (ExitGameModal)
  const handleOpenExitGameModal = () => {
    setIsExitGameModalOpen(true);
  };

  const handleCloseExitGameModal = () => {
    setIsExitGameModalOpen(false);
  };

  const handleConfirmExitGame = () => {
    if (player && session) {
      disconnectPlayer(session.code, player.id);
      console.log(`Gracz ${player.name} (${player.id}) opuszcza sesję ${session.code} i zostanie usunięty.`);
    }
    navigate('/');
    handleCloseExitGameModal();
  };
  ////////////////////////////////////////////////////////


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


  if (!connected || !session || !player) {
    return (
    <div className="login-container">

    {/* SEKCJA NAWIGACJI */}
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

    {/* ZMIENIONA LISTA STAŁYCH SESJI Z NOWYMI KOLORAMI I LICZNIKIEM GRACZY */}
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
    
    {/* ZMIANA: Grupa przycisków */}
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
      
      {/* NOWOŚĆ: Przycisk Resetuj */}
      <button
        onClick={() => handleOpenResetSessionModal(s)}
        title={`Zresetuj sesję ${s.code}`}
        style={{
          padding: '0.5rem 0.8rem',
          backgroundColor: '#dc3545', // Kolor "danger"
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
    {/* =================================================================== */}

    {!connected && (
    <p className="status-text disconnected">Łączenie z serwerem...</p>
    )}
    {connected && (
    <p className="status-text">Połączono z serwerem. Wybierz sesję, aby dołączyć.</p>
    )}

    {/* NOWOŚĆ: Renderowanie modala resetowania sesji */}
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

// ==== WIDOK POŁĄCZONEGO UŻYTKOWNIKA ====
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
handleGoHome={handleOpenExitGameModal}
openGraveyardViewerForPlayer={openGraveyardViewerForPlayer} 
openExileViewerForPlayer={openExileViewerForPlayer} 
openLibraryViewerForPlayer={openLibraryViewerForPlayer}
openCommanderViewerForPlayer={openCommanderViewerForPlayer} 
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
playerColorClass={viewedPlayerId ? getPlayerColorClass(viewedPlayerId) : getPlayerColorClass(playerId!)}
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
toggleTokenViewer={toggleTokenViewer}
toggleSideboardViewer={toggleSideboardViewer}
resetHand={handleOpenResetHandModal}

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
toggleLibraryViewer={toggleLibraryViewer}
toggleGraveyardViewer={toggleGraveyardViewer}
toggleExileViewer={toggleExileViewer}
handleMoveAllCards={handleMoveAllCards}
zoom={zoom}
sortHand={sortHand}
sessionCode={session.code}
viewedPlayer={viewedPlayer}
moveAllCardsToBottomOfLibrary={moveAllCardsToBottomOfLibrary}
discardRandomCard={discardRandomCard}
shuffle={handleShuffle}
draw={draw}
moveCardToBattlefieldFlipped={moveCardToBattlefieldFlipped}
isMoving={isMoving} 
/>

{isLibraryViewerOpen && viewedLibraryPlayer && (
<LibraryViewer 
player={viewedLibraryPlayer} 
toggleLibraryViewer={toggleLibraryViewer}
playerColorClass={getPlayerColorClass(viewedLibraryPlayer.id)} 
isOwned={viewedLibraryPlayer.id === playerId}
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
player={player}
toggleSideboardViewer={toggleSideboardViewer}
playerColorClass={playerId ? getPlayerColorClass(playerId) : ''}
moveCard={moveCard}
sessionCode={session.code}
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

{/* Renderowanie modala resetowania sesji */}
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