// src/pages/PlaytestComponents/Battlefield.tsx

import React, { type DragEvent, useState, useEffect, type MouseEvent, useRef } from "react";
import type { Player, CardOnField, Zone, CardType } from "../../components/types";
import Card from "../../components/Card";
import "./../Playtest.css";

interface BattlefieldProps {
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
    setSelectedCards: (cards: CardType[]) => void;
    selectedCards: CardType[];
    playerColorClass: string;
    handleCardHover: (card: CardType | null) => void;
    incrementCardStats: (code: string, playerId: string, cardId: string) => void; // Nowa prop
}

export default function Battlefield({
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
}: BattlefieldProps) {
    const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const battlefieldRef = useRef<HTMLDivElement>(null);

    const [isDraggingGroup, setIsDraggingGroup] = useState(false);
    const [draggedCards, setDraggedCards] = useState<CardOnField[]>([]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 't' && player && player.id === viewedPlayer?.id) {
                if (selectedCards.length > 0) {
                    selectedCards.forEach(card => {
                        rotateCard(sessionCode, player.id, card.id);
                    });
                } else if (hoveredCardId) {
                    rotateCard(sessionCode, player.id, hoveredCardId);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [player, viewedPlayer, hoveredCardId, rotateCard, sessionCode, selectedCards]);

    const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
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

    if (!viewedPlayer) return null;

const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!battlefieldRef.current) return;
    const dropZoneRect = battlefieldRef.current.getBoundingClientRect();

    // Zmienne pomocnicze dla bazowych wymiarów karty
    const baseCardWidth = 150;
    const baseCardHeight = 210;

    // Nowość: Skalujemy wymiary karty na podstawie aktualnego zoomu
    const scaledCardWidth = baseCardWidth * (zoom / 140);
    const scaledCardHeight = baseCardHeight * (zoom / 140);

    const isGroupDrag = e.dataTransfer.types.includes("text/json");

    if (isGroupDrag) {
        const draggedCardsData = JSON.parse(e.dataTransfer.getData("text/json")) as { cardId: string, x: number, y: number }[];
        
        const baseX = e.clientX - dropZoneRect.left - dragOffset.x;
        const baseY = e.clientY - dropZoneRect.top - dragOffset.y;

        const offsetX = 20;
        const offsetY = 20;

        draggedCardsData.forEach((cardData, index) => {
            const newX = baseX + index * offsetX;
            const newY = baseY + index * offsetY;
            
            const clampedX = Math.max(0, Math.min(newX, dropZoneRect.width - scaledCardWidth));
            const clampedY = Math.max(0, Math.min(newY, dropZoneRect.height - scaledCardHeight));

            moveCard(sessionCode, viewedPlayer.id, "battlefield", "battlefield", cardData.cardId, clampedX, clampedY);
        });

        setSelectedCards([]);
        setDraggedCards([]);
        setIsDraggingGroup(false);

    } else {
        const cardId = e.dataTransfer.getData("cardId");
        const from = e.dataTransfer.getData("from") as Zone;
        const x = e.clientX - dropZoneRect.left - dragOffset.x;
        const y = e.clientY - dropZoneRect.top - dragOffset.y;
        
        const clampedX = Math.max(0, Math.min(x, dropZoneRect.width - scaledCardWidth));
        const clampedY = Math.max(0, Math.min(y, dropZoneRect.height - scaledCardHeight));

        if (from === "battlefield") {
            moveCard(sessionCode, viewedPlayer.id, "battlefield", "battlefield", cardId, clampedX, clampedY);
        } else {
            moveCard(sessionCode, player?.id as string, from, "battlefield", cardId, clampedX, clampedY);
        }
    }
};

    const handleDragStart = (e: DragEvent<HTMLDivElement>, card: CardOnField) => {
        if (viewedPlayerId !== null) return;

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
            e.dataTransfer.setData("cardId", card.id);
            e.dataTransfer.setData("from", "battlefield");
            e.dataTransfer.effectAllowed = "move";
        }
    };

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
            >
                {viewedPlayer.battlefield.map((c: CardOnField) => (
                    <div
                        key={c.id}
                        className={`card-on-field ${getPlayerColorClass(viewedPlayer.id)} ${selectedCards.some(card => card.id === c.card.id) ? 'selected' : ''}`}
                        data-card-id={c.id}
                        onMouseEnter={() => {
                            setHoveredCardId(c.id);
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
                        }}
                        draggable={viewedPlayerId === null}
                        onDragStart={(e) => handleDragStart(e, c)}
                        onDoubleClick={() => handleCardRotation(c.id)}
                    >
                        <Card
                            card={c.card}
                            from="battlefield"
                            ownerId={viewedPlayer.id}
                            getPlayerColorClass={getPlayerColorClass}
                            onCardStatsClick={handleCardStatsClick}
                            cardOnField={c} // <-- WAŻNA ZMIANA: PRZEKAZYWANIE CAŁEGO OBIEKTU
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
                        }}
                    />
                )}
            </div>

            {isDraggingGroup && (
                <div 
                    className="group-drag-indicator" 
                    style={{ 
                        left: `${draggedCards[0]?.x}px`,
                        top: `${draggedCards[0]?.y}px`,
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
                        zIndex: 1000
                    }}>
                    {selectedCards.length}
                </div>
            )}
        </div>
    );
}