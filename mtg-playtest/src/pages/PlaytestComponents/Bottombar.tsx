// Bottombar.tsx
import React, { useState, useRef, useEffect, useCallback, type DragEvent } from "react";
import Zones from "./Zones"; 
import Card from "../../components/Card";
import type { Player, Zone, Session, CardType, SortCriteria } from "../../components/types";
import "./../Playtest.css";
import "./Bottombar.css";
import { HandPanel } from "./panels/HandPanel";
import { LibraryPanel, type LibraryPanelProps } from "./panels/LibraryPanel";
import { GraveyardPanel, type GraveyardPanelProps } from "./panels/GraveyardPanel";
import { ExilePanel, type ExilePanelProps } from "./panels/ExilePanel";
import { CardPanel, type CardPanelProps } from "./panels/CardPanel";

// --- INTERFEJS PROPSÓW ---
interface PanelProps {
  onClose: () => void;
  panelRef: React.RefObject<HTMLDivElement | null>;
}

interface BottombarProps {
  player: Player | undefined; // 'Ty' (gracz lub undefined dla widza)
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
  viewedPlayer: Player | null | undefined; // Gracz, którego oglądasz
  handleMoveAllCards: (from: Zone, to: Zone) => void;
  zoom: number;
  sortHand: (code: string, playerId: string, criteria: SortCriteria) => void;
  moveAllCardsToBottomOfLibrary: (code: string, playerId: string, from: Zone) => void;
  discardRandomCard: (code: string, playerId: string) => void;
  shuffle: (code: string, playerId: string) => void;
  draw: (code: string, playerId: string, count: number) => void;
  moveCardToBattlefieldFlipped: (code: string, playerId: string, cardId: string, from: Zone) => void
  isMoving: boolean;
}

export type { PanelProps, LibraryPanelProps, GraveyardPanelProps, ExilePanelProps, CardPanelProps };

export default function Bottombar({
  player, // 'Ty' (localPlayer)
  session,
  sessionCode,
  viewedPlayer, // Gracz, którego oglądasz
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
  isMoving,
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

  // ✅ POPRAWKA WIDZA: Sprawdź, czy jesteś właścicielem oglądanego gracza
  const isOwner = player?.id === viewedPlayer?.id;

  const closeAllPanels = useCallback(() => {
    setIsHandPanelOpen(false);
    setIsLibraryPanelOpen(false);
    setIsGraveyardPanelOpen(false);
    setIsExilePanelOpen(false);
    setIsCardPanelOpen(false);
    setPanelDirection('up');
  }, []);

  const toggleLibraryTopRevealed = () => {
    if (isLibraryTopRevealed) {
      handleCardHover(null);
    } else if (viewedPlayer && viewedPlayer.library.length > 0) { // ✅ Użyj 'viewedPlayer'
      handleCardHover(viewedPlayer.library[0]); 
    }
    setIsLibraryTopRevealed(prev => !prev);
  };

  const handleCardContextMenu = (e: React.MouseEvent<HTMLDivElement>, card: CardType) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMoving) return;
    if (!isOwner) return; // ✅ Blokada dla widza

    if (isCardPanelOpen && selectedCardForPanel?.id === card.id) {
      setIsCardPanelOpen(false);
    } else {
      // ... (reszta logiki panelu kontekstowego - jest poprawna)
      closeAllPanels();
      const rect = e.currentTarget.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const middlePoint = viewportHeight / 2;
      const cardCenterY = rect.top + rect.height / 2;
      let direction: 'up' | 'down';
      let finalY: number;
      const OFFSET = 10;
      if (cardCenterY > middlePoint) {
        direction = 'up';
        finalY = rect.top - OFFSET;
      } else {
        direction = 'down';
        finalY = rect.bottom + OFFSET;
      }
      setPanelPosition({ x: rect.left + rect.width / 2, y: finalY });
      setPanelDirection(direction);
      setSelectedCardForPanel(card);
      setIsCardPanelOpen(true);
    }
  };

  // --- LOGIKA PRZEŁĄCZANIA PANELI (przekazana do Zones) ---
  // ✅ POPRAWKA: Te akcje są dozwolone dla widzów, ale panele otworzą się tylko dla 'isOwner'
  const toggleHandPanel = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    if (isHandPanelOpen) {
      setIsHandPanelOpen(false);
    } else {
      closeAllPanels();
      setIsHandPanelOpen(true); // Otworzy się tylko, jeśli 'isOwner' jest true (w logice renderowania)
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
  const panelStates = { isHandPanelOpen, isLibraryPanelOpen, isGraveyardPanelOpen, isExilePanelOpen, isCardPanelOpen };

  const handleClickOutside = useCallback((event: globalThis.MouseEvent) => {
    const panelToggleSelectors = ['#hand-toggle', '#library-toggle', '#graveyard-toggle', '#exile-toggle'];
    const targetNode = event.target as HTMLElement;
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
  }, [handleClickOutside]);

  // ✅ POPRAWKA: Główny warunek renderowania, używamy 'viewedPlayer'
  if (!viewedPlayer || !session) return null;

  // Funkcja 'handleDrop' (poprawiona w poprzednim kroku, używa 'player' do wysłania, co jest poprawne)
  const handleDrop = (e: DragEvent<HTMLDivElement>, toZone: Zone) => {
    e.preventDefault();
    if (isMoving) return;
    if (!isOwner) return; // ✅ Blokada Drop dla widza

    // (reszta logiki handleDrop - jest poprawna, bo używa 'player.id' dla moveCard)
    const isGroupDrag = e.dataTransfer.types.includes("text/json");

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
      const draggedCardsData = JSON.parse(e.dataTransfer.getData("text/json")) as { cardId: string; from?: Zone }[];
      const fromRaw = e.dataTransfer.getData("from") as Zone | undefined;
      draggedCardsData.forEach((cardData) => {
        const detected = findCardZoneInPlayer(player, cardData.cardId);
        const safeFrom: Zone = fromRaw || detected || "hand"; 
        if (safeFrom === toZone) {
          console.warn("⛔ moveCard (group) z tej samej strefy pominięty:", { cardId: cardData.cardId, from: safeFrom, to: toZone });
          return;
        }
        moveCard(session.code, player!.id, safeFrom, toZone, cardData.cardId);
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
      const safeFrom: Zone = fromRaw || detected || "hand"; 
      if (safeFrom === toZone) {
        console.warn("⛔ moveCard (single) z tej samej strefy pominięty:", { cardId, from: safeFrom, to: toZone });
        return;
      }
      if (process.env.NODE_ENV === "development") {
        if (!fromRaw && !detected) console.warn("⚠️ Nie wykryto 'from' ani lokalnie. Użyto fallback 'hand'", { cardId, toZone });
      }
      moveCard(session.code, player!.id, safeFrom, toZone, cardId);
    }
  };


  // Funkcje do CardPanel (działają tylko jeśli 'isOwner' jest true)
  const handleMoveToGraveyardAction = (cardId: string) => {
    if (isMoving || !isOwner) return; 
    if (player && player.id === viewedPlayer?.id) {
      moveCard(sessionCode, player.id, "hand", "graveyard", cardId);
    }
  };
  const handleMoveToExileAction = (cardId: string) => {
    if (isMoving || !isOwner) return; 
    if (player && player.id === viewedPlayer?.id) {
      moveCard(sessionCode, player.id, "hand", "exile", cardId);
    }
  };
  const handleMovetoTopofLibrary = (cardId: string) => {
    if (isMoving || !isOwner) return; 
    if (player && player.id === viewedPlayer?.id) {
      moveCard(sessionCode, player.id, "hand", "library", cardId);
    }
  };
  const handleMovetoBottomofLibrary = (cardId: string) => {
    if (isMoving || !isOwner) return; 
    if (player && player.id === viewedPlayer?.id) {
      moveCard(sessionCode, player.id, "hand", "library", cardId, undefined, undefined, undefined, true); 
    }
  };
  const handleMoveToBattlefieldFlippedAction = (cardId: string) => {
    if (isMoving || !isOwner) return; 
    if (player && player.id === viewedPlayer?.id) {
        const fromZone: Zone = "hand";
        moveCardToBattlefieldFlipped(sessionCode, player.id, cardId, fromZone);
    }
  };
  // ------------------------------------------------------------------------------

  return (
    <>
      {/* ✅ POPRAWKA: Używamy koloru 'viewedPlayer' dla ramki */}
      <div className={`bottom-bar ${getPlayerColorClass(viewedPlayer.id)}`} ref={bottomBarRef}>

        <div
          className="hand fixed-hand-width"
          onDragOver={(e) => isOwner && e.preventDefault()} // ✅ Blokada Drop
          onDrop={(e) => isOwner && handleDrop(e, "hand")} // ✅ Blokada Drop
        >
          <span
            id="hand-toggle"
            className="zone-label"
            onClick={toggleHandPanel as React.MouseEventHandler<HTMLSpanElement>}
            style={{ cursor: 'pointer' }}>
            {/* ✅ POPRAWKA: Pokazuj rękę 'viewedPlayer' */}
            Hand ({viewedPlayer?.hand.length ?? 0})
            {isHandPanelOpen ? ' ▲' : ' ▼'}
          </span>
          
          <div className="hand-cards">
            {/* ✅ POPRAWKA: Pokazuj karty 'viewedPlayer' */}
            {viewedPlayer?.hand.length === 0 ? (
              <div className="hand-empty-placeholder">
                Hand
              </div>
            ) : (
              viewedPlayer.hand.map((c) => (
                <div
                  key={c.id}
                  style={{ position: 'relative' }}
                  draggable={!isMoving && isOwner} // ✅ Blokada Drag dla widza
                  onDragStart={(e) => {
                    if (!isOwner) { // ✅ Zabezpieczenie
                      e.preventDefault();
                      return;
                    }
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
                  onContextMenu={(e) => handleCardContextMenu(e, c)} // Już zabezpieczone przez 'isOwner'
                >
                  <Card
                    card={c}
                    from="hand"
                    ownerId={viewedPlayer.id} // ✅ Pokazuj kolor właściciela
                    getPlayerColorClass={getPlayerColorClass}
                    zoom={zoom}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        <Zones
          player={viewedPlayer} // ✅ Przekaż 'viewedPlayer'
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
          isMoving={isMoving} 
          isOwner={isOwner} // ✅ Przekaż 'isOwner' do Zones
        />
        
      </div>

      {/* ✅ POPRAWKA: Renderuj panele tylko jeśli jesteś WŁAŚCICIELEM */}
      {isOwner && player && (
        <>
          {isHandPanelOpen && (
            <HandPanel
              onClose={() => setIsHandPanelOpen(false)}
              panelRef={handPanelRef}
              handleMoveAllCards={handleMoveAllCards}
              sortHand={sortHand}
              sessionCode={session.code}
              playerId={player.id} // Używamy ID gracza (właściciela)
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
              player={player} // Używamy gracza
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
      )}
    </>
  );
}