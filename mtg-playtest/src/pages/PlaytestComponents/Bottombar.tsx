// Bottombar.tsx
import React, { useState, useRef, useEffect, useCallback, type DragEvent } from "react";
// Importujemy ZONES
import Zones from "./Zones"; 

import Card from "../../components/Card";
import type { Player, Zone, Session, CardType, SortCriteria } from "../../components/types";
import "./../Playtest.css";
import "./Bottombar.css";

// Import Paneli
import { HandPanel } from "./panels/HandPanel";
import { LibraryPanel, type LibraryPanelProps } from "./panels/LibraryPanel";
import { GraveyardPanel, type GraveyardPanelProps } from "./panels/GraveyardPanel";
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
    cardId: string,
    x?: number,       
    y?: number,       
    position?: number, 
    toBottom?: boolean 
  ) => void;
  clearSelectedCards: () => void;
  handleCardHover: (card: CardType | null) => void;
  toggleLibraryViewer: () => void;
  toggleGraveyardViewer: () => void;
  toggleExileViewer: () => void;
  sessionCode: string;
  viewedPlayer: Player | null | undefined;
  handleMoveAllCards: (
    from: Zone,
    to: Zone,
  ) => void;
  zoom: number;
  sortHand: (code: string, playerId: string, criteria: SortCriteria) => void;
  moveAllCardsToBottomOfLibrary: (code: string, playerId: string, from: Zone) => void;
  discardRandomCard: (code: string, playerId: string) => void;
  shuffle: (code: string, playerId: string) => void;
  draw: (code: string, playerId: string, count: number) => void;
  moveCardToBattlefieldFlipped: (code: string, playerId: string, cardId: string, from: Zone) => void
  isMoving: boolean; // 🛑 DODANE: Flaga blokująca interakcje podczas ruchu karty
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
  handleMoveAllCards,
  zoom,
  sortHand,
  moveAllCardsToBottomOfLibrary,
  discardRandomCard,
  shuffle,
  draw,
  moveCardToBattlefieldFlipped,
  isMoving, // 🛑 DODANE
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

  // 🛑 UŻYCIE useCallback dla stabilności
  const closeAllPanels = useCallback(() => {
    setIsHandPanelOpen(false);
    setIsLibraryPanelOpen(false);
    setIsGraveyardPanelOpen(false);
    setIsExilePanelOpen(false);
    setIsCardPanelOpen(false);
    setPanelDirection('up');
  }, []);


  const toggleLibraryTopRevealed = () => {
    // Resetujemy podgląd hovera przy przełączeniu
    if (isLibraryTopRevealed) {
      handleCardHover(null);
    } else if (player && player.library.length > 0) {
      // Jeśli włączamy i jest karta, od razu podglądamy ją
      // POPRAWKA: Używamy indeksu [0] dla górnej karty
      handleCardHover(player.library[0]); 
    }
    setIsLibraryTopRevealed(prev => !prev);
  };

  const handleCardContextMenu = (e: React.MouseEvent<HTMLDivElement>, card: CardType) => {
    e.preventDefault();
    e.stopPropagation();

    if (isMoving) { // 🛑 BLOKUJEMY, JEŚLI KARTA SIĘ PRZEMIESZCZA
        return;
    }

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

      // Stały odstęp od krawędzi karty
      const OFFSET = 10;
      
      if (cardCenterY > middlePoint) {
        direction = 'up';
        finalY = rect.top - OFFSET; // Otwieramy w górę
      } else {
        direction = 'down';
        finalY = rect.bottom + OFFSET; // Otwieramy w dół
      }

      setPanelPosition({
        x: rect.left + rect.width / 2, // Centrowanie
        y: finalY
      });
      setPanelDirection(direction);
      setSelectedCardForPanel(card);
      setIsCardPanelOpen(true);
    }
  };


  // --- LOGIKA PRZEŁĄCZANIA PANELI (przekazana do Zones) ---
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

  // --- LOGIKA ZAMYKANIA PO KLIKNIĘCIU POZA PANELEM (OPTYMALIZACJA) ---
  // Lista stanów, które decydują o otwarciu paneli
  const panelStates = { isHandPanelOpen, isLibraryPanelOpen, isGraveyardPanelOpen, isExilePanelOpen, isCardPanelOpen };

  // 🛑 Stabilny handler zamykania paneli
  const handleClickOutside = useCallback((event: globalThis.MouseEvent) => {
    const panelToggleSelectors = [
      '#hand-toggle',
      '#library-toggle',
      '#graveyard-toggle',
      '#exile-toggle',
    ];
    const targetNode = event.target as HTMLElement;

    // Używamy stanów wewnątrz funkcji callback, ale ich zmiana wymusi nową funkcję
    // Zależności zostały zaktualizowane, by używać stanów otwarcia/zamknięcia
    const panelRefs = [
      { isOpen: panelStates.isHandPanelOpen, ref: handPanelRef, close: () => setIsHandPanelOpen(false) },
      { isOpen: panelStates.isLibraryPanelOpen, ref: libraryPanelRef, close: () => setIsLibraryPanelOpen(false) },
      { isOpen: panelStates.isGraveyardPanelOpen, ref: graveyardPanelRef, close: () => setIsGraveyardPanelOpen(false) },
      { isOpen: panelStates.isExilePanelOpen, ref: exilePanelRef, close: () => setIsExilePanelOpen(false) },
      { isOpen: panelStates.isCardPanelOpen, ref: cardPanelRef, close: () => setIsCardPanelOpen(false) },
    ];

    if (panelToggleSelectors.some(selector => targetNode.closest(selector))) {
      return;
    }

    panelRefs.forEach(({ isOpen, ref, close }) => {
      if (isOpen && ref.current && !ref.current.contains(targetNode)) {
        close();
      }
    });
  }, [panelStates.isHandPanelOpen, panelStates.isLibraryPanelOpen, panelStates.isGraveyardPanelOpen, panelStates.isExilePanelOpen, panelStates.isCardPanelOpen]);


  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]); // Zależny od callbacka, który zmienia się, gdy zmieni się stan otwarcia/zamknięcia

  if (!player || !session) return null;


  // ✅ CAŁA FUNKCJA handleDrop ZOSTAŁA ZASTĄPIONA POPRAWNĄ LOGIKĄ
  const handleDrop = (e: DragEvent<HTMLDivElement>, toZone: Zone) => {
    e.preventDefault();

    if (isMoving) { // 🛑 BLOKUJEMY DROP, JEŚLI KARTA SIĘ PRZEMIESZCZA
      return;
    }
    
    const isGroupDrag = e.dataTransfer.types.includes("text/json");

    // ✅ Funkcja pomocnicza (identyczna jak w Battlefield.tsx)
    function findCardZoneInPlayer(player: Player | undefined, cardInstanceId: string): Zone | null {
      if (!player || !cardInstanceId) return null;
      if (player.hand.some(c => c.id === cardInstanceId)) return "hand";
      if (player.library.some(c => c.id === cardInstanceId)) return "library";
      if (player.graveyard.some(c => c.id === cardInstanceId)) return "graveyard";
      if (player.exile.some(c => c.id === cardInstanceId)) return "exile";
      if (player.sideboard.some(c => c.id === cardInstanceId)) return "sideboard";
      if (player.commanderZone.some(c => c.id === cardInstanceId)) return "commanderZone";
      if (player.battlefield.some(f => f.id === cardInstanceId)) return "battlefield";
      return null;
    }

    if (isGroupDrag) {
      // --- OBSŁUGA GRUPOWA ---
      const draggedCardsData = JSON.parse(
        e.dataTransfer.getData("text/json")
      ) as { cardId: string; from?: Zone }[]; // 'from' jest opcjonalne w typie

      // ✅ POPRAWKA: Pobieramy 'from' z głównego dataTransfer (tak jak robi to Battlefield)
      const fromRaw = e.dataTransfer.getData("from") as Zone | undefined;

      draggedCardsData.forEach((cardData) => {
        // ✅ POPRAWKA LOGIKI 'FROM': Priorytet ma 'fromRaw'.
        const detected = findCardZoneInPlayer(player, cardData.cardId);
        const safeFrom: Zone = fromRaw || detected || "hand"; // Priorytet: fromRaw > detected > hand

        // 🛡️ OCHRONA
        if (safeFrom === toZone) {
          console.warn("⛔ moveCard (group) z tej samej strefy pominięty:", { cardId: cardData.cardId, from: safeFrom, to: toZone });
          return;
        }

        moveCard(session.code, player.id, safeFrom, toZone, cardData.cardId);
      });

      clearSelectedCards();
    } else {
      // --- OBSŁUGA POJEDYNCZA ---
      const cardId = e.dataTransfer.getData("cardId");
      const fromRaw = e.dataTransfer.getData("from") as Zone | undefined;

      if (!cardId) {
        console.warn("⚠️ handleDrop bez cardId – pomijam event");
        return;
      }

      // ✅ POPRAWKA LOGIKI 'FROM': Priorytet dla 'fromRaw'
      const detected = findCardZoneInPlayer(player, cardId);
      const safeFrom: Zone = fromRaw || detected || "hand"; // Priorytet: fromRaw > detected > hand

      // 🛡️ OCHRONA
      if (safeFrom === toZone) {
        console.warn("⛔ moveCard (single) z tej samej strefy pominięty:", { cardId, from: safeFrom, to: toZone });
        return;
      }

      if (process.env.NODE_ENV === "development") {
        if (!fromRaw && !detected) console.warn("⚠️ Nie wykryto 'from' ani lokalnie. Użyto fallback 'hand'", { cardId, toZone });
      }

      moveCard(session.code, player.id, safeFrom, toZone, cardId);
    }
  };


  //--------------------------------------------------------------
  // Funkcje do CardPanel, zostają w Bottombar, bo używają sessionCode, player.id i moveCard
  const handleMoveToGraveyardAction = (cardId: string) => {
    if (isMoving) return; // 🛑 BLOKADA
    if (player && player.id === viewedPlayer?.id) {
      moveCard(sessionCode, player.id, "hand", "graveyard", cardId);
    }
  };

  const handleMoveToExileAction = (cardId: string) => {
    if (isMoving) return; // 🛑 BLOKADA
    if (player && player.id === viewedPlayer?.id) {
      moveCard(sessionCode, player.id, "hand", "exile", cardId);
    }
  };


  const handleMovetoTopofLibrary = (cardId: string) => {
    if (isMoving) return; // 🛑 BLOKADA
    if (player && player.id === viewedPlayer?.id) {
      moveCard(sessionCode, player.id, "hand", "library", cardId);
    }
  };
  
  const handleMovetoBottomofLibrary = (cardId: string) => {
    if (isMoving) return; // 🛑 BLOKADA
    if (player && player.id === viewedPlayer?.id) {
      // Dół biblioteki (toBottom: true)
      moveCard(sessionCode, player.id, "hand", "library", cardId, undefined, undefined, undefined, true); 
    }
  };


  const handleMoveToBattlefieldFlippedAction = (cardId: string) => {
    if (isMoving) return; // 🛑 BLOKADA
    if (player && player.id === viewedPlayer?.id) {
        // Zakładamy, że karta w panelu kontekstowym pochodzi z "hand"
        const fromZone: Zone = "hand";
        moveCardToBattlefieldFlipped(sessionCode, player.id, cardId, fromZone);
    }
  };
  // ------------------------------------------------------------------------------

  return (
    <>
      <div className={`bottom-bar ${getPlayerColorClass(player.id)}`} ref={bottomBarRef}>

        {/* Obszar RĘKI (Hand) - zostaje w Bottombar, bo jest szerszy i ma unikalny układ */}
       
        <div
          className="hand fixed-hand-width"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, "hand")}
        >
          {/* ✅ ZMIANA: Usunięto styl inline (style={{ color: "#fff", cursor: 'pointer' }}) 
            i zastąpiono go className="zone-label".
            Zachowano style={{ cursor: 'pointer' }}, ponieważ sama klasa .zone-label go nie nadaje.
            Zmieniono także typ 'HTMLDivElement' na 'HTMLSpanElement' dla spójności.
          */}
          <span
            id="hand-toggle"
            className="zone-label"
            onClick={toggleHandPanel as React.MouseEventHandler<HTMLSpanElement>}
            style={{ cursor: 'pointer' }}>
            Hand ({player?.hand.length ?? 0})
            {isHandPanelOpen ? ' ▲' : ' ▼'}
          </span>
          {/* Koniec zmian */}
          
          <div className="hand-cards">
            {/* ✅ ZMIANA: Dodajemy renderowanie warunkowe */}
            {player?.hand.length === 0 ? (
              // Jeśli ręka jest pusta, pokaż placeholder
              <div className="hand-empty-placeholder">
                Hand
              </div>
            ) : (
              // W przeciwnym razie, mapuj karty
              player.hand.map((c) => (
                <div
                  key={c.id}
                  style={{ position: 'relative' }}
                  draggable={!isMoving} 
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
              ))
            )}
          </div>



        </div>

        {/* Strefy (Library, Graveyard, Exile, Commander) 
          są teraz w komponencie <Zones /> i nie wymagają zmian 
        */}
        <Zones
          player={player}
          session={session}
          getPlayerColorClass={getPlayerColorClass}
          setDragOffset={setDragOffset}
          handleDrop={handleDrop}
          handleCardHover={handleCardHover}
          zoom={zoom}
          
          isLibraryPanelOpen={isLibraryPanelOpen}
          isGraveyardPanelOpen={isGraveyardPanelOpen}
          isExilePanelOpen={isExilePanelOpen}
          isLibraryTopRevealed={isLibraryTopRevealed}
          
          toggleLibraryPanel={toggleLibraryPanel}
          toggleGraveyardPanel={toggleGraveyardPanel}
          toggleExilePanel={toggleExilePanel}

          isMoving={isMoving} // 🛑 PRZEKAZUJEMY isMoving DO ZONES
        />
        {/* KONIEC WYDZIELONYCH ZON */}
        
      </div>





      {/* RENDEROWANIE PANELI */}

      {isHandPanelOpen && (
        <HandPanel
          onClose={() => setIsHandPanelOpen(false)}
          panelRef={handPanelRef}
          handleMoveAllCards={handleMoveAllCards}
          sortHand={sortHand}
          sessionCode={session.code}
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
          isTopRevealed={isLibraryTopRevealed}
          toggleTopRevealed={toggleLibraryTopRevealed}
          handleCardHover={handleCardHover}
          shuffle={shuffle}
          draw={draw}
        />
      )}

      {isGraveyardPanelOpen && (
        <GraveyardPanel
          sessionCode={session.code}
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
          sessionCode={session.code}
          playerId={player.id}
          onClose={() => setIsExilePanelOpen(false)}
          panelRef={exilePanelRef}
          toggleExileViewer={toggleExileViewer}
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
          moveCardToBottomOfLibrary={handleMovetoBottomofLibrary}
          moveCardToBattlefieldFlipped={handleMoveToBattlefieldFlippedAction}
        />
      )}
    </>
  );
}