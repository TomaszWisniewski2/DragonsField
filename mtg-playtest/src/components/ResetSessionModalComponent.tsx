import React from 'react';
// Załóżmy, że ten plik CSS jest współdzielony przez wszystkie modale
import './Modals.css'; 

interface ResetSessionModalProps {
  sessionName: string;
  onClose: () => void;
  onConfirm: () => void;
}

const ResetSessionModalComponent: React.FC<ResetSessionModalProps> = ({
  sessionName,
  onClose,
  onConfirm,
}) => {
  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Resetowanie sesji</h2>
        <p>
          Czy na pewno chcesz zresetować sesję <br />
          <strong>{sessionName}</strong>?
        </p>

        {/* ZMIANA: Ten tekst został zaktualizowany, 
          aby pasował do nowej funkcji "forceResetSession" (wyrzucania graczy).
          Używamy też klasy "modal-details" zamiast stylu inline.
        */}
        <p className="modal-details">
          Spowoduje to <strong>natychmiastowe rozłączenie</strong> i usunięcie
          wszystkich graczy z tej sesji. Sesja zostanie opróżniona.
        </p>
        
        <div className="modal-actions">
          <button onClick={onClose} className="modal-button secondary">
            Anuluj
          </button>
          <button onClick={onConfirm} className="modal-button danger">
            Tak, zresetuj
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetSessionModalComponent;