// src/components/Playtest/Bottombar.tsx

import React, { useState, useRef, useEffect } from "react";
import Card from "../../components/Card";
import type { Player, Zone, Session } from "../../components/types";
import "./../Playtest.css";
import "./Bottombar.css";
import type { CardType } from "../../components/types";

// --- INTERFEJSY PANELÓW ---

interface PanelProps {
  onClose: () => void;
  panelRef: React.RefObject<HTMLDivElement | null>; 
}

// --- KOMPONENT HAND PANEL ---

const HandPanel: React.FC<PanelProps> = ({ onClose, panelRef }) => {
  return (
    <div className="hand-panel-floating" ref={panelRef}>
      <div className="hand-panel-content">
        <button className="hand-panel-close-btn" onClick={onClose}>
          &times;
        </button>
        <div className="hand-panel-options-list">
          <button className="hand-panel-btn">Look at Hand</button>
          <button className="hand-panel-btn">Shuffle Hand</button>
          <button className="hand-panel-btn">To Library (Top)</button>
          <button className="hand-panel-btn">To Library (Bottom)</button>
        </div>
      </div>
    </div>
  );
};

// --- KOMPONENT LIBRARY PANEL ---

const LibraryPanel: React.FC<PanelProps> = ({ onClose, panelRef }) => {
  return (
    <div className="library-panel-floating" ref={panelRef}> 
      <div className="hand-panel-content">
        <button className="hand-panel-close-btn" onClick={onClose}>
          &times;
        </button>
        <div className="hand-panel-options-list">
          <button className="hand-panel-btn">Draw a Card</button>
          <button className="hand-panel-btn">Shuffle Library</button>
          <button className="hand-panel-btn">Look at Library</button>
          <button className="hand-panel-btn">To Hand (Top)</button>
        </div>
      </div>
    </div>
  );
};

// --- NOWY KOMPONENT GRAVEYARD PANEL ---

const GraveyardPanel: React.FC<PanelProps> = ({ onClose, panelRef }) => {
  return (
    <div className="graveyard-panel-floating" ref={panelRef}> 
      <div className="hand-panel-content">
        <button className="hand-panel-close-btn" onClick={onClose}>
          &times;
        </button>
        <div className="hand-panel-options-list">
          <button className="hand-panel-btn">Look at Graveyard</button>
          <button className="hand-panel-btn">Shuffle Graveyard to Library</button>
          <button className="hand-panel-btn">To Hand (Top)</button>
          <button className="hand-panel-btn">To Library (Bottom)</button>
        </div>
      </div>
    </div>
  );
};

// --- NOWY KOMPONENT EXILE PANEL ---

const ExilePanel: React.FC<PanelProps> = ({ onClose, panelRef }) => {
  return (
    <div className="exile-panel-floating" ref={panelRef}> 
      <div className="hand-panel-content">
        <button className="hand-panel-close-btn" onClick={onClose}>
          &times;
        </button>
        <div className="hand-panel-options-list">
          <button className="hand-panel-btn">Look at Exile</button>
          <button className="hand-panel-btn">To Battlefield</button>
          <button className="hand-panel-btn">To Hand</button>
          <button className="hand-panel-btn">To Library (Bottom)</button>
        </div>
      </div>
    </div>
  );
};

// --- GŁÓWNY INTERFEJS PROPSÓW ---

interface BottombarProps {
  player: Player | undefined;
  session: Session;
  getPlayerColorClass: (id: string) => string;
  setDragOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  moveCard: (
    code: string,
    playerId: string,
    from: Zone,
    to: Zone,
    cardId: string
  ) => void;
  clearSelectedCards: () => void;
  handleCardHover: (card: CardType | null) => void;
}

