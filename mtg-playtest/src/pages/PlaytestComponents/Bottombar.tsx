import React from "react";
import Card from "../../components/Card";
import type { Player, Zone, Session } from "../../components/types";
import "./../Playtest.css";
import type { CardType } from "../../components/types";

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
    <div className={`bottom-bar ${getPlayerColorClass(player.id)}`}>
      <div 
        className="hand"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, "hand")}
      >
        <span style={{ color: "#fff" }}>Hand ({player?.hand.length ?? 0})</span>
        <div className="hand-cards">
          {player?.hand.map((c) => (
            <div
              key={c.id}
              draggable
              onDragStart={(e) => {
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
          <span className="zone-label">Library ({player?.library.length ?? 0})</span>
          <div 
            className="zone-box library"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, "library")}
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
          <span className="zone-label">Graveyard ({player?.graveyard.length ?? 0})</span>
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
          <span className="zone-label">Exile ({player?.exile.length ?? 0})</span>
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
  );
}