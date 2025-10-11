import React from 'react';
import './CardStats.css';

interface CardStatsProps {
    // Te propsy będą zawsze stringami lub null, bo sprawdzamy to wcześniej
    basePower?: string | null;
    baseToughness?: string | null;
    currentPower: number;
    currentToughness: number;
    onIncrement: () => void;
    playerColorClass: string;
}

const CardStats: React.FC<CardStatsProps> = ({
    basePower,
    baseToughness,
    currentPower,
    currentToughness,
    onIncrement,
    playerColorClass
}) => {
    // Już nie potrzebujemy tutaj warunku return null, bo to Card.tsx decyduje, kiedy renderować ten komponent

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        onIncrement();
    };

    const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
    };

    // Użyjemy 0 jako wartości domyślnej, jeśli basePower/baseToughness są puste
    const bPower = basePower ? parseInt(basePower) : 0;
    const bToughness = baseToughness ? parseInt(baseToughness) : 0;

    const totalPower = bPower + currentPower;
    const totalToughness = bToughness + currentToughness;

    return (
        <div
            className={`card-stats ${playerColorClass}`}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
        >
            <span className="power-toughness">
                {totalPower}/{totalToughness}
            </span>
        </div>
    );
};

export default CardStats;