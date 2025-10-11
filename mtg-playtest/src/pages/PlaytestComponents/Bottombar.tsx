import React, { useState, useRef, useEffect } from "react";
import Card from "../../components/Card";
import type { Player, Zone, Session, CardType, SortCriteria } from "../../components/types";
import "./../Playtest.css";
import "./Bottombar.css";

// Import Paneli (założenie, że są w katalogu 'panels')
import { HandPanel } from "./panels/HandPanel";
import { LibraryPanel, type LibraryPanelProps } from "./panels/LibraryPanel";
import { GraveyardPanel, type GraveyardPanelProps } from "./panels/GraveyardPanel";
// Domyślnie ExilePanelProps importuje uproszczoną wersję
import { ExilePanel, type ExilePanelProps } from "./panels/ExilePanel";
import { CardPanel, type CardPanelProps } from "./panels/CardPanel";


// --- INTERFEJSY PANELÓW (Zostawiamy je w Bottombar.tsx, aby panele je importowały) ---

interface PanelProps {
  onClose: () => void;
  panelRef: React.RefObject<HTMLDivElement | null>;
}

// --- GŁÓWNY INTERFEJS PROPSÓW BOTTOMBAR ---

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
  toggleLibraryViewer: () => void;
  toggleGraveyardViewer: () => void;
  toggleExileViewer: () => void;
  sessionCode: string;
  viewedPlayer: Player | null | undefined;
  // Ta sygnatura (z czterema argumentami) jest funkcją przychodzącą z useSocket
  handleMoveAllCards: (
    // USUNIĘTO code: string, playerId: string,
    from: Zone,
    to: Zone,
  ) => void;
  zoom: number;
  sortHand: (code: string, playerId: string, criteria: SortCriteria) => void;
  moveAllCardsToBottomOfLibrary: (code: string, playerId: string, from: Zone) => void;
  discardRandomCard: (code: string, playerId: string) => void;
  shuffle: (code: string, playerId: string) => void;
}

// Export PanelProps dla pozostałych komponentów
export type { PanelProps, LibraryPanelProps, GraveyardPanelProps, ExilePanelProps, CardPanelProps };


