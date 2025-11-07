// src/pages/PlaytestComponents/Navbar.tsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import type { Player, Session } from "../../components/types";
import { PlayerPanel } from "./panels/PlayerPanel";
import "./../Playtest.css";
import "./Navbar.css";
import CountersPanel from "../../components/CountersPanel";

// ROZSZERZONY INTERFEJS PROPSÓW
interface NavbarProps {
 player: Player | undefined;
 session: Session;
 changeLife: (code: string, playerId: string, newLife: number) => void;
 setZoom: (zoom: number | ((prevZoom: number) => number)) => void;
 setViewedPlayerId: React.Dispatch<React.SetStateAction<string | null>>;
 getPlayerColorClass: (id: string) => string;
 zoom: number;
 otherPlayers: Player[];
 viewedPlayerId: string | null;
 changeCounters: (code: string, playerId: string, type: string, newValue: number) => void;
 handleGoHome: () => void;
 openGraveyardViewerForPlayer: (id: string) => void; 
 // === NOWE PROPSY DLA PLAYER PANEL ===
 openExileViewerForPlayer: (id: string) => void; 
 openLibraryViewerForPlayer: (id: string) => void; 
 openCommanderViewerForPlayer: (id: string) => void;
 // ===================================
}

export default function Navbar({
 player,
 session,
 changeLife,
 setViewedPlayerId,
 getPlayerColorClass,
 viewedPlayerId,
 changeCounters,
 handleGoHome,
 openGraveyardViewerForPlayer,
 openExileViewerForPlayer, 
 openLibraryViewerForPlayer, 
 openCommanderViewerForPlayer,
}: NavbarProps) {
 // Stan dla paneli liczników
 const [showCounters, setShowCounters] = useState(false);
 const [showOtherCountersForPlayerId, setShowOtherCountersForPlayerId] = useState<string | null>(null);

 // Przechowuje ID gracza, dla którego otwarty jest PlayerPanel
 const [showPlayerPanelForId, setShowPlayerPanelForId] = useState<string | null>(null);

 // Referencje do elementów DOM
 const countersRef = useRef<HTMLDivElement>(null);
 const otherCountersRefs = useRef<Record<string, HTMLDivElement | null>>({});

 // Refy dla kontenerów innych graczy (do zamykania po kliknięciu poza elementem)
 const playerInfoRefs = useRef<Record<string, HTMLDivElement | null>>({});

 // Przełączanie PlayerPanel (używane dla innych graczy) - używamy useCallback
 // aby zapewnić stabilną funkcję dla useEffect.
 const togglePlayerPanel = useCallback((pId: string) => {
  setShowPlayerPanelForId(prevId => (prevId === pId ? null : pId));
  setShowOtherCountersForPlayerId(null); 
  setShowCounters(false); 
 }, []);


 // === useEffect do obsługi skrótów klawiszowych (F1-F6) ===
 // (Blok zakomentowany przez użytkownika, ale zawiera poprawki błędów)
//  useEffect(() => {
//    const handleKeyDown = (event: KeyboardEvent) => {
//      // Sprawdź, czy klawisz to jeden z F1 do F6
//      if (event.key === 'F1' || event.key === 'F2' || event.key === 'F3' || event.key === 'F4' || event.key === 'F5' || event.key === 'F6') {
//        let playerIndex: number;

//        // Wyznacz indeks gracza na podstawie wciśniętego klawisza Fx
//        switch (event.key) {
//          case 'F1':
//            playerIndex = 0; // Klawisz 'F1' odpowiada indeksowi 0 (gracz 1)
//            break;
//          case 'F2':
//            playerIndex = 1; // Klawisz 'F2' odpowiada indeksowi 1 (gracz 2)
//            break;
//          case 'F3':
//            playerIndex = 2; // Klawisz 'F3' odpowiada indeksowi 2 (gracz 3)
//            break;
//          case 'F4':
//            playerIndex = 3; // Klawisz 'F4' odpowiada indeksowi 3 (gracz 4)
//            break; // <-- ✅ POPRAWKA: Dodano brakujący break
//          case 'F5':
//            playerIndex = 4; // Klawisz 'F5' odpowiada indeksowi 4 (gracz 5)
//            break; // <-- ✅ POPRAWKA: Dodano brakujący break
//          case 'F6':
//            playerIndex = 5; // Klawisz 'F6' odpowiada indeksowi 5 (gracz 6)
//            break;
//          default:
//            return; // Powinno być nieosiągalne, ale dla bezpieczeństwa
//        }
   
//        // Upewnij się, że index jest prawidłowy i gracz istnieje w sesji
//        if (session.players[playerIndex]) {
//          const targetPlayer = session.players[playerIndex];
   
//          // Jeśli to lokalny gracz, ignorujemy (zgodnie z logiką RMB)
//          if (targetPlayer.id === player?.id) {
//            return; 
//          }

//          event.preventDefault(); 
   
//          // Przełącz PlayerPanel dla znalezionego gracza
//          togglePlayerPanel(targetPlayer.id);
//        }
//      }
//    };

//    document.addEventListener('keydown', handleKeyDown);

//    return () => {
//      document.removeEventListener('keydown', handleKeyDown);
//    };
//  }, [session.players, player?.id, togglePlayerPanel]); 
 // =========================================================================

 // Zaktualizowany useEffect do obsługi kliknięcia poza panelami
 useEffect(() => {
  const handleOutsideClick = (event: MouseEvent) => {
   const target = event.target as Node;
   // Sprawdź, czy kliknięcie było na elemencie z klasą 'player-name' (używane w PlayerPanel)
   const clickedOnPlayerName = (target as HTMLElement).classList.contains('player-name');

   // Logika dla głównego CountersPanel
   if (countersRef.current && !countersRef.current.contains(target)) {
    setShowCounters(false);
   }

   // Logika dla CountersPanel innych graczy
   if (showOtherCountersForPlayerId && otherCountersRefs.current[showOtherCountersForPlayerId]) {
    if (!otherCountersRefs.current[showOtherCountersForPlayerId]?.contains(target)) {
     setShowOtherCountersForPlayerId(null);
    }
   }

   // Logika dla PlayerPanel
   if (showPlayerPanelForId) {
    // Używamy refa kontenera, który zawiera również PlayerPanel
    const panelContainer = playerInfoRefs.current[showPlayerPanelForId]; 
    if (panelContainer && !panelContainer.contains(target) && !clickedOnPlayerName) {
     setShowPlayerPanelForId(null);
    }
   }
  };
  
  document.addEventListener("mousedown", handleOutsideClick);
  return () => {
   document.removeEventListener("mousedown", handleOutsideClick);
  };
 }, [showOtherCountersForPlayerId, showPlayerPanelForId]);

 // Funkcje obsługi skrócone...
 const handleCounterChange = (type: string, value: number) => {
  if (player && session) {
   const newCounters = { ...player.counters, [type]: (player.counters[type] || 0) + value };
   changeCounters(session.code, player.id, type, newCounters[type]);
  }
 };

 const toggleCountersPanel = () => {
  setShowCounters(prev => !prev);
  setShowPlayerPanelForId(null); 
 };

 const handleOtherCounterChange = (pId: string, type: string, value: number) => {
  if (session) {
   const otherPlayer = session.players.find(p => p.id === pId);
   if (otherPlayer) {
    const newCounters = { ...otherPlayer.counters, [type]: (otherPlayer.counters[type] || 0) + value };
    changeCounters(session.code, pId, type, newCounters[type]);
   }
  }
 };

 const toggleOtherCountersPanel = (pId: string) => {
  setShowOtherCountersForPlayerId(prevId => (prevId === pId ? null : pId));
  setShowPlayerPanelForId(null); 
  setShowCounters(false); 
 };

 // Obsługa kliknięcia Lewym Przyciskiem (LMB)
 const handlePlayerNameClick = (pId: string, isLocalPlayer: boolean) => {
  // 1. Zamknij PlayerPanel, jeśli jest otwarty
  setShowPlayerPanelForId(null); 
  // 2. Przełącz widok: na własne pole (null) lub na pole przeciwnika
  setViewedPlayerId(isLocalPlayer ? null : pId);
 };

 // Obsługa kliknięcia Prawym Przyciskiem (RMB)
 const handlePlayerNameContextMenu = (e: React.MouseEvent, pId: string, isLocalPlayer: boolean) => {
  e.preventDefault(); // Zawsze zapobiega domyślnemu menu kontekstowemu przeglądarki

  // Jeśli kliknięcie jest na WŁASNYM GRACZU, po prostu wychodzimy po zapobieżeniu domyślnej akcji
  if (isLocalPlayer) {
   setShowPlayerPanelForId(null); // Upewnij się, że PlayerPanel jest zamknięty
   return;
  }

  // W przeciwnym razie (dla INNYCH GRACZY):
  // 1. Zamyka inne panele (Counters)
  setShowOtherCountersForPlayerId(null);
  setShowCounters(false);

  // 2. Otwiera/zamyka PlayerPanel
  togglePlayerPanel(pId);
 };


 if (!player || !session) return null;

 // Użyj domyślnego obiektu, aby uniknąć błędów
 const playerCounters = player.counters || {};

 return (
  <div className="navbar">
   <div className="left-section">
    {/* WŁASNY GRACZ: Zmieniona logika dla LMB/RMB */}
    <span
     style={{ cursor: "pointer" }}
     className={`nav-text player-name ${getPlayerColorClass(player.id)} ${session.activePlayer === player.id ? 'active-turn' : ''}`}
     // LMB: Przełącz na widok własnego pola (null)
     onClick={() => handlePlayerNameClick(player.id, true)} 
     // RMB: ZMIANA: Zablokuj menu kontekstowe, ale nie otwieraj PlayerPanel
     onContextMenu={(e) => handlePlayerNameContextMenu(e, player.id, true)} 
    >
     {session.players.findIndex((p) => p.id === player.id) + 1}: {player.name}
    </span>
    <div>
     <button className="nav-button" onClick={() => changeLife(session.code, player.id, player.life - 5)}>-5</button>
     <button className="nav-button" onClick={() => changeLife(session.code, player.id, player.life - 1)}>-</button>
    </div>
    <span className={`nav-text player-life ${getPlayerColorClass(player.id)}`}>{player.life} HP</span>
    <div>
     <button className="nav-button" onClick={() => changeLife(session.code, player.id, player.life + 1)}>+</button>
     <button className="nav-button" onClick={() => changeLife(session.code, player.id, player.life + 5)}>+5</button>
    </div>


    {/* Oryginalny kontener z przyciskiem Counters */}
    <div className="relative" ref={countersRef}>
     <a
      className={`nav-text nav-link counters-btn dropdown-triangle ${getPlayerColorClass(player.id)}`}
      onClick={toggleCountersPanel}
     >
      Counters
     </a>
     {showCounters && (
      <CountersPanel
       counters={playerCounters}
       onCounterChange={handleCounterChange}
       onClose={toggleCountersPanel}
       playerColorClass={getPlayerColorClass(player.id)}
      />
     )}
    </div>
   </div>

   <div className="center-section">
    <span className="turn-indicator">Turn {session.turn}</span>
   </div>

   <div className="right-section">
    {session.players.map((p, index) => {
     const otherPlayerCounters = p.counters || {};
     const isLocalPlayer = p.id === player.id; 
     const isPlayerPanelOpen = showPlayerPanelForId === p.id;

     // ✅ NOWA ZMIENNA: Sprawdzamy, czy gracz jest offline
     // Zakładamy, że 'isOnline' jest domyślnie 'true', jeśli pole nie istnieje
     const isOffline = p.isOnline === false;
   
     return (
      <div
       key={p.id}
       // ✅ NOWOŚĆ: Dodajemy styl 'opacity', jeśli gracz jest offline
       style={isOffline ? { opacity: 0.5, pointerEvents: 'none' } : {}}
       className={`other-player-info ${viewedPlayerId === p.id ? "active-player-info" : ""} ${isLocalPlayer ? "current-player" : ""} ${getPlayerColorClass(p.id)}`}
       ref={(el) => { playerInfoRefs.current[p.id] = el; }}
      >
       {/* OBSŁUGA GRACZY W RIGHT-SECTION */}
       <span
        className={`nav-text player-name ${session.activePlayer === p.id ? 'active-turn' : ''}`}
        style={{ cursor: "pointer", fontSize: "14px" }}
        // LMB: Przełącz widok (na własny jeśli to my, na przeciwnika w innym przypadku)
        onClick={() => handlePlayerNameClick(p.id, isLocalPlayer)} 
        // RMB: Otwórz panel TYLKO dla przeciwników, dla własnego gracza zablokuj.
        onContextMenu={(e) => handlePlayerNameContextMenu(e, p.id, isLocalPlayer)}
       >
        {index + 1}: {p.name}: {p.life} HP
        {/* ✅ NOWOŚĆ: Dodajemy etykietę "(Offline)" */}
        {isOffline && (
  <span 
    style={{ color: '#969595ff', marginLeft: '5px', fontSize: '1.2em', lineHeight: '1' }} 
    title="Gracz rozłączony (Offline)"
  >
    ●
  </span>
)}
       </span>

       {/* PlayerPanel otwiera się TYLKO dla przeciwników po RMB lub przez skrót klawiszowy */}
       {isPlayerPanelOpen && !isLocalPlayer && (
        <PlayerPanel
         onClose={() => setShowPlayerPanelForId(null)}
         targetPlayer={p}
         sessionType={session.sessionType} 
         openGraveyardViewerForPlayer={openGraveyardViewerForPlayer} 
         setViewedPlayerId={setViewedPlayerId}
         playerColorClass={getPlayerColorClass(p.id)}
         // === PRZEKAZANIE NOWYCH FUNKCJI ===
         openExileViewerForPlayer={openExileViewerForPlayer}
         openLibraryViewerForPlayer={openLibraryViewerForPlayer}
         openCommanderViewerForPlayer={openCommanderViewerForPlayer} 
         // =================================
        />
       )}
       
       {/* Przyciski Counters/Dropdown dla wszystkich graczy */}
       <div
        className="relative counters-btn-container"
        ref={(el) => { otherCountersRefs.current[p.id] = el; }}
       >
        <a
         className={`nav-text nav-link counters-dropdown-trigger dropdown-triangle ${getPlayerColorClass(p.id)}`}
         onClick={(e) => {
          e.stopPropagation();
          toggleOtherCountersPanel(p.id);
         }}
        >
        </a>
        {showOtherCountersForPlayerId === p.id && (
         <CountersPanel
          counters={otherPlayerCounters}
          onCounterChange={(type, value) => handleOtherCounterChange(p.id, type, value)}
          onClose={() => setShowOtherCountersForPlayerId(null)}
          playerColorClass={getPlayerColorClass(p.id)}
          readOnly={true}
         />
        )}
       </div>
      </div>
     );
    })}

    <div className="navbar-right">
     <button className="nav-button2" onClick={handleGoHome}>
     🐲 Dragons Field
     </button>
    </div>

   </div>
  </div>
 );
}