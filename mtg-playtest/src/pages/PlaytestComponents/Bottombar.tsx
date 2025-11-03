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


function findCardZoneInPlayer(player: Player | undefined, cardId: string): Zone | null {
  if (!player || !cardId) return null;
  if (player.hand.some(c => c.id === cardId)) return "hand";
  if (player.library.some(c => c.id === cardId)) return "library";
  if (player.graveyard.some(c => c.id === cardId)) return "graveyard";
  if (player.exile.some(c => c.id === cardId)) return "exile";
  if (player.sideboard.some(c => c.id === cardId)) return "sideboard";
  if (player.commanderZone.some(c => c.id === cardId)) return "commanderZone";
  if (player.battlefield.some(f => f.id === cardId)) return "battlefield";
  if (player.battlefield.some(f => f.card.id === cardId)) return "battlefield";
  return null;
}

// NOWA, BEZPIECZNA wersja handleDrop
const handleDrop = (e: DragEvent<HTMLDivElement>, toZone: Zone) => {
  e.preventDefault();

  if (isMoving) { // 🛑 BLOKUJEMY DROP, JEŚLI KARTA SIĘ PRZEMIESZCZA
    return;
  }
  
  const isGroupDrag = e.dataTransfer.types.includes("text/json");

  if (process.env.NODE_ENV === "development") {
    console.log("📥 handleDrop ->", { toZone, isGroupDrag });
  }

  if (isGroupDrag) {
    const draggedCardsData = JSON.parse(
      e.dataTransfer.getData("text/json")
    ) as { cardId: string; from?: Zone }[];

    draggedCardsData.forEach((cardData) => {
      const detected = findCardZoneInPlayer(player, cardData.cardId);
      const safeFrom: Zone = detected || cardData.from || "hand";

      // 🛡️ OCHRONA przed duplikatem (z tej samej strefy)
      if (safeFrom === toZone) {
        console.warn("⛔ moveCard z tej samej strefy pominięty:", {
          cardId: cardData.cardId,
          from: safeFrom,
          to: toZone,
        });
        return;
      }

      if (process.env.NODE_ENV === "development") {
        if (!detected) console.warn("⚠️ Nie znaleziono strefy lokalnie dla", cardData.cardId);
        if (cardData.from && cardData.from !== detected) {
          console.warn("🚨 Rozbieżność from (dataTransfer vs local)", {
            cardId: cardData.cardId,
            dataFrom: cardData.from,
            detected,
          });
        }
      }

      moveCard(session.code, player.id, safeFrom, toZone, cardData.cardId);
    });

    clearSelectedCards();
  } else {
    const cardId = e.dataTransfer.getData("cardId");
    const fromRaw = e.dataTransfer.getData("from") as Zone | undefined;

    if (!cardId) {
      console.warn("⚠️ handleDrop bez cardId – pomijam event");
      return;
    }

    const detected = findCardZoneInPlayer(player, cardId);
    const safeFrom: Zone = detected || fromRaw || "hand";

    // 🛡️ OCHRONA przed duplikatem
    if (safeFrom === toZone) {
      console.warn("⛔ moveCard z tej samej strefy pominięty:", {
        cardId,
        from: safeFrom,
        to: toZone,
      });
      return;
    }

    if (process.env.NODE_ENV === "development") {
      if (!detected) console.warn("⚠️ Nie wykryto lokalnie strefy karty:", { cardId, fromRaw, toZone });
      if (fromRaw && detected && fromRaw !== detected) {
        console.warn("🚨 Rozbieżność between fromRaw and detected:", { cardId, fromRaw, detected });
      }
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
                draggable={!isMoving} // 🛑 BLOKUJEMY PRZECIĄGANIE
                onDragStart={(e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    // Używamy ID instancji karty, jeśli jest dostępne (c.id jest zakładane jako unikalne)
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

{/* WYDZIELONE ZONY (Zones) - PO ZMIANACH */}
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
// ... panele nie wymagają blokowania, bo ich akcje (np. sortowanie)
// nie są blokowane przez isMoving, a akcje ruchu są blokowane na poziomie funkcji.
// ...

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