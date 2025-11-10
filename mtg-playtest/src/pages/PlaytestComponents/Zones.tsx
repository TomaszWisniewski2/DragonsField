// Zones.tsx
import React, { type DragEvent, type MouseEvent } from 'react';
import Card from "../../components/Card";
import type { Player, Zone, Session, CardType } from "../../components/types";

interface ZonesProps {
  player: Player; // ✅ To jest 'viewedPlayer'
  session: Session;
  getPlayerColorClass: (id: string) => string;
  setDragOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  handleDrop: (e: DragEvent<HTMLDivElement>, toZone: Zone) => void;
  handleCardHover: (card: CardType | null) => void;
  zoom: number;
  isLibraryPanelOpen: boolean; 
  isGraveyardPanelOpen: boolean; 
  isExilePanelOpen: boolean; 
  isLibraryTopRevealed: boolean; 
  toggleLibraryPanel: (e: MouseEvent<HTMLElement>) => void; 
  toggleGraveyardPanel: (e: MouseEvent<HTMLElement>) => void; 
  toggleExilePanel: (e: MouseEvent<HTMLElement>) => void; 
  isMoving: boolean;
  isOwner: boolean; // ✅ NOWY PROP
}

const MTG_CARD_BACK_URL = "https://assets.moxfield.net/assets/images/missing-image.png";

export default function Zones({
  player, // 'viewedPlayer'
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
  isMoving,
  isOwner, // ✅ ODBIERZ PROP
}: ZonesProps) {

  // Funkcja pomocnicza do przeciągania (Graveyard/Exile)
  const handleZoneDragStart = (e: DragEvent<HTMLDivElement>, zoneCards: CardType[], fromZone: Zone) => {
    e.stopPropagation();
    // ✅ Zabezpieczenie dla widza
    if (!isOwner || isMoving || zoneCards.length === 0) {
      e.preventDefault();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
    });
    const cardId = zoneCards[zoneCards.length - 1].id;
    e.dataTransfer.setData("cardId", cardId);
    e.dataTransfer.setData("from", fromZone);
  };

  // Logika dla Library
  const handleLibraryDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    // ✅ Zabezpieczenie dla widza
    if (!isOwner || isMoving || player.library.length === 0) {
      e.preventDefault();
      return;
    }
    const topCard = player.library[0];
    const cardId = topCard.id;
    e.dataTransfer.setData("cardId", cardId);
    e.dataTransfer.setData("from", "library");

    const dragImage = e.currentTarget.querySelector('.mtg-card-back') || e.currentTarget.querySelector('.card-component');
    if (dragImage) {
      e.dataTransfer.setDragImage(dragImage as Element, e.currentTarget.offsetWidth / 2, e.currentTarget.offsetHeight / 2);
    }
  };

  // Logika hovera dla Library (działa dla wszystkich)
  const handleLibraryMouseEnter = () => {
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
          onDragOver={(e) => isOwner && e.preventDefault()} // ✅ Blokada Drop
          onDrop={(e) => isOwner && handleDrop(e, "library")} // ✅ Blokada Drop
          onClick={(e) => e.stopPropagation()}
        >
          {player.library.length > 0 && (
            <div
              draggable={!isMoving && isOwner} // ✅ Blokada Drag
              onDragStart={handleLibraryDragStart}
              onMouseEnter={handleLibraryMouseEnter}
              onMouseLeave={handleLibraryMouseLeave}
              onClick={(e) => e.stopPropagation()}
            >
              {isLibraryTopRevealed ? (
                <Card
                  card={player.library[0]} 
                  from="library"
                  ownerId={player.id}
                  getPlayerColorClass={getPlayerColorClass}
                  zoom={zoom}
                />
              ) : (
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
          onDragOver={(e) => isOwner && e.preventDefault()} // ✅ Blokada Drop
          onDrop={(e) => isOwner && handleDrop(e, "graveyard")} // ✅ Blokada Drop
        >
          {player.graveyard.length > 0 && (
            <div
              draggable={!isMoving && isOwner} // ✅ Blokada Drag
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
          onDragOver={(e) => isOwner && e.preventDefault()} // ✅ Blokada Drop
          onDrop={(e) => isOwner && handleDrop(e, "exile")} // ✅ Blokada Drop
        >
          {player.exile.length > 0 && (
            <div
              draggable={!isMoving && isOwner} // ✅ Blokada Drag
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

      {/* ZONA - Commander Zone (Warstwowe renderowanie) */}
      {session.sessionType === "commander" && (
        <div className="zone-box-container">
          <span className="zone-label">Commander Zone ({player?.commanderZone.length ?? 0})</span>
          <div
            className="zone-box commander-zone"
            onDragOver={(e) => isOwner && e.preventDefault()} // ✅ Blokada Drop
            onDrop={(e) => isOwner && handleDrop(e, "commanderZone")} // ✅ Blokada Drop
            style={{ position: 'relative' }} 
          >
            {player.commanderZone.length > 0 && (
              player.commanderZone.slice().reverse().map((card, reversedIndex) => { 
                const originalIndex = player.commanderZone.length - 1 - reversedIndex;
                const isTopCard = originalIndex === 0;
                const offset = originalIndex * 3; 

                return (
                  <div
                    key={card.id}
                    className="stack-card-wrapper"
                    style={{ 
                      position: 'absolute',
                      top: `${offset}px`, 
                      left: `${offset}px`, 
                      zIndex: 10 + (player.commanderZone.length - originalIndex),
                    }}
                    draggable={isTopCard && !isMoving && isOwner} // ✅ Blokada Drag
                    onDragStart={(e) => {
                      if (isTopCard && !isMoving && isOwner) { 
                        e.stopPropagation();
                        const cardId = card.id;
                        e.dataTransfer.setData("cardId", cardId);
                        e.dataTransfer.setData("from", "commanderZone");
                      } else {
                        e.preventDefault();
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