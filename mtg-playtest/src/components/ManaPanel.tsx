// src/components/ManaPanel.tsx

import React from "react";
import "./ManaPanel.css";

interface ManaPanelProps {
  manaPool: {
    W: number;
    U: number;
    B: number;
    R: number;
    G: number;
    C: number;
  };
  onManaChange: (color: keyof ManaPanelProps['manaPool'], amount: number) => void;
  isOwnedPlayer: boolean;
}

const ManaPanel: React.FC<ManaPanelProps> = ({ manaPool, onManaChange, isOwnedPlayer }) => {
  const manaColors = ["W", "U", "B", "R", "G", "C"] as const;
  const manaEmojis = ["\u{1F31E}", "\u{1F4A7}", "\u{1F480}", "\u{1F525}", "\u{1F333}", "C"] as const;

  return (
    <div className="mana-panel-container">
      {manaColors.map((color, index) => (
        <div key={color} className="mana-column">
          {/* Zamieniono <span> na <button> */}
          <button 
            className={`mana mana-${color.toLowerCase()}`}
            onClick={() => isOwnedPlayer && onManaChange(color, 1)}
            disabled={!isOwnedPlayer} // Dodano atrybut 'disabled'
          >
            <div className="mana-value">
              {manaPool[color]}
            </div>
            <div className="mana-symbol">
              {manaEmojis[index]}
            </div>
          </button>
          {isOwnedPlayer && (
            <button className="mana-button" onClick={() => onManaChange(color, -1)}>
              -
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default ManaPanel;