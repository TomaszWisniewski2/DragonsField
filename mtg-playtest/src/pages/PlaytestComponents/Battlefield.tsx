// src/pages/PlaytestComponents/Battlefield.tsx

import React, { type DragEvent, useState, useEffect, type MouseEvent, useRef } from "react";
// Upewnij się, że CardOnField i CardType są poprawnie zaimportowane
import type { Player, CardOnField, Zone, CardType, TokenData } from "../../components/types";
import Card from "../../components/Card";
import "./../Playtest.css";

// --- 1. IMPORTUJ KOMPONENT PANELU ---
import {
  BattlefieldCardPanel,
} from "./panels/BattlefieldCardPanel"; // Dostosuj ścieżkę


// --- GŁÓWNY KOMPONENT BATTLEFIELD ---

interface BattlefieldProps {
  cardOnField?: CardOnField;
  viewedPlayer: Player | null | undefined;
  viewedPlayerId: string | null;
  dragOffset: { x: number; y: number };
  zoom: number;
  shuffleMessage: string;
  getPlayerColorClass: (id: string) => string;
  moveCard: (
    code: string,
    playerId: string,
    from: Zone,
    to: Zone,
    cardId: string,
    x?: number,
    y?: number
  ) => void;
  player: Player | undefined;
  setDragOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  sessionCode: string;
  rotateCard: (code: string, playerId: string, cardId: string) => void;
  rotateCard180: (code: string, playerId: string, cardId: string) => void;
  setSelectedCards: (cards: CardType[]) => void;
  selectedCards: CardType[];
  playerColorClass: string;
  handleCardHover: (card: CardType | null) => void;
  incrementCardStats: (code: string, playerId: string, cardId: string) => void;
  decreaseCardCounters: (code: string, playerId: string, cardId: string) => void;
  // PROP DLA LICZNIKÓW
  incrementCardCounters: (code: string, playerId: string, cardId: string) => void;
  // FUNKCJA USTAWIAJĄCA STATYSTYKI
  setCardStats: (code: string, playerId: string, cardId: string, powerValue: number, toughnessValue: number) => void;
  flipCard: (code: string, playerId: string, cardId: string) => void;
  onCreateToken: (tokenData: TokenData) => void;
  cloneCard: (code: string, playerId: string, cardId: string) => void
}

