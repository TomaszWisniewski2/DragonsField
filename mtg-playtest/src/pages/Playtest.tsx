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
import ManaPanel from "../components/ManaPanel";
import type { CardType, Player } from "../components/types"; // Typy CardType i Player pochodzą stąd
import StartGameModal from "../components/StartGameModal";
import CardPreview from "../components/CardPreview";
import { Link } from "react-router-dom"; 
import { useNavigate } from "react-router-dom"; 
import ResetHandModalComponent from "../components/ResetHandModal";
import ExitGameModalComponent from "../components/ExitGameModal"

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
 setCardStats, // <--- DODANA NOWA FUNKCJA
 allSessionStats, 
 moveAllCards,
 rotateCard180,
 flipCard,
 sortHand,
 moveAllCardsToBottomOfLibrary,
 discardRandomCard,
} = useSocket(import.meta.env.VITE_SERVER_URL || "http://localhost:3001");

const navigate = useNavigate();
const [playerName, setPlayerName] = useState("");
const [zoom, setZoom] = useState(100);
const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
const [viewedPlayerId, setViewedPlayerId] = useState<string | null>(null);
const [shuffleMessage, setShuffleMessage] = useState<string>('');
const [isLibraryViewerOpen, setIsLibraryViewerOpen] = useState(false);
const [isGraveyardViewerOpen, setIsGraveyardViewerOpen] = useState(false);
const [isExileViewerOpen, setIsExileViewerOpen] = useState(false);
const [isManaPanelVisible, setIsManaPanelVisible] = useState(false);
const [isResetHandModalOpen, setIsResetHandModalOpen] = useState(false);
const [isExitGameModalOpen, setIsExitGameModalOpen] = useState(false);
// Usunięto lokalny stan sessionStats

const player = session?.players.find((p) => p.id === playerId);
const otherPlayers = session?.players.filter((p) => p.id !== playerId) || [];
const viewedPlayer = session?.players.find(p => p.id === viewedPlayerId) || player;
const [isStartGameModalOpen, setIsStartGameModalOpen] = useState(false);
const [selectedCards, setSelectedCards] = useState<CardType[]>([]);

const [hoveredCard, setHoveredCard] = useState<CardType | null>(null);
const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);

// === STAŁA LISTA SESJI ===
const FIXED_SESSIONS: { code: string; name: string; type: SessionType }[] = [
 { code: "STND1", name: "Standard 1 (20 HP)", type: "standard" },
 { code: "STND2", name: "Standard 2 (20 HP)", type: "standard" },
 { code: "CMDR1", name: "Commander 1 (40 HP)", type: "commander" },
 { code: "CMDR2", name: "Commander 2 (40 HP)", type: "commander" },
];
// =========================

const getPlayerColorClass = useCallback((pId: string) => `color-player-${(session?.players.findIndex(p => p.id === pId) ?? 0) + 1}`, [session]);

const handleJoinSession = (code: string, sessionType: SessionType) => {
 const savedDeck = localStorage.getItem("currentDeck");
 const deck: CardType[] = savedDeck ? JSON.parse(savedDeck) : [];
 
 if (!playerName) {
 alert("Nazwa gracza nie może być pusta.");
 return;
 }
 
 if (deck.length === 0) {
 alert("Talia jest pusta! Zbuduj talię w Deck Managerze.");
 return;
 }
 
 // Zmieniona logika, aby była kompatybilna z nowym useSocket, gdzie typ jest wymagany
 if (sessionType === "commander" && deck.length === 0) {
 alert("W trybie Commander talia musi zawierać kartę dowódcy.");
 return;
 }
 
 joinSession(code, playerName, deck, sessionType);
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

// NOWA FUNKCJA WRAPPER DO PRZENOSZENIA WSZYSTKICH KART
const handleMoveAllCards = useCallback((from: Zone, to: Zone) => {
if (player && session) {
moveAllCards(session.code, player.id, from, to);
}
}, [player, session, moveAllCards]);


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
setIsResetHandModalOpen(true); // Otwiera modal
};

const handleCloseResetHandModal = () => {
setIsResetHandModalOpen(false);
};
//----------------------------------------------
const handleConfirmResetHand = () => {
if (player && session) {
// 1. Wykonaj pełny reset gracza (jak resetPlayer)
// ZWYKLE resetPlayer resetuje life, counters i przenosi karty do library
resetPlayer(session.code, player.id); // <--- TUTAJ WYWOŁUJEMY ZAINSTALOWANĄ LOGIKĘ RESETU

// 2. Dodatkowo dobierz nową rękę (7 kart), jeśli jest to pożądany efekt, 
  // który różni się od domyślnego zachowania resetPlayer (jeśli on dobiera karty, usuń draw)
//draw(session.code, player.id, 7);  // Dobierz 7 kart

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
// Tutaj możesz dodać logikę typu 'disconnect' lub 'leaveSession', jeśli istnieje.
// Na razie po prostu przenosimy do Home:
navigate('/'); // <-- Nawigacja do strony głównej po potwierdzeniu
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

// Usunięto symulacyjny useEffect

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
  // Ustawienie koloru w zależności od typu
  const color = s.type === 'commander' ? 'darkorange' : 'darkgreen'; 
  // Używamy allSessionStats pobranego z useSocket
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
    {/* WYŚWIETLANIE LICZBY GRACZY */}
    <div style={{ fontSize: '0.8rem', marginTop: '5px' }}>
    Gracze: {playersCount}/4
    </div>
   </div>
   <button 
    onClick={() => handleJoinSession(s.code, s.type)}
    disabled={!connected || !playerName}
    style={{ 
    marginLeft: '1rem', 
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
  setCardStats={setCardStats} // <--- PRZEKAZANIE NOWEJ FUNKCJI DO BATTLEFIELD
  rotateCard180={rotateCard180}
  flipCard={flipCard} 
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
 />

  {isLibraryViewerOpen && (
  <LibraryViewer 
  player={player} 
  toggleLibraryViewer={toggleLibraryViewer}
  playerColorClass={playerId ? getPlayerColorClass(playerId) : ''} 
  //moveCard={moveCard}
  />
 )}
 {isGraveyardViewerOpen && (
  <GraveyardViewer
   player={player}
   toggleGraveyardViewer={toggleGraveyardViewer}
   playerColorClass={playerId ? getPlayerColorClass(playerId) : ''}
   //moveCard={moveCard}
   // NOWA ZMIANA: Przekazanie funkcji do przenoszenia całej strefy
   // moveAllCards={handleMoveAllCards}
  />
 )}
 {isExileViewerOpen && (
  <ExileViewer
   player={player}
   toggleExileViewer={toggleExileViewer}
   playerColorClass={playerId ? getPlayerColorClass(playerId) : ''}
   //moveCard={moveCard}
   // NOWA ZMIANA: Przekazanie funkcji do przenoszenia całej strefy
   //moveAllCards={handleMoveAllCards}
  />
 )}
  {/* 4. WARUNKOWE RENDEROWANIE MODALA RESETUJĄCEGO RĘKĘ */}
{isResetHandModalOpen && (
 <ResetHandModalComponent // <--- Używamy zaimportowanej nazwy
 onClose={handleCloseResetHandModal}
 onConfirm={handleConfirmResetHand}
 />
)}
 {/* Modal Wyjścia z Gry */}
{isExitGameModalOpen && (
 <ExitGameModalComponent 
 onClose={handleCloseExitGameModal}
 onConfirm={handleConfirmExitGame}
 />
)}

 {hoveredCard && (
  <CardPreview card={hoveredCard} />
 )}
 </div>
);
}