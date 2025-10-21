import React, { useState, useEffect, useRef } from "react";
import type { Player, Session } from "../../components/types";
import "./../Playtest.css";
import "./Navbar.css";
import CountersPanel from "../../components/CountersPanel";
//import { useNavigate } from "react-router-dom";
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
}

export default function Navbar({
  player,
  session,
  changeLife,
  //setZoom,
  setViewedPlayerId,
  getPlayerColorClass,
  //zoom,
  viewedPlayerId,
  changeCounters,
  handleGoHome,
}: NavbarProps) {
  //const navigate = useNavigate();
  // Stan dla paneli liczników (lokalny, tylko do kontrolowania widoczności)
  const [showCounters, setShowCounters] = useState(false);
  const [showOtherCountersForPlayerId, setShowOtherCountersForPlayerId] = useState<string | null>(null);

  // Referencje do elementów DOM
  const countersRef = useRef<HTMLDivElement>(null);
  const otherCountersRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Efekt do obsługi kliknięcia poza panelami
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      // Sprawdzenie głównego panelu w lewej sekcji
      if (countersRef.current && !countersRef.current.contains(target)) {
        setShowCounters(false);
      }
      // Sprawdzenie paneli w prawej sekcji
      if (showOtherCountersForPlayerId && otherCountersRefs.current[showOtherCountersForPlayerId]) {
        if (!otherCountersRefs.current[showOtherCountersForPlayerId]?.contains(target)) {
          setShowOtherCountersForPlayerId(null);
        }
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showOtherCountersForPlayerId]);

  // Funkcje obsługi dla panelu w lewej sekcji (dla lokalnego gracza)
  const handleCounterChange = (type: string, value: number) => {
    if (player && session) {
      const newCounters = { ...player.counters, [type]: player.counters[type] + value };
      changeCounters(session.code, player.id, type, newCounters[type]);
    }
  };

  const toggleCountersPanel = () => {
    setShowCounters(!showCounters);
  };

  // Funkcje obsługi dla paneli w prawej sekcji (dla innych graczy)
  const handleOtherCounterChange = (pId: string, type: string, value: number) => {
    if (session) {
      const otherPlayer = session.players.find(p => p.id === pId);
      if (otherPlayer) {
        const newCounters = { ...otherPlayer.counters, [type]: otherPlayer.counters[type] + value };
        changeCounters(session.code, pId, type, newCounters[type]);
      }
    }
  };

  const toggleOtherCountersPanel = (pId: string) => {
    setShowOtherCountersForPlayerId(prevId => (prevId === pId ? null : pId));
  };



  if (!player || !session) return null;

  // Użyj domyślnego obiektu, aby uniknąć błędów
  const playerCounters = player.counters || {};

  return (
    <div className="navbar">
      <div className="left-section">
        <span
          style={{ cursor: "pointer" }}
          className={`nav-text player-name ${getPlayerColorClass(player.id)} ${session.activePlayer === player.id ? 'active-turn' : ''}`}
          onClick={() => setViewedPlayerId(null)}
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
            // BRAK propa 'readOnly' - domyślnie jest 'false'
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

          return (
            <div
              key={p.id}
              className={`other-player-info ${viewedPlayerId === p.id ? "active-player-info" : ""} ${p.id === player.id ? "current-player" : ""} ${getPlayerColorClass(p.id)}`}
            >
              <span
                className={`nav-text player-name ${session.activePlayer === p.id ? 'active-turn' : ''}`}
                style={{ cursor: "pointer", fontSize: "14px" }}
                onClick={() => setViewedPlayerId(p.id === player.id ? null : p.id)}
              >
                {index + 1}: {p.name}: {p.life} HP
              </span>
              <div
                className="relative counters-btn-container"
                ref={(el) => { otherCountersRefs.current[p.id] = el; }}
              >
                <a
                  className={`nav-text nav-link dropdown-triangle ${getPlayerColorClass(p.id)}`}
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
                    readOnly={true} // <-- DODANO PROP, KTÓRY WYŁĄCZA GUZIKI
                  />
                )}
              </div>
            </div>
          );
        })}

        <div className="navbar-right">
          {/* ZMIANA: Używamy nowego propa onClick */}
          <button className="nav-button2" onClick={handleGoHome}>
            🐲 Dragons Field
          </button>
        </div>

      </div>
    </div>
  );
}