export default function Bottombar({
  player,
  session,
  getPlayerColorClass,
  setDragOffset,
  moveCard,
  clearSelectedCards,
  handleCardHover,
}: BottombarProps) {
  
  // --- STANY I REFERENCJE (4 PANELE) ---
  const [isHandPanelOpen, setIsHandPanelOpen] = useState(false);
  const [isLibraryPanelOpen, setIsLibraryPanelOpen] = useState(false);
  const [isGraveyardPanelOpen, setIsGraveyardPanelOpen] = useState(false); // NOWY STAN
  const [isExilePanelOpen, setIsExilePanelOpen] = useState(false);         // NOWY STAN
  
  const handPanelRef = useRef<HTMLDivElement>(null); 
  const libraryPanelRef = useRef<HTMLDivElement>(null); 
  const graveyardPanelRef = useRef<HTMLDivElement>(null); // NOWY REF
  const exilePanelRef = useRef<HTMLDivElement>(null);     // NOWY REF
  const bottomBarRef = useRef<HTMLDivElement>(null); 
  
  // Tablica wszystkich funkcji zamykających
  const closeAllPanels = () => {
    setIsHandPanelOpen(false);
    setIsLibraryPanelOpen(false);
    setIsGraveyardPanelOpen(false);
    setIsExilePanelOpen(false);
  };

  // Funkcja przełączająca z zamykaniem innych
  const createToggle = (setPanelOpen: React.Dispatch<React.SetStateAction<boolean>>, isPanelOpen: boolean) => 
    (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      if (!isPanelOpen) {
        closeAllPanels(); // Zamknij wszystko inne przed otwarciem
      }
      setPanelOpen(prev => !prev);
    };

  const toggleHandPanel = createToggle(setIsHandPanelOpen, isHandPanelOpen);
  const toggleLibraryPanel = createToggle(setIsLibraryPanelOpen, isLibraryPanelOpen);
  const toggleGraveyardPanel = createToggle(setIsGraveyardPanelOpen, isGraveyardPanelOpen); // NOWY TOGGLE
  const toggleExilePanel = createToggle(setIsExilePanelOpen, isExilePanelOpen);             // NOWY TOGGLE

  // --- HOOK ZAMYKAJĄCY PANELE ---

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      
      const targetNode = event.target as Node;

      // Sprawdzenie, czy kliknięto na którykolwiek z elementów sterujących toggle (Hand, Library, Graveyard, Exile labels)
      const isToggleElement = [
        bottomBarRef.current?.querySelector('.hand'),
        bottomBarRef.current?.querySelector('.zone-box-container .library')?.parentElement?.querySelector('.zone-label'),
        bottomBarRef.current?.querySelector('.zone-box-container .graveyard')?.parentElement?.querySelector('.zone-label'),
        bottomBarRef.current?.querySelector('.zone-box-container .exile')?.parentElement?.querySelector('.zone-label'),
      ].some(el => el?.contains(targetNode));
      
      if (isToggleElement) {
        return; 
      }
      
      // Lista wszystkich referencji paneli
      const panelRefs = [
        { isOpen: isHandPanelOpen, ref: handPanelRef },
        { isOpen: isLibraryPanelOpen, ref: libraryPanelRef },
        { isOpen: isGraveyardPanelOpen, ref: graveyardPanelRef },
        { isOpen: isExilePanelOpen, ref: exilePanelRef },
      ];

      // Zamknij panele, jeśli kliknięcie było poza nimi
      panelRefs.forEach(({ isOpen, ref }) => {
        if (isOpen && ref.current && !ref.current.contains(targetNode)) {
          // Używamy funkcji zamykającej bezpośrednio stan
          if (ref === handPanelRef) setIsHandPanelOpen(false);
          if (ref === libraryPanelRef) setIsLibraryPanelOpen(false);
          if (ref === graveyardPanelRef) setIsGraveyardPanelOpen(false);
          if (ref === exilePanelRef) setIsExilePanelOpen(false);
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isHandPanelOpen, isLibraryPanelOpen, isGraveyardPanelOpen, isExilePanelOpen]); 

  if (!player || !session) return null;

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, toZone: Zone) => {
    e.preventDefault();
    const isGroupDrag = e.dataTransfer.types.includes("text/json");

    if (isGroupDrag) {
      const draggedCardsData = JSON.parse(e.dataTransfer.getData("text/json")) as { cardId: string }[];
      
      draggedCardsData.forEach((cardData) => {
        moveCard(session.code, player.id, "battlefield", toZone, cardData.cardId);
      });
      
      clearSelectedCards();

    } else {
      const cardId = e.dataTransfer.getData("cardId");
      const from = e.dataTransfer.getData("from") as Zone;
      if (cardId) {
        moveCard(session.code, player.id, from, toZone, cardId);
      }
    }
  };

  const MTG_CARD_BACK_URL = "https://assets.moxfield.net/assets/images/missing-image.png";

  return (
    <>
      <div className={`bottom-bar ${getPlayerColorClass(player.id)}`} ref={bottomBarRef}> 
        
        {/* Obszar RĘKI (Hand) */}
        <div 
          className="hand"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, "hand")}
          onClick={toggleHandPanel as React.MouseEventHandler<HTMLDivElement>} // Używamy toggle dla diva
        >
          <span style={{ color: "#fff", cursor: 'pointer' }}>
            Hand ({player?.hand.length ?? 0})
            {isHandPanelOpen ? ' ▲' : ' ▼'} 
          </span>
          <div className="hand-cards">
            {player?.hand.map((c) => (
              <div
                key={c.id}
                draggable
                onDragStart={(e) => {
                  e.stopPropagation(); 
                  const rect = e.currentTarget.getBoundingClientRect();
                  setDragOffset({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                  
                  e.dataTransfer.setData("cardId", c.id);
                  e.dataTransfer.setData("from", "hand");
                }}
                onMouseEnter={() => handleCardHover(c)}
                onMouseLeave={() => handleCardHover(null)}
                onClick={(e) => e.stopPropagation()} 
              >
                <Card
                  card={c}
                  from="hand"
                  ownerId={player.id}
                  getPlayerColorClass={getPlayerColorClass}
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="zones-container">
          
          {/* Kontener dla Library */}
          <div className="zone-box-container">
            <span 
              className="zone-label"
              onClick={toggleLibraryPanel as React.MouseEventHandler<HTMLSpanElement>} 
              style={{ cursor: 'pointer' }}
            >
              Library ({player?.library.length ?? 0})
              {isLibraryPanelOpen ? ' ▲' : ' ▼'} 
            </span>
            <div 
              className="zone-box library"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, "library")}
              onClick={(e) => e.stopPropagation()} 
            >
              {player.library.length > 0 && (
                <img
                  src={MTG_CARD_BACK_URL}
                  alt="MTG Card Back"
                  className="mtg-card-back"
                  draggable
                  onDragStart={(e) => {
                    const cardId = player.library[player.library.length - 1].id;
                    e.dataTransfer.setData("cardId", cardId);
                    e.dataTransfer.setData("from", "library");
                    e.dataTransfer.setDragImage(e.currentTarget, e.currentTarget.width / 2, e.currentTarget.height / 2);
                  }}
                />
              )}
            </div>
          </div>

          {/* Kontener dla Graveyard */}
          <div className="zone-box-container">
            <span 
              className="zone-label"
              onClick={toggleGraveyardPanel as React.MouseEventHandler<HTMLSpanElement>} // NOWY ONCLICK
              style={{ cursor: 'pointer' }}
            >
              Graveyard ({player?.graveyard.length ?? 0})
              {isGraveyardPanelOpen ? ' ▲' : ' ▼'}
            </span>
            <div 
              className="zone-box graveyard"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, "graveyard")}
            >
              {player.graveyard.length > 0 && (
                <div
                  draggable
                  onDragStart={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setDragOffset({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                    const cardId = player.graveyard[player.graveyard.length - 1].id;
                    e.dataTransfer.setData("cardId", cardId);
                    e.dataTransfer.setData("from", "graveyard");
                  }}
                  onMouseEnter={() => handleCardHover(player.graveyard[player.graveyard.length - 1])}
                  onMouseLeave={() => handleCardHover(null)}
                  onClick={(e) => e.stopPropagation()} 
                >
                  <Card
                    card={player.graveyard[player.graveyard.length - 1]}
                    from="graveyard"
                    ownerId={player.id}
                    getPlayerColorClass={getPlayerColorClass}
                  />
                </div>
              )}
            </div>
          </div>
              
          {/* Kontener dla Exile */}
          <div className="zone-box-container">
            <span 
              className="zone-label"
              onClick={toggleExilePanel as React.MouseEventHandler<HTMLSpanElement>} // NOWY ONCLICK
              style={{ cursor: 'pointer' }}
            >
              Exile ({player?.exile.length ?? 0})
              {isExilePanelOpen ? ' ▲' : ' ▼'}
            </span>
            <div 
              className="zone-box exile"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, "exile")}
            >
              {player.exile.length > 0 && (
                <div
                  draggable
                  onDragStart={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setDragOffset({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                    const cardId = player.exile[player.exile.length - 1].id;
                    e.dataTransfer.setData("cardId", cardId);
                    e.dataTransfer.setData("from", "exile");
                  }}
                  onMouseEnter={() => handleCardHover(player.exile[player.exile.length - 1])}
                  onMouseLeave={() => handleCardHover(null)}
                  onClick={(e) => e.stopPropagation()} 
                >
                  <Card
                    card={player.exile[player.exile.length - 1]}
                    from="exile"
                    ownerId={player.id}
                    getPlayerColorClass={getPlayerColorClass}
                  />
                </div>
              )}
            </div>
          </div>

          {/* NOWA ZONA - Commander Zone */}
          {session.sessionType === "commander" && (
              <div className="zone-box-container">
                  <span className="zone-label">Commander Zone</span>
                  <div
                      className="zone-box commander-zone"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, "commanderZone")}
                  >
                      {player.commanderZone.length > 0 && (
                          <div
                              draggable
                              onDragStart={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setDragOffset({
                                      x: e.clientX - rect.left,
                                      y: e.clientY - rect.top,
                                  });
                                  const cardId = player.commanderZone[0].id;
                                  e.dataTransfer.setData("cardId", cardId);
                                  e.dataTransfer.setData("from", "commanderZone");
                              }}
                              onMouseEnter={() => handleCardHover(player.commanderZone[0])}
                              onMouseLeave={() => handleCardHover(null)}
                              onClick={(e) => e.stopPropagation()} 
                          >
                              <Card
                                  card={player.commanderZone[0]}
                                  from="commanderZone"
                                  ownerId={player.id}
                                  getPlayerColorClass={getPlayerColorClass}
                              />
                          </div>
                      )}
                  </div>
              </div>
          )}
        </div>
      </div>
      
      {/* RENDEROWANIE PANELI */}
      
      {isHandPanelOpen && (
        <HandPanel 
          onClose={() => setIsHandPanelOpen(false)} 
          panelRef={handPanelRef} 
        />
      )}
      
      {isLibraryPanelOpen && (
        <LibraryPanel 
          onClose={() => setIsLibraryPanelOpen(false)} 
          panelRef={libraryPanelRef} 
        />
      )}
      
      {isGraveyardPanelOpen && (
        <GraveyardPanel 
          onClose={() => setIsGraveyardPanelOpen(false)} 
          panelRef={graveyardPanelRef} 
        />
      )}

      {isExilePanelOpen && (
        <ExilePanel 
          onClose={() => setIsExilePanelOpen(false)} 
          panelRef={exilePanelRef} 
        />
      )}
    </>
  );
}