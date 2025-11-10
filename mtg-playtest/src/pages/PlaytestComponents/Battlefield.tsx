// src/pages/PlaytestComponents/Battlefield.tsx

import React, { type DragEvent, useState, useEffect, type MouseEvent, useRef, useCallback } from "react";
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
    y?: number,
    position?: number // DODANO opcjonalny position
  ) => void;
  player: Player | undefined;
  setDragOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  sessionCode: string;
  rotateCard: (code: string, playerId: string, cardId: string) => void;
  rotateCard180: (code: string, playerId: string, cardId: string) => void;
  setSelectedCards: (ids: string[]) => void; // ✅ ZMIANA: Oczekuje string[]
  selectedCards: string[]; // ✅ ZMIANA: Jest string[]
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
  isMoving: boolean; // Flaga blokująca wielokrotne wysłanie ruchu
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
  isMoving, // 🛑 POBRANIE PROPIS MOVING
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

  // 🛑 UŻYCIE useCallback dla stabilności
   const closeCardPanel = useCallback(() => {
    setIsCardPanelOpen(false);
    setSelectedFieldCardForPanel(null);
    setPanelPosition(null);
    setPanelDirection('up');
  }, []);


  const handleCardContextMenu = (e: MouseEvent<HTMLDivElement>, cardOnField: CardOnField) => {
    e.preventDefault();
    e.stopPropagation();

    // 🛑 POPRAWKA: Blokada, gdy trwa ruch
    if (isMoving) return; 

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
    // Karta zostaje tylko odwrócona, to nie jest ruch
    const card = selectedFieldCardForPanel?.card;
    if (player && player.id === viewedPlayer?.id && card?.hasSecondFace) {
      flipCard(sessionCode, player.id, cardId);
    }
    // Nie zamykamy panelu, żeby użytkownik mógł łatwo odwrócić z powrotem.
  };

  const handleRotationAction = (cardId: string) => {
    // Rotacja to szybka akcja, nie blokujemy
    if (player && player.id === viewedPlayer?.id) {
      rotateCard(sessionCode, player.id, cardId);
    }
  };

  const handleRotation180Action = (cardId: string) => {
    // Rotacja to szybka akcja, nie blokujemy
    if (player && player.id === viewedPlayer?.id) {
      rotateCard180(sessionCode, player.id, cardId);
    }
  };

  const handleMoveToGraveyardAction = (cardId: string) => {
    // 🛑 POPRAWKA: Blokada, gdy trwa ruch
    if (isMoving) return; 
    if (player && player.id === viewedPlayer?.id) {
      moveCard(sessionCode, player.id, "battlefield", "graveyard", cardId);
    }
  };

  const handleMoveToHandAction = (cardId: string) => {
    // 🛑 POPRAWKA: Blokada, gdy trwa ruch
    if (isMoving) return; 
    if (player && player.id === viewedPlayer?.id) {
      moveCard(sessionCode, player.id, "battlefield", "hand", cardId);
    }
  };

  const handleMoveToExileAction = (cardId: string) => {
    // 🛑 POPRAWKA: Blokada, gdy trwa ruch
    if (isMoving) return; 
    if (player && player.id === viewedPlayer?.id) {
      moveCard(sessionCode, player.id, "battlefield", "exile", cardId);
    }
  };

  const handleMovetoTopofLibrary = (cardId: string) => {
    // 🛑 POPRAWKA: Blokada, gdy trwa ruch
    if (isMoving) return; 
    if (player && player.id === viewedPlayer?.id) {
      moveCard(sessionCode, player.id, "battlefield", "library", cardId);
    }
  };


  const handleSetCardStatsAction = (powerValue: number, toughnessValue: number) => {
    // Ustawienie statystyk to szybka akcja, nie blokujemy
    // Używamy ID z CardOnField
    if (player && player.id === viewedPlayer?.id && selectedFieldCardForPanel) {
      setCardStats(sessionCode, player.id, selectedFieldCardForPanel.id, powerValue, toughnessValue);
      closeCardPanel(); // Zamykamy panel po ustawieniu statystyk
    }
  };

  // --- OPTYMALIZACJA EFFECT HOOKS Z UŻYCIEM useCallback ---

  // 1. STABILNY HANDLER DLA KLAWISZY (KLONOWANIE, ROTACJA)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // ✅ POPRAWKA: Ignoruj skróty, jeśli użytkownik pisze w polu tekstowym
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }
    // --- Koniec poprawki ---

    // Sprawdzenie, czy bieżący gracz i przeglądany gracz są tym samym graczem
    if (!player || player.id !== viewedPlayer?.id) {
      return;
    }

    // Funkcja pomocnicza do pobierania ID CardOnField
    const getTargetCardIds = (): string[] => {
      if (selectedCards.length > 0) { // ✅ POPRAWIONA LOGIKA
        // 'selectedCards' to JUŻ jest tablica ID (string[])
        return selectedCards;
      } else if (hoveredCardId) {
        // Karta najechana - mamy jej unikalne ID na polu bitwy (CardOnField ID)
        return [hoveredCardId]; 
      }
      return [];
    };

    if (e.key === 't') {
      // Rotacja: używamy ID CardOnField
      getTargetCardIds().forEach(cardId => {
        rotateCard(sessionCode, player.id, cardId);
      });
    } 
    
    if (e.key === 'x') {
      // Klonowanie: używamy ID CardOnField
      getTargetCardIds().forEach(cardIdToClone => {
        cloneCard(sessionCode, player.id, cardIdToClone); 
      });
    }
  }, [player, viewedPlayer, hoveredCardId, rotateCard, sessionCode, selectedCards, cloneCard]); 


  // 2. STABILNY HANDLER DLA KLIKNIĘCIA POZA PANELEM
  const handleClickOutside = useCallback((event: MouseEvent | globalThis.MouseEvent) => {
    const targetNode = event.target as Node;
    // Ponieważ isCardPanelOpen jest stanem, musimy go uwzględnić w zależnościach useCallback, 
    // aby mieć jego najnowszą wartość, ale i tak zyskujemy na stabilności
    if (isCardPanelOpen && cardPanelRef.current && !cardPanelRef.current.contains(targetNode)) {
      closeCardPanel();
    }
  }, [isCardPanelOpen, cardPanelRef, closeCardPanel]);


  // 3. EFFECT HOOK DLA KLAWISZY (dodawany tylko, gdy zmieni się funkcja handleKeyDown)
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);


  // 4. EFFECT HOOK DLA MYSZY (dodawany tylko, gdy zmieni się funkcja handleClickOutside)
  useEffect(() => {
    // Używamy globalThis.MouseEvent, aby uniknąć problemów z typowaniem dla document.addEventListener
    document.addEventListener("mousedown", handleClickOutside as (event: globalThis.MouseEvent) => void);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside as (event: globalThis.MouseEvent) => void);
    };
  }, [handleClickOutside]); // Zależny od handleClickOutside


  // --- OBSŁUGA ZAZNACZANIA MYSZKĄ ---

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    // Ta akcja nie inicjuje ruchu, nie blokujemy
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
    // Ta akcja nie inicjuje ruchu, nie blokujemy
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
      
      // ✅ POPRAWKA: Zmieniamy typ na string[]
      const cardIdsInSelection: string[] = [];

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
          // ✅ POPRAWKA: Pobieramy atrybut data-card-id (string)
          const cardId = htmlCardEl.getAttribute('data-card-id');
          if (cardId) {
            // I pchamy go bezpośrednio do tablicy stringów
            cardIdsInSelection.push(cardId);
          }
        }
      });
      // ✅ POPRAWKA: Przekazujemy string[] do stanu
      setSelectedCards(cardIdsInSelection);
    }
  };

  const handleMouseUp = () => {
    // Ta akcja nie inicjuje ruchu, nie blokujemy
    setIsSelecting(false);
    setSelectionRect(null);
  };



