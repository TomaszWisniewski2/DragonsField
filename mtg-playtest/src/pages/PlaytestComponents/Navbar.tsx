// src/pages/PlaytestComponents/Navbar.tsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import type { Player, Session } from "../../components/types";
import { PlayerPanel } from "./panels/PlayerPanel";
import "./../Playtest.css";
import "./Navbar.css";
import CountersPanel from "../../components/CountersPanel";

// ROZSZERZONY INTERFEJS PROPSÓW
interface NavbarProps {
 player: Player | undefined; // 'Ty' (gracz) lub 'undefined' (widz)
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
 openExileViewerForPlayer: (id: string) => void; 
 openLibraryViewerForPlayer: (id: string) => void; 
 openCommanderViewerForPlayer: (id: string) => void;
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
 const playerInfoRefs = useRef<Record<string, HTMLDivElement | null>>({});

 const togglePlayerPanel = useCallback((pId: string) => {
  setShowPlayerPanelForId(prevId => (prevId === pId ? null : pId));
  setShowOtherCountersForPlayerId(null); 
  setShowCounters(false); 
 }, []);

 // Zaktualizowany useEffect do obsługi kliknięcia poza panelami
 useEffect(() => {
  const handleOutsideClick = (event: MouseEvent) => {
   const target = event.target as Node;
   const clickedOnPlayerName = (target as HTMLElement).classList.contains('player-name');

   if (countersRef.current && !countersRef.current.contains(target)) {
    setShowCounters(false);
   }

   if (showOtherCountersForPlayerId && otherCountersRefs.current[showOtherCountersForPlayerId]) {
    if (!otherCountersRefs.current[showOtherCountersForPlayerId]?.contains(target)) {
     setShowOtherCountersForPlayerId(null);
    }
   }

   if (showPlayerPanelForId) {
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

 const handlePlayerNameClick = (pId: string, isLocalPlayer: boolean) => {
  setShowPlayerPanelForId(null); 
  setViewedPlayerId(isLocalPlayer ? null : pId);
 };

 const handlePlayerNameContextMenu = (e: React.MouseEvent, pId: string, isLocalPlayer: boolean) => {
  e.preventDefault(); 
  
  // ✅ ZMIANA WIDZA: Widzowie mogą otwierać panel dla każdego gracza (w tym 'siebie', jeśli 'isLocalPlayer' jest fałszem)
  // Gracz może otwierać panel tylko dla innych
  if (player && isLocalPlayer) { // 'player' istnieje = jesteś graczem
    setShowPlayerPanelForId(null); 
    return;
  }

  // Dla INNYCH GRACZY (lub jeśli jesteś widzem)
  setShowOtherCountersForPlayerId(null);
  setShowCounters(false);
  togglePlayerPanel(pId);
 };

 // ✅ KRYTYCZNA POPRAWKA: Usunięto warunek 'if (!player ...)'
 // if (!player || !session) return null; // 👈 USUNIĘTO TĘ LINIĘ

 // ✅ POPRAWKA: Używamy 'player?.counters' (optional chaining)
 const playerCounters = player?.counters || {};

 return (
    <div className="navbar">
      <div className="left-section">
        
        {/* Renderowanie warunkowe dla gracza LUB widza (jest poprawne) */}
        {player ? (
          <>
            {/* --- Kod dla ZALOGOWANEGO GRACZA --- */}
            <span
              style={{ cursor: "pointer" }}
              className={`nav-text player-name ${getPlayerColorClass(player.id)} ${session.activePlayer === player.id ? 'active-turn' : ''}`}
              onClick={() => handlePlayerNameClick(player.id, true)} 
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
          </>
        ) : (
          <>
            {/* --- Kod dla WIDZA --- */}
            <span className="nav-text">
              Spectating
            </span>
          </>
        )}
      </div>

     <div className="center-section">
      <span className="turn-indicator">Turn {session.turn}</span>
     </div>

     <div className="right-section">
      {session.players.map((p, index) => {
       const otherPlayerCounters = p.counters || {};
       // ✅ POPRAWKA WIDZA: 'isLocalPlayer' sprawdza teraz 'player'
       const isLocalPlayer = !!player && p.id === player.id; 
       const isPlayerPanelOpen = showPlayerPanelForId === p.id;
       const isOffline = p.isOnline === false;
       
       return (
        <div
         key={p.id}
         style={isOffline ? { opacity: 0.5, pointerEvents: 'none' } : {}}
         className={`other-player-info ${viewedPlayerId === p.id ? "active-player-info" : ""} ${isLocalPlayer ? "current-player" : ""} ${getPlayerColorClass(p.id)}`}
         ref={(el) => { playerInfoRefs.current[p.id] = el; }}
        >
         <span
          className={`nav-text player-name ${session.activePlayer === p.id ? 'active-turn' : ''}`}
          style={{ cursor: "pointer", fontSize: "14px" }}
          onClick={() => handlePlayerNameClick(p.id, isLocalPlayer)} 
          onContextMenu={(e) => handlePlayerNameContextMenu(e, p.id, isLocalPlayer)}
         >
          {index + 1}: {p.name}: {p.life} HP
          {isOffline && (
            <span 
              style={{ color: '#969595ff', marginLeft: '5px', fontSize: '1.2em', lineHeight: '1' }} 
              title="Gracz rozłączony (Offline)"
            >
              ●
            </span>
          )}
         </span>

         {/* ✅ POPRAWKA WIDZA: Panel otwiera się dla każdego, kto NIE jest 'isLocalPlayer' (działa dla widza) */}
         {isPlayerPanelOpen && !isLocalPlayer && (
          <PlayerPanel
           onClose={() => setShowPlayerPanelForId(null)}
           targetPlayer={p}
           sessionType={session.sessionType} 
           openGraveyardViewerForPlayer={openGraveyardViewerForPlayer} 
           setViewedPlayerId={setViewedPlayerId}
           playerColorClass={getPlayerColorClass(p.id)}
           openExileViewerForPlayer={openExileViewerForPlayer}
           openLibraryViewerForPlayer={openLibraryViewerForPlayer}
           openCommanderViewerForPlayer={openCommanderViewerForPlayer} 
          />
         )}
         
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