export default function Battlefield({
  //cardOnField,
  viewedPlayer,
  viewedPlayerId,
  dragOffset,
  zoom,
  getPlayerColorClass,
  moveCard,
  player,
  setDragOffset,
  sessionCode,
  rotateCard,
  shuffleMessage,
  setSelectedCards,
  selectedCards,
  playerColorClass,
  handleCardHover,
  incrementCardStats,
  decreaseCardCounters,
  // ODBIERAMY PROP
  incrementCardCounters,
  setCardStats,
  rotateCard180,
  flipCard,
  onCreateToken,
  cloneCard,
}: BattlefieldProps) {
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const battlefieldRef = useRef<HTMLDivElement>(null);

  const [isDraggingGroup, setIsDraggingGroup] = useState(false);
  const [draggedCards, setDraggedCards] = useState<CardOnField[]>([]);

  // --- ZMIENIONE STANY DLA CARDPANEL NA POLU BITWY ---
  const [isCardPanelOpen, setIsCardPanelOpen] = useState(false);
  // Przechowujemy CardOnField, które zawiera aktualne statystyki i unikalne ID pola bitwy
  const [selectedFieldCardForPanel, setSelectedFieldCardForPanel] = useState<CardOnField | null>(null);
  const [panelPosition, setPanelPosition] = useState<{ x: number, y: number } | null>(null);
  const [panelDirection, setPanelDirection] = useState<'up' | 'down'>('up');
  const cardPanelRef = useRef<HTMLDivElement>(null);

  // ------------------------------------------

  const closeCardPanel = () => {
    setIsCardPanelOpen(false);
    setSelectedFieldCardForPanel(null); // Używamy nowego stanu
    setPanelPosition(null);
    setPanelDirection('up');
  }

  const handleCardContextMenu = (e: MouseEvent<HTMLDivElement>, cardOnField: CardOnField) => {
    e.preventDefault();
    e.stopPropagation();

    if (viewedPlayerId !== null) return;

    // Porównujemy po ID CardOnField
    if (isCardPanelOpen && selectedFieldCardForPanel?.id === cardOnField.id) {
      closeCardPanel();
    } else {
      setIsSelecting(false);
      setSelectionRect(null);

      const rect = e.currentTarget.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const middlePoint = viewportHeight / 2;

      // Stały odstęp od krawędzi karty
      const OFFSET = 10;

      let finalY: number;
      let direction: 'up' | 'down';

      // Logika określania kierunku otwierania panelu
      if (rect.bottom < middlePoint) {
        // Karta jest w GÓRNEJ połowie ekranu -> Panel otwiera się W DÓŁ
        direction = 'down';
        finalY = rect.bottom + OFFSET;
      } else {
        // Karta jest w DOLNEJ połowie ekranu -> Panel otwiera się W GÓRĘ
        direction = 'up';
        finalY = rect.top - OFFSET;
      }

      setPanelPosition({
        x: rect.left + rect.width / 2, // Zawsze centrujemy w poziomie
        y: finalY
      });
      setPanelDirection(direction);
      // Ustawiamy CAŁY obiekt CardOnField
      setSelectedFieldCardForPanel(cardOnField);
      setIsCardPanelOpen(true);
    }
  };

  // --- FUNKCJE AKCJI DLA PANELU (używają ID z CardOnField) ---

  // 2. NOWA FUNKCJA AKCJI DO ODRWRACANIA KARTY
  const handleFlipCardAction = (cardId: string) => {
    // Sprawdzamy, czy karta ma drugą stronę (dla bezpieczeństwa, choć przycisk w panelu powinien to już sprawdzić)
    const card = selectedFieldCardForPanel?.card;
    if (player && player.id === viewedPlayer?.id && card?.hasSecondFace) {
      flipCard(sessionCode, player.id, cardId);
    }
    // Nie zamykamy panelu, żeby użytkownik mógł łatwo odwrócić z powrotem.
  };

  const handleRotationAction = (cardId: string) => {
    if (player && player.id === viewedPlayer?.id) {
      rotateCard(sessionCode, player.id, cardId);
    }
  };

  const handleRotation180Action = (cardId: string) => {
    if (player && player.id === viewedPlayer?.id) {
      rotateCard180(sessionCode, player.id, cardId);
    }
  };

  const handleMoveToGraveyardAction = (cardId: string) => {
    if (player && player.id === viewedPlayer?.id) {
      moveCard(sessionCode, player.id, "battlefield", "graveyard", cardId);
    }
  };

  const handleMoveToHandAction = (cardId: string) => {
    if (player && player.id === viewedPlayer?.id) {
      moveCard(sessionCode, player.id, "battlefield", "hand", cardId);
    }
  };

  const handleMoveToExileAction = (cardId: string) => {
    if (player && player.id === viewedPlayer?.id) {
      moveCard(sessionCode, player.id, "battlefield", "exile", cardId);
    }
  };

  const handleMovetoTopofLibrary = (cardId: string) => {
    if (player && player.id === viewedPlayer?.id) {
      moveCard(sessionCode, player.id, "battlefield", "library", cardId);
    }
  };


  const handleSetCardStatsAction = (powerValue: number, toughnessValue: number) => {
    // Używamy ID z CardOnField
    if (player && player.id === viewedPlayer?.id && selectedFieldCardForPanel) {
      setCardStats(sessionCode, player.id, selectedFieldCardForPanel.id, powerValue, toughnessValue);
      closeCardPanel(); // Zamykamy panel po ustawieniu statystyk
    }
  };

  // --- EFFECT HOOKS ---

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Sprawdzenie, czy bieżący gracz i przeglądany gracz są tym samym graczem
    if (!player || player.id !== viewedPlayer?.id) {
      return;
    }

    if (e.key === 't') {
      if (selectedCards.length > 0) {
        selectedCards.forEach(card => {
          // WAŻNE: W selectedCards masz CardType, ale rotateCard oczekuje ID CardOnField.
          // Musisz mieć pewność, że w selectedCards masz ID CardOnField, 
          // lub znaleźć CardOnField na podstawie CardType.id.
          // Zakładamy, że w Twoim kodzie logika rotacji działa poprawnie 
          // (lub że 'card.id' w selectedCards to już ID CardOnField).
          // Zostawiamy jak jest dla 't' dla spójności z Twoim oryginalnym kodem.
          rotateCard(sessionCode, player.id, card.id);
        });
      } else if (hoveredCardId) {
        // hoveredCardId JEST CardOnField ID
        rotateCard(sessionCode, player.id, hoveredCardId);
      }
    } 
    
    // 💡 NOWA OBSŁUGA KLAWISZA 'X' DLA KLONOWANIA
    if (e.key === 'x') {
      // Wyszukanie odpowiednich CardOnField, aby pobrać ich unikalne ID pola bitwy (CardOnField.id)
      
      const cardIdsToClone: string[] = [];
      
      if (selectedCards.length > 0) {
        // Jeśli zaznaczono wiele kart, musimy znaleźć ich ID na polu bitwy (CardOnField.id).
        // W selectedCards masz CardType. Zakładamy, że szukasz kart na polu bitwy.
        // To jest newralgiczny punkt, ponieważ CardType może być taki sam dla wielu kart na polu.
        // Najprostszym, ale potencjalnie niepoprawnym (zależnie od implementacji) 
        // sposobem jest użycie ID CardType:
        // selectedCards.forEach(card => cardIdsToClone.push(card.id));
        
        // LEPSZY SPOSÓB (zakłada, że masz dostęp do CardOnField i możesz je przefiltrować):
        const fieldCards = viewedPlayer.battlefield;
        
        // Zbieramy unikalne ID CardOnField dla zaznaczonych CardType
        fieldCards.forEach(fieldCard => {
          if (selectedCards.some(selectedCard => selectedCard.id === fieldCard.card.id)) {
            // Dodajemy CardOnField ID
            cardIdsToClone.push(fieldCard.id); 
          }
        });
        
        // UWAGA: Powyższy kod sklonuje WSZYSTKIE karty DANEGO TYPU, 
        // jeśli tylko JEDNA z nich jest zaznaczona w `selectedCards`.
        // Jeśli `selectedCards` przechowuje ID CardOnField, to użyj po prostu:
        // selectedCards.forEach(card => cardIdsToClone.push(card.id)); 
        // *Ponieważ w Twoim kodzie dla 't' używasz 'card.id', zakładam, że selectedCards 
        // powinno zawierać ID CardOnField, a nie CardType. 
        // Jeśli tak nie jest, może być błąd w sposobie, w jaki ustawiasz selectedCards.*
        
        // Dla uproszczenia (zgodnego z Twoim użyciem 't'), użyjmy:
        selectedCards.forEach(card => cardIdsToClone.push(card.id)); 

      } else if (hoveredCardId) {
        // Karta najechana - mamy jej unikalne ID na polu bitwy
        cardIdsToClone.push(hoveredCardId); 
      }
      
      // Wykonanie klonowania
      cardIdsToClone.forEach(cardIdToClone => {
        if (cardIdToClone) {
          cloneCard(sessionCode, player.id, cardIdToClone); 
        }
      });
    }

    // ... pozostały kod handleKeyDown (jeśli istnieje) ...
  };

  const handleClickOutside = (event: MouseEvent | globalThis.MouseEvent) => {
    const targetNode = event.target as Node;
    if (isCardPanelOpen && cardPanelRef.current && !cardPanelRef.current.contains(targetNode)) {
      closeCardPanel();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  document.addEventListener("mousedown", handleClickOutside as (event: globalThis.MouseEvent) => void);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener("mousedown", handleClickOutside as (event: globalThis.MouseEvent) => void);
  };
}, [player, viewedPlayer, hoveredCardId, rotateCard, sessionCode, selectedCards, isCardPanelOpen, cloneCard]); // Dodano cloneCard do zależności

  // --- OBSŁUGA ZAZNACZANIA MYSZKĄ ---

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    closeCardPanel();

    if (e.target === e.currentTarget && battlefieldRef.current) {
      setIsSelecting(true);
      const rect = battlefieldRef.current.getBoundingClientRect();
      setStartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setSelectedCards([]);
      setSelectionRect({ x: e.clientX - rect.left, y: e.clientY - rect.top, width: 0, height: 0 });
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isSelecting && battlefieldRef.current) {
      const rect = battlefieldRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const x1 = Math.min(startPos.x, currentX);
      const y1 = Math.min(startPos.y, currentY);
      const width = Math.abs(currentX - startPos.x);
      const height = Math.abs(currentY - startPos.y);

      setSelectionRect({ x: x1, y: y1, width: width, height: height });

      const selectionRectInField = new DOMRect(x1, y1, width, height);

      const cardElements = document.querySelectorAll('.card-on-field');
      const cardsInSelection: CardType[] = [];

      cardElements.forEach(cardEl => {
        const htmlCardEl = cardEl as HTMLElement;
        const cardLeft = htmlCardEl.offsetLeft;
        const cardTop = htmlCardEl.offsetTop;
        const cardRectInField = new DOMRect(cardLeft, cardTop, htmlCardEl.offsetWidth, htmlCardEl.offsetHeight);

        if (
          selectionRectInField.left < cardRectInField.right &&
          selectionRectInField.right > cardRectInField.left &&
          selectionRectInField.top < cardRectInField.bottom &&
          selectionRectInField.bottom > cardRectInField.top
        ) {
          // WAŻNE: W selectedCards chcemy przechowywać CardType, nie ID CardOnField
          const cardId = htmlCardEl.getAttribute('data-card-id');
          const foundCard = viewedPlayer?.battlefield.find(c => c.id === cardId)?.card;
          if (foundCard) {
            cardsInSelection.push(foundCard);
          }
        }
      });
      setSelectedCards(cardsInSelection);
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    setSelectionRect(null);
  };

  // --- OBSŁUGA DRAG & DROP ---
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

