// src/pages/PlaytestComponents/panels/BattlefieldCardPanel.tsx

import React, { useState, useEffect, useCallback } from "react";
// Importujemy wspólne typy, włączając CardOnField, zgodnie z Battlefield.tsx
import type { CardType, PanelProps, CardOnField } from "../../../components/types";


// INTERFEJS DLA PANELU KARTY NA POLU BITWY
export interface BattlefieldCardPanelProps extends PanelProps {
  // USUWAMY: currentPower: number;
  // USUWAMY: currentToughness: number;
  card: CardType; // Podstawowe dane karty (nazwa, obraz)
  fieldCard: CardOnField; // Pełne dane karty na polu (współrzędne, rotacja, aktualne statystyki, ID akcji)
  position: { x: number; y: number };
  panelDirection: 'up' | 'down';
  // Funkcje akcji na polu bitwy (przekazywane z Battlefield)
  rotateCard: (cardId: string) => void;
  rotateCard180: (cardId: string) => void;
  moveCardToGraveyard: (cardId: string) => void;
  moveCardToHand: (cardId: string) => void;
  moveCardToExile: (cardId: string) => void;
  moveCardToTopOfLibrary: (cardId: string) => void;
  onCardCounterClick?: (cardId: string) => void;
  onDecreaseCardStatsClick?: (cardId: string) => void;
  // PROP DLA USTAWIANIA STATYSTYK
  onSetCardStats: (powerValue: number, toughnessValue: number) => void;
  // 1. DODANIE PROPSA flipCard
  flipCard: (cardId: string) => void;
  cloneCard: (cardId: string) => void;
}

// --- KOMPONENT BATTLEFIELD CARD PANEL ---

