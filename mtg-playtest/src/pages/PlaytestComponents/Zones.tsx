// Zones.tsx
import React, { type DragEvent, type MouseEvent } from 'react';
import Card from "../../components/Card";
import type { Player, Zone, Session, CardType } from "../../components/types";

// --- INTERFEJS PROPSÓW ZONES ---

interface ZonesProps {
  player: Player;
  session: Session;
  getPlayerColorClass: (id: string) => string;
  setDragOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  handleDrop: (e: DragEvent<HTMLDivElement>, toZone: Zone) => void;
  handleCardHover: (card: CardType | null) => void;
  zoom: number;

  // Stany i toggle (dla renderowania ikonki ▲/▼ i obsługi kliknięcia)
  isLibraryPanelOpen: boolean; 
  isGraveyardPanelOpen: boolean; 
  isExilePanelOpen: boolean; 
  isLibraryTopRevealed: boolean; 
  toggleLibraryPanel: (e: MouseEvent<HTMLElement>) => void; 
  toggleGraveyardPanel: (e: MouseEvent<HTMLElement>) => void; 
  toggleExilePanel: (e: MouseEvent<HTMLElement>) => void; 
}

const MTG_CARD_BACK_URL = "https://assets.moxfield.net/assets/images/missing-image.png";

export default function Zones({
  player,
  session,
  getPlayerColorClass,
  setDragOffset,
  handleDrop,
  handleCardHover,
  zoom,
  isLibraryPanelOpen,
  isGraveyardPanelOpen,
  isExilePanelOpen,
  isLibraryTopRevealed,
  toggleLibraryPanel,
  toggleGraveyardPanel,
  toggleExilePanel,
}: ZonesProps) {

  // Funkcja pomocnicza do przeciągania z Graveyard/Exile (karta na górze, czyli ostatnia w tablicy)
  const handleZoneDragStart = (e: DragEvent<HTMLDivElement>, zoneCards: CardType[], fromZone: Zone) => {
    e.stopPropagation();
    if (zoneCards.length > 0) {
        const rect = e.currentTarget.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
        // Zgodnie z konwencją, ostatnia karta w tablicy (length - 1) jest kartą widoczną/górną
        const cardId = zoneCards[zoneCards.length - 1].id;
        e.dataTransfer.setData("cardId", cardId);
        e.dataTransfer.setData("from", fromZone);
    }
  };

  // Logika dla Library: Przeciągamy kartę na górze (indeks 0)
  const handleLibraryDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (player.library.length > 0) {
        // Górna karta to pierwszy element — player.library[0]
        const topCard = player.library[0];
        const cardId = topCard.id;
        e.dataTransfer.setData("cardId", cardId);
        e.dataTransfer.setData("from", "library");

        // Ustawienie obrazu przeciągania
        const dragImage = e.currentTarget.querySelector('.mtg-card-back') || e.currentTarget.querySelector('.card-component');
        if (dragImage) {
          e.dataTransfer.setDragImage(dragImage as Element, e.currentTarget.offsetWidth / 2, e.currentTarget.offsetHeight / 2);
        }
    }
  };

  // Logika hovera dla Library
  const handleLibraryMouseEnter = () => {
    // Podgląd górnej karty tylko, gdy jest ODKRYTA
    if (isLibraryTopRevealed && player.library.length > 0) {
      handleCardHover(player.library[0]);
    }
  };

  const handleLibraryMouseLeave = () => {
    if (isLibraryTopRevealed) {
      handleCardHover(null);
    }
  };


  return (
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
          {player.library.length > 0 && (
            <div
              draggable
              onDragStart={handleLibraryDragStart}
              onMouseEnter={handleLibraryMouseEnter}
              onMouseLeave={handleLibraryMouseLeave}
              onClick={(e) => e.stopPropagation()}
            >
              {isLibraryTopRevealed ? (
                // WIDOK ODKRYTEJ KARTY (player.library[0] to górna)
                <Card
                  card={player.library[0]} 
                  from="library"
                  ownerId={player.id}
                  getPlayerColorClass={getPlayerColorClass}
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
              // Przeciągamy ostatnią kartę (górną)
              onDragStart={(e) => handleZoneDragStart(e, player.graveyard, "graveyard")}
              // Hover na ostatniej karcie (górnej)
              onMouseEnter={() => handleCardHover(player.graveyard[player.graveyard.length - 1])}
              onMouseLeave={() => handleCardHover(null)}
              onClick={(e) => e.stopPropagation()}
            >
              <Card
                card={player.graveyard[player.graveyard.length - 1]}
                from="graveyard"
                ownerId={player.id}
                getPlayerColorClass={getPlayerColorClass}
                zoom={zoom}
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
              // Przeciągamy ostatnią kartę (górną)
              onDragStart={(e) => handleZoneDragStart(e, player.exile, "exile")}
              // Hover na ostatniej karcie (górnej)
              onMouseEnter={() => handleCardHover(player.exile[player.exile.length - 1])}
              onMouseLeave={() => handleCardHover(null)}
              onClick={(e) => e.stopPropagation()}
            >
              <Card
                card={player.exile[player.exile.length - 1]}
                from="exile"
                ownerId={player.id}
                getPlayerColorClass={getPlayerColorClass}
                zoom={zoom}
              />
            </div>
          )}
        </div>
        </div>

{/* ZONA - Commander Zone (Warstwowe renderowanie) */}
      {session.sessionType === "commander" && (
        <div className="zone-box-container">
          <span className="zone-label">Commander Zone ({player?.commanderZone.length ?? 0})</span>
          <div
            className="zone-box commander-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, "commanderZone")}
            // Wymaga CSS: .zone-box.commander-zone { position: relative; }
            style={{ position: 'relative' }} 
          >
            {player.commanderZone.length > 0 && (
              // Renderujemy karty od najniższej (ostatniej w tablicy) do najwyższej (indeks 0)
              // Zapewnia to, że górna karta (indeks 0) jest renderowana jako OSTATNIA w DOM
              player.commanderZone.slice().reverse().map((card, reversedIndex) => { 
                
                // Oryginalny indeks: 0 dla górnej karty, N-1 dla dolnej
                const originalIndex = player.commanderZone.length - 1 - reversedIndex;
                
                const isTopCard = originalIndex === 0;

                // Offset jest zerowy dla karty na górze (originalIndex === 0)
                const offset = originalIndex * 3; 

                return (
                  <div
                    key={card.id}
                    className="stack-card-wrapper"
                    style={{ 
                        position: 'absolute', // Kluczowe do nakładania
                        top: `${offset}px`, 
                        left: `${offset}px`, 
                        zIndex: 10 + (player.commanderZone.length - originalIndex), // Wyższy Z-Index dla kart bliżej góry
                    }}
                    draggable={isTopCard} // Tylko górna karta jest draggable
                    onDragStart={(e) => {
                        if (isTopCard) {
                            e.stopPropagation();
                            const cardId = card.id;
                            e.dataTransfer.setData("cardId", cardId);
                            e.dataTransfer.setData("from", "commanderZone");
                        }
                    }}
                    onMouseEnter={() => isTopCard && handleCardHover(card)}
                    onMouseLeave={() => isTopCard && handleCardHover(null)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Card
                      card={card}
                      from="commanderZone"
                      ownerId={player.id}
                      getPlayerColorClass={getPlayerColorClass}
                      zoom={zoom}
                    />
                  </div>
                );
            })
            )}
          </div>
        </div>
      )}
    </div>
  );
}