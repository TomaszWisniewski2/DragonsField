// src/components/ManaCost.tsx

import React from 'react';
import './ManaCost.css';

interface ManaCostProps {
  manaCost: string;
}

// Mapa symboli many na emotikony
const manaSymbolsMap: { [key: string]: string } = {
  'W': '🟡',
  'U': '🔵',
  'B': '⚫️',
  'R': '🔴',
  'G': '🟢',
  'C': '⚪️', // Dla many bezbarwnej (colorless)
};
//\u{1F31E}", "\u{1F4A7}", "\u{1F480}", "\u{1F525}", "\u{1F333}",
const ManaCost: React.FC<ManaCostProps> = ({ manaCost }) => {
  const parseManaCost = (cost: string) => {
    // Użyj regex, aby znaleźć wszystkie symbole w nawiasach klamrowych
    const symbols = cost.match(/\{[^}]+\}/g) || [];

    return symbols.map((symbol, index) => {
      // Usuń nawiasy klamrowe i dostosuj symbol
      const cleanedSymbol = symbol.replace(/\{|\}/g, '').toUpperCase();
      let displayedSymbol = cleanedSymbol;

      // Sprawdź, czy to symbol kolorowej many, czy generyczny koszt
      const isColoredMana = ['W', 'U', 'B', 'R', 'G', 'C'].includes(cleanedSymbol);
      const className = `mana-symbol2 ${isColoredMana ? `mana-${cleanedSymbol.toLowerCase()}` : 'mana-generic'}`;

      // Mapuj litery na emotikony, jeśli to możliwe
      if (isColoredMana) {
        displayedSymbol = manaSymbolsMap[cleanedSymbol] || cleanedSymbol;
      }

      return <span key={index} className={className}>{displayedSymbol}</span>;
    });
  };

  return (
    <div className="mana-cost-container">
      {parseManaCost(manaCost)}
    </div>
  );
};

export default ManaCost;