import React from 'react';
import type { CardType, CardOnField } from "./types";
import "./Card.css";
import ManaCost from './ManaCost';
import CardStats from './CardStats';

interface CardProps {
    card?: CardType;
    from?: string;
    ownerId?: string;
    getPlayerColorClass?: (id: string) => string;
    onCardStatsClick?: (cardId: string) => void;
    cardOnField?: CardOnField;
}

export default function Card({
    card,
    from,
    ownerId,
    getPlayerColorClass,
    onCardStatsClick,
    cardOnField,
}: CardProps) {
    if (!card) return null;

    const colorClass = getPlayerColorClass && ownerId ? getPlayerColorClass(ownerId) : '';

    return (
        <div
            className={`card-container ${colorClass} ${from === "hand" ? "hand-card" : ""}`}
            draggable={from === "hand"}
            onDragStart={(e) => {
                if (from === "hand") {
                    e.dataTransfer.setData("cardId", card.id);
                    e.dataTransfer.setData("from", from);

                    const rect = e.currentTarget.getBoundingClientRect();
                    const offsetX = e.clientX - rect.left;
                    const offsetY = e.clientY - rect.top;
                    e.dataTransfer.setData("offsetX", offsetX.toString());
                    e.dataTransfer.setData("offsetY", offsetY.toString());

                    const dragImg = e.currentTarget.cloneNode(true) as HTMLElement;
                    dragImg.style.position = "absolute";
                    dragImg.style.top = "-9999px";
                    dragImg.style.transform = "none";
                    document.body.appendChild(dragImg);

                    e.dataTransfer.setDragImage(dragImg, offsetX, offsetY);

                    setTimeout(() => document.body.removeChild(dragImg), 0);
                }
            }}
        >
            {/* Warunkowe renderowanie komponentu ManaCost */}
            {from === "hand" && card.mana_cost && (
                <div className="mana-indicator">
                    <ManaCost manaCost={card.mana_cost} />
                </div>
            )}
            
{from === "battlefield" && cardOnField && card.basePower !== undefined && card.baseToughness !== undefined && (
    <div className="card-stats-indicator">
        <CardStats
            basePower={card.basePower}
            baseToughness={card.baseToughness}
            currentPower={cardOnField.stats.power}
            currentToughness={cardOnField.stats.toughness}
            onIncrement={() => onCardStatsClick && onCardStatsClick(card.id)}
            playerColorClass={colorClass}
        />
    </div>
            )}
            
            <div className="card-image-wrapper">
                {card.image ? (
                    <img src={card.image} alt={card.name} className="card-image" />
                ) : (
                    <div className="card-placeholder">{card.name}</div>
                )}
            </div>
        </div>
    );
}