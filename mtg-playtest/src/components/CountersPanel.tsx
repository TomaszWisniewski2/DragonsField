// src/components/CountersPanel.tsx

import React from 'react';

interface CountersPanelProps {
  counters: { [key: string]: number };
  onCounterChange: (type: string, value: number) => void;
  onClose: () => void;
  playerColorClass: string;
  readOnly?: boolean; // <-- DODANO NOWY PROP
}

const CountersPanel: React.FC<CountersPanelProps> = ({ 
  counters, 
  onCounterChange, 
  onClose, 
  playerColorClass,
  readOnly = false // Ustawienie domyślnej wartości, aby nie trzeba było go przekazywać, gdy przyciski są potrzebne
}) => {
  return (
    <div className={`counters-panel-container ${playerColorClass}`}>
      <div className="counters-panel-header">
        <h6>Counters</h6>
        <button 
          className="btn-close" 
          aria-label="Close" 
          onClick={onClose} 
        ></button>
      </div>
      <div className="counters-list">
        {Object.keys(counters).map((type) => (
          <div key={type} className="counter-item">
            <div className="counter-label">
              <span>
                {type === 'Poison' && <i className="fas fa-skull"></i>}
                {type === 'Energy' && <i className="fas fa-bolt"></i>}
                {type === 'Experience' && <i className="fas fa-star"></i>}
                {type === 'Rad' && <i className="fas fa-radiation"></i>}
                {type === 'Tickets' && <i className="fas fa-ticket-alt"></i>}
                {type.includes('Commander') && <i className="fas fa-crown"></i>}
              </span>
              <span>{type}</span>
            </div>
            <div className="counter-value">
              {counters[type]}
              
            </div>
            {/* WARUNKOWE RENDEROWANIE PRZYCISKÓW */}
            {!readOnly && (
              <div className="counter-buttons">
                <button 
                  onClick={() => onCounterChange(type, -1)}
                >-
                  <i className="fas fa-minus"></i>
                </button>
                <button
                  onClick={() => onCounterChange(type, 1)}
                >+
                  <i className="fas fa-plus"></i>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CountersPanel;