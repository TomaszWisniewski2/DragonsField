// Sidebar.tsx

import type { Player } from "../../components/types";
import "./../Playtest.css";

interface SidebarProps {
    // viewedPlayerId: string | null;
    // setViewedPlayerId: (id: string | null) => void;
    startGame: (code: string) => void;
    resetPlayer: (code: string, playerId: string) => void; // Zachowane, ale nieużywane w przycisku "Resetuj rękę"
    shuffle: (code: string, playerId: string) => void;
    draw: (code: string, playerId: string, count: number) => void;
    // otherPlayers: Player[];
    // getPlayerColorClass: (id: string) => string;
    sessionCode: string;
    player: Player;
    nextTurn: (code: string, playerId: string) => void;
    toggleLibraryViewer: () => void;
    toggleGraveyardViewer: () => void;
    toggleExileViewer: () => void;
    resetHand: () => void; // <--- DODANY PROP DO OTWARCIA MODALA
}

export default function Sidebar({
    // viewedPlayerId,
    // setViewedPlayerId,
    startGame,
    //resetPlayer, // Wciąż jest, ale nie użyty w przycisku "Resetuj rękę"
    shuffle,
    draw,
    // otherPlayers,
    //getPlayerColorClass,
    sessionCode,
    player,
    nextTurn,
    toggleLibraryViewer,
    toggleGraveyardViewer,
    toggleExileViewer,
    resetHand, // <--- ODBIERAMY NOWY PROP
}: SidebarProps) {
    return (
        <div className="sidebar">
            {/* {viewedPlayerId !== null && (
    <button className="sidebar-button" onClick={() => setViewedPlayerId(null)}>
     Wróć do swojego pola
    </button>
   )} */}
            <button className="sidebar-button" onClick={() => startGame(sessionCode)}>
                Start Game
            </button>

            {/* ZMIANA: Używamy propa resetHand, który otworzy modal potwierdzenia */}
            <button className="sidebar-button" onClick={resetHand}>
                Resetuj rękę
            </button>

            {/* Przycisk "View Library" */}
            <button className="sidebar-button" onClick={toggleLibraryViewer}>
                View Library
            </button>
            <button className="sidebar-button" onClick={toggleGraveyardViewer}>
                View Graveyard
            </button>
            <button className="sidebar-button" onClick={toggleExileViewer}>
                View Exile
            </button>
            <button className="sidebar-button" onClick={() => shuffle(sessionCode, player.id)}>
                Shuffle
            </button>
            <button className="sidebar-button" onClick={() => draw(sessionCode, player.id, 1)}>
                Draw
            </button>
            <button className="sidebar-button next-turn" onClick={() => nextTurn(sessionCode, player.id)}>
                Next Turn
            </button>
        </div>
    );
}