export const BattlefieldCardPanel: React.FC<BattlefieldCardPanelProps> = ({
  onClose,
  panelRef,
  card,
  fieldCard,
  position,
  panelDirection,
  rotateCard,
  moveCardToGraveyard,
  moveCardToHand,
  moveCardToExile,
  moveCardToTopOfLibrary,
  onCardCounterClick,
  onDecreaseCardStatsClick,
  onSetCardStats,
  rotateCard180,
  flipCard,
  cloneCard,
}) => {
  const [isSettingStats, setIsSettingStats] = useState(false);
  const [powerInput, setPowerInput] = useState<string>('');
  const [toughnessInput, setToughnessInput] = useState<string>('');

  const cardOnFieldId = fieldCard.id;

  // 1. Bezpieczne parsowanie bazowych statystyk
  const basePower = card.basePower && !isNaN(parseInt(card.basePower, 10)) ? parseInt(card.basePower, 10) : 0;
  const baseToughness = card.baseToughness && !isNaN(parseInt(card.baseToughness, 10)) ? parseInt(card.baseToughness, 10) : 0;


  // 2. Opakowanie funkcji pomocniczych w useCallback
  const calculateEffectivePower = useCallback(
    (mod: number) => mod + basePower,
    [basePower] // Zależność od basePower
  );

  const calculateEffectiveToughness = useCallback(
    (mod: number) => mod + baseToughness,
    [baseToughness] // Zależność od baseToughness
  );


  // 3. Użycie funkcji w useEffect
  useEffect(() => {
    // fieldCard.stats.power/toughness przechowują modyfikator (liczniki)
    const initialPower = calculateEffectivePower(fieldCard.stats.power);
    const initialToughness = calculateEffectiveToughness(fieldCard.stats.toughness);

    setPowerInput(initialPower.toString());
    setToughnessInput(initialToughness.toString());
    setIsSettingStats(false);

    // 4. Dodanie funkcji do tablicy zależności (teraz są stabilne)
  }, [
    calculateEffectivePower,
    calculateEffectiveToughness,
    fieldCard.id,
    fieldCard.stats.power,
    fieldCard.stats.toughness
  ]);


  const handleAction = (action: () => void) => () => {
    onClose();
    action();
  };

  // Funkcje obsługi używają cardOnFieldId
  const handleTap = () => { rotateCard(cardOnFieldId); onClose(); };
  const handle180 = () => { rotateCard180(cardOnFieldId); onClose(); };
  const handleMoveToGraveyard = () => { moveCardToGraveyard(cardOnFieldId); onClose(); };
  const handleMoveToHand = () => { moveCardToHand(cardOnFieldId); onClose(); };
  const handleMoveToExile = () => { moveCardToExile(cardOnFieldId); onClose(); };
  const handleAddCounter = () => { onCardCounterClick?.(cardOnFieldId); };
  const handleDecreaseCounter = () => { onDecreaseCardStatsClick?.(cardOnFieldId); };
  const handleMovetoTopofLibrary = () => { moveCardToTopOfLibrary(cardOnFieldId); onClose(); };
  const handleFlipCard = () => { flipCard(cardOnFieldId); };

 const handleCloneCard = (e: React.MouseEvent) => { 
    e.stopPropagation(); // 👈 KLUCZOWA ZMIANA: Zatrzymuje propagację zdarzenia
    cloneCard(cardOnFieldId); 
};

  const handleSetStatsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Ustawiamy input na wartość efektywną
    const initialPower = calculateEffectivePower(fieldCard.stats.power);
    const initialToughness = calculateEffectiveToughness(fieldCard.stats.toughness);

    setPowerInput(initialPower.toString());
    setToughnessInput(initialToughness.toString());
    setIsSettingStats(true);
  };

  const handleConfirmSetStats = () => {
    // Parsujemy wartość wpisaną przez użytkownika (Wartość Efektywna)
    const effectivePower = parseInt(powerInput, 10);
    const effectiveToughness = parseInt(toughnessInput, 10);

    if (!isNaN(effectivePower) && !isNaN(effectiveToughness)) {

      // Obliczamy modyfikator = Wartość Efektywna - Wartość Bazowa
      const modifierPower = effectivePower - basePower;
      const modifierToughness = effectiveToughness - baseToughness;

      // Wysyłamy modyfikatory (liczniki)
      onSetCardStats(modifierPower, modifierToughness);
    } else {
      console.error("Invalid P/T values");
    }
  };

  const handleCancelSetStats = () => {
    setIsSettingStats(false);
  };

  const transformStyle = `translate(-50%, ${panelDirection === 'up' ? '-100%' : '0'})`;

  return (
    <div
      className="hand-panel-floating card-panel-override2"
      ref={panelRef}
      style={{
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`,
        transform: transformStyle,
        zIndex: 9999,
      }}
    >
      <div className="hand-panel-content">
        <button className="hand-panel-close-btn" onClick={onClose}>
          &times;
        </button>

        <h4
          style={{
            color: 'white',
            margin: '0 12px 5px 12px',
            paddingTop: '10px',
            borderBottom: '1px solid #444',
            paddingBottom: '5px'
          }}
        >
          {card.name}
        </h4>

        {isSettingStats ? (
          <div className="set-stats-form" style={{ padding: '10px 12px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type="number"
                value={powerInput}
                onChange={(e) => setPowerInput(e.target.value)}
                placeholder="Siła"
                style={{ width: '50px', padding: '5px', borderRadius: '4px', border: '1px solid #666', backgroundColor: '#333', color: 'white' }}
              />
              <input
                type="number"
                value={toughnessInput}
                onChange={(e) => setToughnessInput(e.target.value)}
                placeholder="Wytrzymałość"
                style={{ width: '80px', padding: '5px', borderRadius: '4px', border: '1px solid #666', backgroundColor: '#333', color: 'white' }}
              />
            </div>
            <button
              className="hand-panel-btn action-confirm"
              onClick={handleConfirmSetStats}
            >
              Ustaw P/T
            </button>
            <button
              className="hand-panel-btn action-cancel"
              onClick={handleCancelSetStats}
              style={{ marginTop: '5px' }}
            >
              Anuluj
            </button>
          </div>
        ) : (
          <div className="hand-panel-options-list">
            <button className="hand-panel-btn" onClick={handleTap}>Tap/Untap (T)</button>

      <button className="hand-panel-btn action-flip" onClick={handleFlipCard}>
       {fieldCard.isFlipped ? 'Flip back' : 'Flip'}
      </button>
           
            <button className="hand-panel-btn" onClick={handle180}>Rotate 180</button>
            <hr style={{ borderColor: '#444', margin: '2px 0' }} />

            <button className="hand-panel-btn" onClick={handleSetStatsClick}>Set P/T</button>
            <button className="hand-panel-btn" onClick={() => onSetCardStats(0, 0)}>Reset P/T</button>
            <hr style={{ borderColor: '#444', margin: '2px 0' }} />

            <button className="hand-panel-btn" onClick={handleAddCounter}>Add Counter</button>
            <button className="hand-panel-btn" onClick={handleDecreaseCounter}>Subtract Counter </button>
            <hr style={{ borderColor: '#444', margin: '2px 0' }} />

            <button className="hand-panel-btn action-hand" onClick={handleMoveToHand}>Move to Hand</button>
            <button className="hand-panel-btn action-hand" onClick={handleMovetoTopofLibrary}>Move to Top of Library</button>
            <button className="hand-panel-btn action-graveyard" onClick={handleMoveToGraveyard}>Move to Graveyard</button>
            <button className="hand-panel-btn action-exile" onClick={handleMoveToExile}>Move to Exile</button>
            <hr style={{ borderColor: '#444', margin: '2px 0' }} />


            <button 
                className="hand-panel-btn action-copy" 
                onClick={handleCloneCard} // ✅ Teraz funkcja otrzyma obiekt zdarzenia (React.MouseEvent)
            >
                Copy 🎭 (X)
            </button>


            <hr style={{ borderColor: '#444', margin: '2px 0' }} />
            <button className="hand-panel-btn action-exile" onClick={handleAction(() => console.log('View Card'))}>-View Card</button>
          </div>
        )}
      </div>
    </div>
  );
};