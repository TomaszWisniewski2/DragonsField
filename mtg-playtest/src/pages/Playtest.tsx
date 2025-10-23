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
import type { CardType, Player, TokenData } from "../components/types"; // Typy CardType i Player pochodzą stąd
import StartGameModal from "../components/StartGameModal";
import CardPreview from "../components/CardPreview";
import { Link } from "react-router-dom"; 
import { useNavigate } from "react-router-dom"; 
import ResetHandModalComponent from "../components/ResetHandModal";
import ExitGameModalComponent from "../components/ExitGameModal"
import TokenViewer from "./PlaytestComponents/TokenViewer";
import SideboardViewer from "./PlaytestComponents/SideboardViewer";

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
allAvailableTokens,
createToken,
cloneCard,
moveCardToBattlefieldFlipped,
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
const [isLibraryViewerOpen, setIsLibraryViewerOpen] = useState(false);

const [isExileViewerOpen, setIsExileViewerOpen] = useState(false);
const [isTokenViewerOpen, setIsTokenViewerOpen] = useState(false);
const [isManaPanelVisible, setIsManaPanelVisible] = useState(false);
const [isResetHandModalOpen, setIsResetHandModalOpen] = useState(false);
const [isExitGameModalOpen, setIsExitGameModalOpen] = useState(false);
const [isSideboardViewerOpen, setIsSideboardViewerOpen] = useState(false);

// ZMIANA: Stan przechowujący ID gracza, którego Cmentarz ma być widoczny
const [viewedGraveyardPlayerId, setViewedGraveyardPlayerId] = useState<string | null>(null);
// ZMIANA: Zmienna pochodna określająca, czy Viewer Cmentarza jest otwarty
const isGraveyardViewerOpen = viewedGraveyardPlayerId !== null;

const player = session?.players.find((p) => p.id === playerId);
const otherPlayers = session?.players.filter((p) => p.id !== playerId) || [];
// ZMIANA: viewedPlayer to teraz gracz, którego pole widzimy, LUB my sami
const viewedPlayer = session?.players.find(p => p.id === viewedPlayerId) || player;
// NOWY GRACZ: Gracz, którego CMENTARZ OGLĄDAMY
const viewedGraveyardPlayer = session?.players.find(p => p.id === viewedGraveyardPlayerId) || player;

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

// ZMIANA: Funkcja otwierająca podgląd Cmentarza dla konkretnego gracza (używana w Navbar)
const openGraveyardViewerForPlayer = (pId: string) => {
 // Zawsze zamykaj inne wizualizatory
 setIsLibraryViewerOpen(false);
 setIsExileViewerOpen(false);
 setIsTokenViewerOpen(false);
 setIsSideboardViewerOpen(false);
 // Ustaw ID gracza do oglądania
 setViewedGraveyardPlayerId(pId);
};


const handleJoinSession = (code: string, sessionType: SessionType) => {
const savedDeck = localStorage.getItem("currentDeck");
const deck: CardType[] = savedDeck ? JSON.parse(savedDeck) : [];

const savedSideboard = localStorage.getItem("currentSideboard");
const sideboard: CardType[] = savedSideboard ? JSON.parse(savedSideboard) : [];

if (!playerName) {
alert("Nazwa gracza nie może być pusta.");
return;
}

if (deck.length === 0) {
alert("Talia jest pusta! Zbuduj talię w Deck Managerze.");
return;
}

if (sessionType === "commander" && deck.length === 0) {
alert("W trybie Commander talia musi zawierać kartę dowódcy.");
return;
}

joinSession(code, playerName, deck, sessionType,sideboard);
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
// --- NOWA FUNKCJA WRAPPER DO TWORZENIA TOKENÓW ---
const handleCreateToken = useCallback((tokenData: TokenData) => {
if (player && session) {
 createToken(session.code, player.id, tokenData); 
 setIsTokenViewerOpen(false); 
}
}, [player, session, createToken]); // createToken musi być w zależnościach

// NOWA FUNKCJA WRAPPER DO PRZENOSZENIA WSZYSTKICH KART
const handleMoveAllCards = useCallback((from: Zone, to: Zone) => {
if (player && session) {
moveAllCards(session.code, player.id, from, to);
}
}, [player, session, moveAllCards]);


const toggleLibraryViewer = () => {
setIsLibraryViewerOpen(!isLibraryViewerOpen);
setViewedGraveyardPlayerId(null); // Zamknij Graveyard
setIsExileViewerOpen(false);
setIsTokenViewerOpen(false);
setIsSideboardViewerOpen(false);
};

// ZMIANA: Aktualizacja toggleGraveyardViewer, aby używała nowej logiki
const toggleGraveyardViewer = () => {
// Jeśli widok jest otwarty, zamknij (null). Jeśli zamknięty, otwórz dla siebie (playerId).
setViewedGraveyardPlayerId(isGraveyardViewerOpen ? null : playerId!); 

setIsLibraryViewerOpen(false);
setIsExileViewerOpen(false);
setIsTokenViewerOpen(false);
setIsSideboardViewerOpen(false);
};

const toggleExileViewer = () => {
setIsExileViewerOpen(!isExileViewerOpen);
setViewedGraveyardPlayerId(null); // Zamknij Graveyard
setIsLibraryViewerOpen(false);
setIsTokenViewerOpen(false);
setIsSideboardViewerOpen(false);
};

const toggleTokenViewer = () => {
setIsTokenViewerOpen(!isTokenViewerOpen);
setViewedGraveyardPlayerId(null); // Zamknij Graveyard
setIsLibraryViewerOpen(false);
setIsExileViewerOpen(false);
setIsSideboardViewerOpen(false);
};

const toggleSideboardViewer = () => {
setIsSideboardViewerOpen(!isSideboardViewerOpen);
setViewedGraveyardPlayerId(null); // Zamknij Graveyard
setIsLibraryViewerOpen(false);
setIsExileViewerOpen(false);
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
setIsResetHandModalOpen(true); // Otwiera modal
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
 openGraveyardViewerForPlayer={openGraveyardViewerForPlayer} // Użycie funkcji jest teraz poprawne
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
 onCreateToken={handleCreateToken} 
 cloneCard={cloneCard}
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
/>

 {isLibraryViewerOpen && (
 <LibraryViewer 
 player={player} 
 toggleLibraryViewer={toggleLibraryViewer}
 playerColorClass={playerId ? getPlayerColorClass(playerId) : ''} 
 />
)}
{isGraveyardViewerOpen && viewedGraveyardPlayer && ( // Warunek renderowania oparty o nowe state
  <GraveyardViewer
  player={viewedGraveyardPlayer} 
  toggleGraveyardViewer={toggleGraveyardViewer}
  playerColorClass={getPlayerColorClass(viewedGraveyardPlayer.id)}
  // Przekazanie, czy oglądany gracz to my
  isOwned={viewedGraveyardPlayer.id === playerId} 
 />
)}
{isExileViewerOpen && (
 <ExileViewer
 player={player}
 toggleExileViewer={toggleExileViewer}
 playerColorClass={playerId ? getPlayerColorClass(playerId) : ''}
 />
)}
{isTokenViewerOpen && allAvailableTokens && ( // Dodano warunek allAvailableTokens
<TokenViewer
allAvailableTokens={allAvailableTokens} // <--- DODANY WYMAGANY PROP
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