export default function Bottombar({
  player,
  session,
  sessionCode,
  viewedPlayer,
  getPlayerColorClass,
  setDragOffset,
  moveCard,
  clearSelectedCards,
  handleCardHover,
  toggleLibraryViewer,
  toggleGraveyardViewer,
  toggleExileViewer,
  handleMoveAllCards, // Właściwa funkcja z useSocket
  zoom,
  sortHand,
  moveAllCardsToBottomOfLibrary,
  discardRandomCard,
  shuffle,
}: BottombarProps) {

  // --- STANY I REFERENCJE ---
  const [isHandPanelOpen, setIsHandPanelOpen] = useState(false);
  const [isLibraryPanelOpen, setIsLibraryPanelOpen] = useState(false);
  const [isGraveyardPanelOpen, setIsGraveyardPanelOpen] = useState(false);
  const [isExilePanelOpen, setIsExilePanelOpen] = useState(false);
  const [isCardPanelOpen, setIsCardPanelOpen] = useState(false);
  const [selectedCardForPanel, setSelectedCardForPanel] = useState<CardType | null>(null);
  const [panelPosition, setPanelPosition] = useState<{ x: number, y: number } | null>(null);
  const [panelDirection, setPanelDirection] = useState<'up' | 'down'>('up');
  const [isLibraryTopRevealed, setIsLibraryTopRevealed] = useState(false);

  const handPanelRef = useRef<HTMLDivElement>(null);
  const libraryPanelRef = useRef<HTMLDivElement>(null);
  const graveyardPanelRef = useRef<HTMLDivElement>(null);
  const exilePanelRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);
  const cardPanelRef = useRef<HTMLDivElement>(null);

  const closeAllPanels = () => {
    setIsHandPanelOpen(false);
    setIsLibraryPanelOpen(false);
    setIsGraveyardPanelOpen(false);
    setIsExilePanelOpen(false);
    setIsCardPanelOpen(false);
    setPanelDirection('up');
  };


  const toggleLibraryTopRevealed = () => {
    // Resetujemy podgląd hovera przy przełączeniu
    if (isLibraryTopRevealed) {
      handleCardHover(null);
    } else if (player && player.library.length > 0) {
      // Jeśli włączamy i jest karta, od razu podglądamy ją
      handleCardHover(player.library[player.library.length - 1]);
    }
    setIsLibraryTopRevealed(prev => !prev);
  };

  const handleCardContextMenu = (e: React.MouseEvent<HTMLDivElement>, card: CardType) => {
    e.preventDefault();
    e.stopPropagation();

    if (isCardPanelOpen && selectedCardForPanel?.id === card.id) {
      setIsCardPanelOpen(false);
    } else {
      closeAllPanels();
      const rect = e.currentTarget.getBoundingClientRect();

      const viewportHeight = window.innerHeight;
      const middlePoint = viewportHeight / 2;
      const cardCenterY = rect.top + rect.height / 2;

      let direction: 'up' | 'down';
      let finalY: number;

      if (cardCenterY > middlePoint) {
        direction = 'up';
        finalY = rect.top;
      } else {
        direction = 'down';
        finalY = rect.bottom;
      }

      setPanelPosition({
        x: rect.left + rect.width / 2,
        y: finalY
      });
      setPanelDirection(direction);
      setSelectedCardForPanel(card);
      setIsCardPanelOpen(true);
    }
  };



  // --- LOGIKA PRZEŁĄCZANIA PANELI (BEZ ZMIAN) ---

  const toggleHandPanel = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    if (isHandPanelOpen) {
      setIsHandPanelOpen(false);
    } else {
      closeAllPanels();
      setIsHandPanelOpen(true);
    }
  };

  const toggleLibraryPanel = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    if (isLibraryPanelOpen) {
      setIsLibraryPanelOpen(false);
    } else {
      closeAllPanels();
      setIsLibraryPanelOpen(true);
    }
  };

  const toggleGraveyardPanel = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    if (isGraveyardPanelOpen) {
      setIsGraveyardPanelOpen(false);
    } else {
      closeAllPanels();
      setIsGraveyardPanelOpen(true);
    }
  };

  const toggleExilePanel = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    if (isExilePanelOpen) {
      setIsExilePanelOpen(false);
    } else {
      closeAllPanels();
      setIsExilePanelOpen(true);
    }
  };

  // --- LOGIKA ZAMYKANIA PO KLIKNIĘCIU POZA PANELEM (BEZ ZMIAN) ---
  useEffect(() => {
    const panelToggleSelectors = [
      '#hand-toggle',
      '#library-toggle',
      '#graveyard-toggle',
      '#exile-toggle',
    ];

    const handleClickOutside = (event: globalThis.MouseEvent) => {
      const targetNode = event.target as HTMLElement;

      if (panelToggleSelectors.some(selector => targetNode.closest(selector))) {
        return;
      }

      const panelRefs = [
        { isOpen: isHandPanelOpen, ref: handPanelRef, close: () => setIsHandPanelOpen(false) },
        { isOpen: isLibraryPanelOpen, ref: libraryPanelRef, close: () => setIsLibraryPanelOpen(false) },
        { isOpen: isGraveyardPanelOpen, ref: graveyardPanelRef, close: () => setIsGraveyardPanelOpen(false) },
        { isOpen: isExilePanelOpen, ref: exilePanelRef, close: () => setIsExilePanelOpen(false) },
        { isOpen: isCardPanelOpen, ref: cardPanelRef, close: () => setIsCardPanelOpen(false) },
      ];

      panelRefs.forEach(({ isOpen, ref, close }) => {
        if (isOpen && ref.current && !ref.current.contains(targetNode)) {
          close();
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isHandPanelOpen, isLibraryPanelOpen, isGraveyardPanelOpen, isExilePanelOpen, isCardPanelOpen]);

  if (!player || !session) return null;


  // NOWA FUNKCJA - opakowująca oryginalny prop handleMoveAllCards.
  // Przyjmuje tylko from i to, a dodaje session.code i player.id


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

  // -------------------------------------------------------------------------------------
  // ZMIANA: Strefa źródłowa (from) musi być ustawiona na "hand"
  // -------------------------------------------------------------------------------------
  const handleMoveToGraveyardAction = (cardId: string) => {
    if (player && player.id === viewedPlayer?.id) {
      moveCard(sessionCode, player.id, "hand", "graveyard", cardId);
    }
  };

  const handleMoveToExileAction = (cardId: string) => {
    if (player && player.id === viewedPlayer?.id) {
      moveCard(sessionCode, player.id, "hand", "exile", cardId);
    }
  };


  const handleMovetoTopofLibrary = (cardId: string) => {
    if (player && player.id === viewedPlayer?.id) {
      moveCard(sessionCode, player.id, "hand", "library", cardId);
    }
  };
  // ------------------------------------------------------------------------------
  const MTG_CARD_BACK_URL = "https://assets.moxfield.net/assets/images/missing-image.png";

  return (
    <>
      <div className={`bottom-bar ${getPlayerColorClass(player.id)}`} ref={bottomBarRef}>

        {/* Obszar RĘKI (Hand) */}
        <div
          className="hand fixed-hand-width"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, "hand")}
        >
          <span
            id="hand-toggle"
            onClick={toggleHandPanel as React.MouseEventHandler<HTMLDivElement>}
            style={{ color: "#fff", cursor: 'pointer' }}>
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
                onContextMenu={(e) => handleCardContextMenu(e, c)}
              >
                <Card
                  card={c}
                  from="hand"
                  ownerId={player.id}
                  getPlayerColorClass={getPlayerColorClass}
                  zoom={zoom}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="zones-container">

 {/* Kontener dla Library */}
          <div className="zone-box-container">
            <span
              id="library-toggle"
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
              
              {/* 👇 ZMIENIONA LOGIKA RENDEROWANIA KARTY BIBLIOTEKI */}
              {player.library.length > 0 && (
                <div
                  draggable
                  onDragStart={(e) => {
                    const cardId = player.library[player.library.length - 1].id;
                    e.dataTransfer.setData("cardId", cardId);
                    e.dataTransfer.setData("from", "library");
                    // Używamy rewersu jako obrazu przeciągania
                    e.dataTransfer.setDragImage(
                      (e.currentTarget.querySelector('.mtg-card-back') || e.currentTarget.querySelector('.card-component')) as Element, 
                      e.currentTarget.offsetWidth / 2, 
                      e.currentTarget.offsetHeight / 2
                    );
                  }}
                  onMouseEnter={() => {
                    // Podgląd górnej karty tylko, gdy jest ODKRYTA
                    if (isLibraryTopRevealed) {
                      handleCardHover(player.library[player.library.length - 1]);
                    }
                  }}
                  onMouseLeave={() => {
                    if (isLibraryTopRevealed) {
                       handleCardHover(null)
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {isLibraryTopRevealed ? (
                    // WIDOK ODKRYTEJ KARTY
                    <Card
                      card={player.library[player.library.length - 1]}
                      from="library"
                      ownerId={player.id}
                      getPlayerColorClass={getPlayerColorClass}
                      // Brakuje propa zoom, dodaj go
                      zoom={zoom}
                    />
                  ) : (
                    // WIDOK REWERSU (DOMYŚLNY)
                    <img
                      src={MTG_CARD_BACK_URL}
                      alt="MTG Card Back"
                      className="mtg-card-back"
                    />
                  )}
                </div>
              )}
              {/* 👆 KONIEC ZMIENIONEJ LOGIKI */}
              
            </div>
          </div>

          {/* Kontener dla Graveyard */}
          <div className="zone-box-container">
            <span
              id="graveyard-toggle"
              className="zone-label"
              onClick={toggleGraveyardPanel as React.MouseEventHandler<HTMLSpanElement>}
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
              id="exile-toggle"
              className="zone-label"
              onClick={toggleExilePanel as React.MouseEventHandler<HTMLSpanElement>}
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

          {/* ZONA - Commander Zone */}
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
          handleMoveAllCards={handleMoveAllCards}
          sortHand={sortHand}
          sessionCode={session.code} // DODAJEMY SESSION CODE I PLAYER ID
          playerId={player.id}
          moveAllCardsToBottomOfLibrary={moveAllCardsToBottomOfLibrary}
          discardRandomCard={discardRandomCard}
        />
      )}

      {isLibraryPanelOpen && (
        <LibraryPanel
          onClose={() => setIsLibraryPanelOpen(false)}
          panelRef={libraryPanelRef}
          toggleLibraryViewer={toggleLibraryViewer}
          handleMoveAllCards={handleMoveAllCards}
          player={player}
          sessionCode={sessionCode}
          isTopRevealed={isLibraryTopRevealed} // Przekazujemy stan do panelu, aby przycisk wiedział, czy jest aktywny
          toggleTopRevealed={toggleLibraryTopRevealed} // Przekazujemy funkcję przełączającą
          handleCardHover={handleCardHover} // Przekazujemy, aby panel mógł zresetować podgląd
          shuffle={shuffle}
        />
      )}

      {isGraveyardPanelOpen && (
        <GraveyardPanel
          sessionCode={session.code} // DODAJEMY SESSION CODE I PLAYER ID
          playerId={player.id}
          onClose={() => setIsGraveyardPanelOpen(false)}
          panelRef={graveyardPanelRef}
          toggleGraveyardViewer={toggleGraveyardViewer}
          handleMoveAllCards={handleMoveAllCards}
          moveAllCardsToBottomOfLibrary={moveAllCardsToBottomOfLibrary}
        />
      )}

      {isExilePanelOpen && (
        <ExilePanel
          sessionCode={session.code} // DODAJEMY SESSION CODE I PLAYER ID
          playerId={player.id}
          onClose={() => setIsExilePanelOpen(false)}
          panelRef={exilePanelRef}
          toggleExileViewer={toggleExileViewer}
          // Przekazujemy funkcję o TYPIE: (from: Zone, to: Zone) => void
          handleMoveAllCards={handleMoveAllCards}
          moveAllCardsToBottomOfLibrary={moveAllCardsToBottomOfLibrary}
        />
      )}

      {isCardPanelOpen && selectedCardForPanel && panelPosition && (
        <CardPanel
          card={selectedCardForPanel}
          onClose={() => setIsCardPanelOpen(false)}
          panelRef={cardPanelRef}
          position={panelPosition}
          panelDirection={panelDirection}
          moveCardToGraveyard={handleMoveToGraveyardAction}
          moveCardToExile={handleMoveToExileAction}
          moveCardToTopOfLibrary={handleMovetoTopofLibrary}
        />
      )}
    </>
  );
}