// --- OBSŁUGA DRAG & DROP ---

  // ✅ CAŁA TA FUNKCJA (wraz z wewnętrzną 'findCardZoneInPlayer') ZOSTAŁA ZASTĄPIONA
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // 🛑 POPRAWKA: Blokada, gdy trwa ruch
    if (isMoving) return; 

    if (!battlefieldRef.current || !player) return;

    // --- 💡 LOGIKA PRZYCIĄGANIA DO SIATKI (GRID) START 💡 ---
    // Ustaw rozmiar siatki (w pikselach). 15px to dobry, subtelny rozmiar.
    const GRID_SIZE = 20.2; 
    
    // Funkcja pomocnicza, która zaokrągla współrzędne do najbliższego punktu siatki
    const snapToGrid = (coord: number) => {
      return Math.round(coord / GRID_SIZE) * GRID_SIZE;
    };
    // --- 💡 LOGIKA PRZYCIĄGANIA DO SIATKI (GRID) KONIEC 💡 ---

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
          // 💡 Tokeny również powinny być przyciągane do siatki
          //const tokenX = e.clientX - dropZoneRect.left - (dragOffset.x || 0);
          //const tokenY = e.clientY - dropZoneRect.top - (dragOffset.y || 0);

          // Wysyłamy żądanie onCreateToken, ale serwer będzie musiał
          // obsłużyć pozycjonowanie. LUB, jeśli serwer nie obsługuje x/y dla tokenów:
          // Musielibyśmy wysłać event moveCard dla nowo utworzonego tokena.
          // Na razie zakładamy, że serwer umieszcza go w domyślnym miejscu.
          onCreateToken(tokenData); // TODO: Rozważ dodanie x/y do logiki tworzenia tokenów
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
    const baseCardWidth = 100;
    const baseCardHeight = 139.34;
    const scaledCardWidth = baseCardWidth * (zoom / 100);
    const scaledCardHeight = baseCardHeight * (zoom / 100);
    const targetPlayerId = viewedPlayer?.id || player.id;
    if (!targetPlayerId) return;

    // Surowe współrzędne myszy
    const baseX = e.clientX - dropZoneRect.left - dragOffset.x;
    const baseY = e.clientY - dropZoneRect.top - dragOffset.y;

    const clamp = (val: number, min: number, max: number) =>
      Math.max(min, Math.min(max, val));

    // Funkcja clamp pozostaje bez zmian
    const clamped = (x: number, y: number) => ({
      x: clamp(x, 0, dropZoneRect.width - scaledCardWidth),
      y: clamp(y, 0, dropZoneRect.height - scaledCardHeight),
    });

    // Funkcja findCardZoneInPlayer pozostaje bez zmian
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
        const safeFrom: Zone = baseFrom;
        // ... (logika ostrzeżeń)

        // 💡 ZASTOSOWANIE SIATKI DO GRUPY
        // Obliczamy surową pozycję z offsetem
        const rawX = baseX + index * 20;
        const rawY = baseY + index * 20;
        
        // Przyciągamy do siatki
        const snappedX = snapToGrid(rawX);
        const snappedY = snapToGrid(rawY);

        // Ograniczamy do pola bitwy
        const offset = clamped(snappedX, snappedY);
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
    let safeFrom: Zone;
    if (fromRaw) {
      safeFrom = fromRaw;
    } else {
      const detected = findCardZoneInPlayer(player, cardId);
      safeFrom = detected || "hand"; 
      if (process.env.NODE_ENV === "development") {
         console.warn(`⚠️ BattlefieldDrop (Single): Brak 'from' w dataTransfer. Użyto lokalnej detekcji: ${safeFrom}`);
      }
    }

    // 💡 ZASTOSOWANIE SIATKI DO POJEDYNCZEJ KARTY
    // Najpierw przyciągamy surowe koordynaty
    const snappedX = snapToGrid(baseX);
    const snappedY = snapToGrid(baseY);
    
    // Następnie ograniczamy przyciągnięte koordynaty do pola bitwy
    const { x: finalX, y: finalY } = clamped(snappedX, snappedY);

    // Logika ruchu pozostaje bez zmian
    moveCard(sessionCode, targetPlayerId, safeFrom, "battlefield", cardId, finalX, finalY);
  };











  //--------------------------------------------------------------------------------------------------------------------------------------------------------------------
  const handleDragStart = (e: DragEvent<HTMLDivElement>, card: CardOnField) => {
    // 🛑 POPRAWKA: Blokada, gdy trwa ruch
    if (isMoving) {
      e.preventDefault();
      return;
    }

    if (viewedPlayerId !== null) return;

    closeCardPanel();

    const rect = e.currentTarget.getBoundingClientRect();
    
    // ✅ POPRAWKA: Sprawdzamy, czy unikalne ID TEJ karty (card.id) jest w tablicy selectedCards
    const isSelected = selectedCards.includes(card.id); 

    if (isSelected && selectedCards.length > 1) {
      setIsDraggingGroup(true);
      const draggedCardsWithPos = viewedPlayer?.battlefield
        // ✅ POPRAWKA: Filtrujemy po unikalnym ID instancji
        .filter(c => selectedCards.includes(c.id))
        .map(c => ({
          cardId: c.id, // CardOnField ID
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
            // ✅ POPRAWKA: Logika 'selected' używa teraz .includes() na tablicy stringów
            className={`card-on-field ${getPlayerColorClass(viewedPlayer.id)} ${selectedCards.includes(c.id) ? 'selected' : ''}`}
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
              cursor: viewedPlayerId === null && !isMoving ? "grab" : "default", // Zmiana kursora
              transform: `scale(${zoom / 100}) rotate(${c.rotation}deg)`,
              transformOrigin: 'center center',
              // ✅ POPRAWKA: Logika 'zIndex' używa teraz .includes()
              zIndex: selectedCards.includes(c.id) ? 10 : 5
            }}
            draggable={viewedPlayerId === null && !isMoving} // 🛑 Blokowanie drag&drop
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
          //isMoving={isMoving} // ✅ DODANO: Przekazanie flagi blokującej do Panelu
        />
      )}
    </div>
  );
}