const handleDrop = (e: DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  if (!battlefieldRef.current || !player) return;

  const dropZoneRect = battlefieldRef.current.getBoundingClientRect();
  const isToken = e.dataTransfer.getData("isToken");

  // ----------------------------------------------------
  // 1. OBSŁUGA UPUSZCZENIA TOKENU Z TokenViewer
  // ----------------------------------------------------
  if (isToken === "true") {
    const tokenDataString = e.dataTransfer.getData("tokenData");
    if (tokenDataString) {
      try {
        const tokenData: TokenData = JSON.parse(tokenDataString);
        onCreateToken(tokenData);
        return;
      } catch (error) {
        console.error("❌ Błąd parsowania danych tokenu:", error);
        return;
      }
    }
  }

  // ----------------------------------------------------
  // 2. WSPÓLNE USTAWIENIA DLA POZYCJI I SKALOWANIA
  // ----------------------------------------------------
  const baseCardWidth = 150;
  const baseCardHeight = 210;
  const scaledCardWidth = baseCardWidth * (zoom / 140);
  const scaledCardHeight = baseCardHeight * (zoom / 140);
  const targetPlayerId = viewedPlayer?.id || player.id;
  if (!targetPlayerId) return;

  const baseX = e.clientX - dropZoneRect.left - dragOffset.x;
  const baseY = e.clientY - dropZoneRect.top - dragOffset.y;

  const clamp = (val: number, min: number, max: number) =>
    Math.max(min, Math.min(max, val));

  const clamped = (x: number, y: number) => ({
    x: clamp(x, 0, dropZoneRect.width - scaledCardWidth),
    y: clamp(y, 0, dropZoneRect.height - scaledCardHeight),
  });

  // ----------------------------------------------------
  // 3. OBSŁUGA GRUPOWEGO PRZENOSZENIA KART
  // ----------------------------------------------------
  const isGroupDrag = e.dataTransfer.types.includes("text/json");
  if (isGroupDrag) {
    const draggedCardsData = JSON.parse(
      e.dataTransfer.getData("text/json")
    ) as { cardId: string; x?: number; y?: number }[];

    const fromRaw = e.dataTransfer.getData("from") as Zone | undefined;
    const baseFrom = fromRaw || "hand";

    draggedCardsData.forEach((cardData, index) => {
      const localZone = findCardZoneInPlayer(player, cardData.cardId);
      const safeFrom: Zone = localZone || baseFrom;

      if (process.env.NODE_ENV === "development" && !localZone) {
        console.warn("⚠️ BattlefieldDrop: Nie znaleziono lokalnie strefy źródłowej dla", cardData.cardId, "używam fallback:", safeFrom);
      }

      const offset = clamped(baseX + index * 20, baseY + index * 20);
      moveCard(sessionCode, targetPlayerId, safeFrom, "battlefield", cardData.cardId, offset.x, offset.y);
    });

    setSelectedCards([]);
    setDraggedCards([]);
    setIsDraggingGroup(false);
    return;
  }

  // ----------------------------------------------------
  // 4. POJEDYNCZE PRZENOSZENIE KARTY
  // ----------------------------------------------------
  const cardId = e.dataTransfer.getData("cardId");
  if (!cardId) {
    console.warn("⚠️ handleDrop: Brak cardId, pomijam drop event");
    return;
  }

  const fromRaw = e.dataTransfer.getData("from") as Zone | undefined;
  const detected = findCardZoneInPlayer(player, cardId);
  const safeFrom: Zone = detected || fromRaw || "hand";

  if (process.env.NODE_ENV === "development") {
    if (!detected) console.warn("⚠️ BattlefieldDrop: Nie znaleziono strefy źródłowej lokalnie dla", cardId);
    if (fromRaw && detected && fromRaw !== detected) {
      console.warn("🚨 BattlefieldDrop: Rozbieżność między fromRaw i detected", {
        cardId,
        fromRaw,
        detected,
      });
    }
  }

  const { x: finalX, y: finalY } = clamped(baseX, baseY);

  // Jeśli przenosisz w obrębie battlefield — pozycjonowanie
  if (safeFrom === "battlefield") {
    moveCard(sessionCode, targetPlayerId, "battlefield", "battlefield", cardId, finalX, finalY);
  } else {
    moveCard(sessionCode, targetPlayerId, safeFrom, "battlefield", cardId, finalX, finalY);
  }
};


