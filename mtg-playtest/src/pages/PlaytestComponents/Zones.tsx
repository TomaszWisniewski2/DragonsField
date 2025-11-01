// Zones.tsx
import React from 'react';
import Card from "../../components/Card";
import type { Player, Zone, Session, CardType } from "../../components/types";
// Usunięto nieużywany import, który powodował ostrzeżenia (LibraryPanelProps, GraveyardPanelProps, ExilePanelProps)
// import { LibraryPanelProps, GraveyardPanelProps, ExilePanelProps } from "./Bottombar"; 

// --- INTERFEJS PROPSÓW ZONES (OCZYSZCZONY) ---

interface ZonesProps {
  player: Player;
  session: Session;
  // sessionCode został usunięty
  getPlayerColorClass: (id: string) => string;
  setDragOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  handleDrop: (e: React.DragEvent<HTMLDivElement>, toZone: Zone) => void;
  handleCardHover: (card: CardType | null) => void;
  zoom: number;

  // Stany i toggle (Tylko te użyte w renderze Zone lub do przełączania)
  isLibraryPanelOpen: boolean; // Zostawione do wyświetlenia '▲' / '▼'
  isGraveyardPanelOpen: boolean; // Zostawione do wyświetlenia '▲' / '▼'
  isExilePanelOpen: boolean; // Zostawione do wyświetlenia '▲' / '▼'
  isLibraryTopRevealed: boolean; // Używane do warunkowego renderowania karty
  toggleLibraryPanel: (e: React.MouseEvent<HTMLElement>) => void; // Używane w onClick na labelu
  toggleGraveyardPanel: (e: React.MouseEvent<HTMLElement>) => void; // Używane w onClick na labelu
  toggleExilePanel: (e: React.MouseEvent<HTMLElement>) => void; // Używane w onClick na labelu
  // toggleLibraryTopRevealed, Refy, i Funckje dla Paneli zostały usunięte

}

const MTG_CARD_BACK_URL = "https://assets.moxfield.net/assets/images/missing-image.png";

export default function Zones({
  player,
  session,
  // Usunięto: sessionCode,
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
  // Usunięto: toggleLibraryTopRevealed,
  // Usunięto: libraryPanelRef, graveyardPanelRef, exilePanelRef,
  // Usunięto: toggleLibraryViewer, toggleGraveyardViewer, toggleExileViewer,
  // Usunięto: handleMoveAllCards, shuffle, moveAllCardsToBottomOfLibrary,
}: ZonesProps) {

  // Funkcja pomocnicza do przeciągania
  const handleZoneDragStart = (e: React.DragEvent<HTMLDivElement>, zoneCards: CardType[], fromZone: Zone) => {
    e.stopPropagation();
    if (zoneCards.length > 0) {
        const rect = e.currentTarget.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
        const cardId = zoneCards[zoneCards.length - 1].id;
        e.dataTransfer.setData("cardId", cardId);
        e.dataTransfer.setData("from", fromZone);
    }
  };

  // Logika dla Library musi być inna, bo przeciągamy górną kartę
const handleLibraryDragStart = (e: React.DragEvent<HTMLDivElement>) => {
  e.stopPropagation();
  if (player.library.length > 0) {
      // Górna karta to ostatni element — zgodnie z logiką serwera
      const topCard = player.library[0];
      const cardId = topCard.id;
      e.dataTransfer.setData("cardId", cardId);
      e.dataTransfer.setData("from", "library");

      // Obraz przeciągania
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
      handleCardHover(player.library[0]); // Zmieniono na player.library[0]
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
              onDragStart={(e) => handleZoneDragStart(e, player.graveyard, "graveyard")}
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
              onDragStart={(e) => handleZoneDragStart(e, player.exile, "exile")}
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

{/* ZONA - Commander Zone (Poprawka renderowania stosu) */}
      {session.sessionType === "commander" && (
        <div className="zone-box-container">
          <span className="zone-label">Commander Zone ({player?.commanderZone.length ?? 0})</span>
          <div
            className="zone-box commander-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, "commanderZone")}
            // WAŻNE: Dodaj styl 'position: relative' do CSS dla .zone-box.commander-zone!
            style={{ position: 'relative' }} 
          >
            {player.commanderZone.length > 0 && (
              // Używamy płytkiej kopii i mapowania, aby uzyskać wizualny stos.
              // Karta [0] powinna być renderowana jako OSTATNIA (najwyższy z-index).
              [...player.commanderZone].map((card, index) => { 
                
                // Używamy oryginalnego indeksu. Karta[0] jest na górze, ma największy Z-Index, najmniejszy offset.
                // Aby renderować ją jako ostatnią w DOM, odwracamy kolejność iteracji.
                const originalIndex = index;
                //const renderIndex = player.commanderZone.length - 1 - index; // 0 dla ostatniej (górnej) karty, max dla dolnej

                const isTopCard = originalIndex === 0;

                // Offset jest zerowy dla karty na górze (originalIndex === 0)
                const offset = originalIndex * 3; 

                return (
                  <div
                    key={card.id}
                    // Zapewniamy, że wszystkie karty zajmują tyle samo miejsca, ale są pozycjonowane absolutnie
                    className="stack-card-wrapper"
                    style={{ 
                        position: 'absolute', // Kluczowe do nakładania
                        top: `${offset}px`, 
                        left: `${offset}px`, 
                        zIndex: 10 + (player.commanderZone.length - originalIndex), // Wyższy Z-Index dla kart bliżej góry stosu
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
              }).reverse() // Odwracamy mapowaną tablicę, aby karta [0] była renderowana jako ostatnia w DOM
            )}
          </div>
        </div>
      )}

      {/* RENDEROWANIE PANELI (Zostają tutaj, ale zagnieżdżone w nowym komponencie, aby przekazać wszystkie propsy) */}
      
      {/* Panele są przeniesione do Bottombar.tsx, aby uniknąć problemów z renderowaniem poza głównym drzewem komponentów */}
      {/* LUB: Używamy portali, ale na potrzeby uproszczenia, zostawiamy te warunki w Zones.tsx, a same komponenty paneli przenieśmy do Bottombar.tsx */}

    </div>
  );
}