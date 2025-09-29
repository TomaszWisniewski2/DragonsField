import React from 'react';
import './CardCounters.css'; 

interface CardCountersProps {
  counters: number;
  onIncrement: () => void;
  playerColorClass: string;
}

/**
 * Komponent wyświetlający i umożliwiający interakcję z licznikami na karcie (np. +1/+1).
 */
const CardCounters: React.FC<CardCountersProps> = ({
  counters,
  onIncrement,
  playerColorClass
}) => {
  // Nie wyświetlaj, jeśli licznik jest zerowy
  if (counters ===0) return null;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); // Zatrzymuje propagację, by nie wywołać akcji na rodzicu (karcie)
    onIncrement();
  };
  
  // Zatrzymujemy podwójne kliknięcie, aby nie wywołać obrotu karty
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

 return (
  <div 
   className={`card-counters ${playerColorClass}`}
   onClick={handleClick}
   onDoubleClick={handleDoubleClick}
  >
   <span className="counter-value">
    {counters}
   </span>
  </div>
 );
};

export default CardCounters;