//--------------------------------------------------------------------------------------------------------------------------------------------------------------------
  const handleDragStart = (e: DragEvent<HTMLDivElement>, card: CardOnField) => {
    if (viewedPlayerId !== null) return;

    closeCardPanel();

    const rect = e.currentTarget.getBoundingClientRect();
    const isSelected = selectedCards.some(c => c.id === card.card.id);

    if (isSelected && selectedCards.length > 1) {
      setIsDraggingGroup(true);
      const draggedCardsWithPos = viewedPlayer?.battlefield
        .filter(c => selectedCards.some(selectedC => selectedC.id === c.card.id))
        .map(c => ({
          cardId: c.id,
          x: c.x,
          y: c.y,
          cardType: c.card
        })) || [];

      e.dataTransfer.setData("text/json", JSON.stringify(draggedCardsWithPos));
      e.dataTransfer.setData("from", "battlefield");
      e.dataTransfer.setDragImage(e.currentTarget, e.clientX - rect.left, e.clientY - rect.top);
      e.dataTransfer.effectAllowed = "move";
    } else {
      setIsDraggingGroup(false);
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      e.dataTransfer.setData("cardId", card.id); // ID CardOnField
      e.dataTransfer.setData("from", "battlefield");
      e.dataTransfer.effectAllowed = "move";
    }
  };

  // --- AKCJE BEZPOŚREDNIE NA KARCIE (używają ID CardOnField) ---

  const handleCardRotation = (cardId: string) => {
    if (player && player.id === viewedPlayer?.id) {
      rotateCard(sessionCode, player.id, cardId);
    }
  };

  const handleCardStatsClick = (cardId: string) => {
    if (player && player.id === viewedPlayer?.id) {
      incrementCardStats(sessionCode, player.id, cardId);
    }
  };

  const handleDecreaseCardStatsClick = (cardId: string) => {
    if (player && player.id === viewedPlayer?.id) {
      decreaseCardCounters(sessionCode, player.id, cardId);
    }
  };

  // NOWA FUNKCJA AKCJI DLA LICZNIKÓW
  const handleCardCounterClick = (cardId: string) => {
    if (player && player.id === viewedPlayer?.id) {
      incrementCardCounters(sessionCode, player.id, cardId);
    }
  };

 // 🌟 POPRAWIONA FUNKCJA AKCJI DLA KLONOWANIA
 const handleCloneCardAction = (cardId: string) => {
  // cardId to ID CardOnField przekazane z panelu
  if (player && player.id === viewedPlayer?.id) {
   // Wywołujemy prop cloneCard z poprawnymi argumentami
   cloneCard(sessionCode, player.id, cardId);
  }
  //closeCardPanel(); // Zamykamy panel po sklonowaniu
 };

  if (!viewedPlayer) return null;

  return (
    <div className="battlefield">
      {shuffleMessage && (
        <div className="shuffle-message-container">
          <span className="shuffle-message">{shuffleMessage}</span>
        </div>
      )}

      <div
        ref={battlefieldRef}
        className={`battlefield-area ${getPlayerColorClass(viewedPlayer.id)}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => {
          e.preventDefault();
          closeCardPanel();
        }}
      >
        {viewedPlayer.battlefield.map((c: CardOnField) => (
          <div
            key={c.id}
            className={`card-on-field ${getPlayerColorClass(viewedPlayer.id)} ${selectedCards.some(card => card.id === c.card.id) ? 'selected' : ''}`}
            data-card-id={c.id}
            onMouseEnter={() => {
              setHoveredCardId(c.id); // Ustawiamy ID CardOnField
              handleCardHover(c.card);
            }}
            onMouseLeave={() => {
              setHoveredCardId(null);
              handleCardHover(null);
            }}
            style={{
              position: "absolute",
              left: c.x,
              top: c.y,
              cursor: viewedPlayerId === null ? "grab" : "default",
              transform: `scale(${zoom / 100}) rotate(${c.rotation}deg)`,
              transformOrigin: 'center center',
              zIndex: selectedCards.some(card => card.id === c.card.id) ? 10 : 5
            }}
            draggable={viewedPlayerId === null}
            onDragStart={(e) => handleDragStart(e, c)}
            onDoubleClick={() => handleCardRotation(c.id)}
            onContextMenu={(e) => handleCardContextMenu(e, c)}
          >
            <Card
              card={c.card}
              from="battlefield"
              ownerId={viewedPlayer.id}
              getPlayerColorClass={getPlayerColorClass}
              onCardStatsClick={handleCardStatsClick}

              onCardCounterClick={handleCardCounterClick}
              cardOnField={c}
            />
          </div>
        ))}

        {selectionRect && (
          <div
            className={`selection-box ${playerColorClass}`}
            style={{
              left: selectionRect.x,
              top: selectionRect.y,
              width: selectionRect.width,
              height: selectionRect.height,
              position: 'absolute',
              zIndex: 2,
            }}
          />
        )}
      </div>

      {isDraggingGroup && (
        <div
          className="group-drag-indicator"
          style={{
            left: `${(draggedCards[0]?.x || 0) + 75}px`,
            top: `${(draggedCards[0]?.y || 0) + 105}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5em',
            fontWeight: 'bold',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            color: 'black',
            width: '50px',
            height: '50px',
            position: 'absolute',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000
          }}>
          {selectedCards.length}
        </div>
      )}

      {/* RENDEROWANIE PANELU OPCJI KARTY NA POLU BITWY */}
      {/* Używamy selectedFieldCardForPanel, które zawiera pełne dane CardOnField, w tym CardType */}
      {isCardPanelOpen && selectedFieldCardForPanel && panelPosition && (
        <BattlefieldCardPanel
          card={selectedFieldCardForPanel.card} // CardType
          fieldCard={selectedFieldCardForPanel} // CardOnField
          onClose={closeCardPanel}
          panelRef={cardPanelRef}
          position={panelPosition}
          panelDirection={panelDirection}
          rotateCard={handleRotationAction}
          moveCardToGraveyard={handleMoveToGraveyardAction}
          moveCardToHand={handleMoveToHandAction}
          moveCardToExile={handleMoveToExileAction}
          moveCardToTopOfLibrary={handleMovetoTopofLibrary}
          onCardCounterClick={handleCardCounterClick}
          onDecreaseCardStatsClick={handleDecreaseCardStatsClick}
          onSetCardStats={handleSetCardStatsAction}
          rotateCard180={handleRotation180Action}
          flipCard={handleFlipCardAction}
          cloneCard={handleCloneCardAction}
        />
      )}
    </div>
  );
}