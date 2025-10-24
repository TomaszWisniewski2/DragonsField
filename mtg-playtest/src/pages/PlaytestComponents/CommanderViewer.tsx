// src/pages/PlaytestComponents/CommanderViewer.tsx

import { useState } from "react";
import type { Player, CardType } from "../../components/types";
import "./CommanderViewer.css"; 

interface CommanderViewerProps {
 // Gracz, którego Dowódcę oglądamy
 player: Player | undefined; 
 // Funkcja zamykająca widok
 toggleCommanderViewer: () => void;
 // Klasa koloru dla stylizacji
 playerColorClass: string;
}

export default function CommanderViewer({ player, toggleCommanderViewer, playerColorClass }: CommanderViewerProps) {
  // === PRAWIDŁOWE MIEJSCE DLA HOOKÓW REACTA (PRZED WCIENSNYMI ZWROTAMI) ===

  // Logika konwersji dowódcy na listę do wyświetlenia musi być w ciele komponentu.
  // Używamy pustej tablicy jako domyślnej, aby bezpiecznie zainicjować stan
  const initialCommanderCards: CardType[] = Array.isArray(player?.commander) 
    ? player!.commander 
    : player?.commander ? [player.commander] : [];
    
  // Używamy initialCommanderCards do bezpiecznej inicjalizacji stanu
  const [hoveredCardImage] = useState<string | null>(
    initialCommanderCards.length > 0 ? initialCommanderCards[0].image || null : null
  );
  //const [filterText] = useState("");

  // === TERAZ MOŻEMY UŻYĆ WCZESNEGO ZWROTU ===
  if (!player) return null;
    
    // Ponownie obliczamy commanderCards po upewnieniu się, że player istnieje,
    // jeśli chcemy mieć najświeższe dane (chociaż dla dowódcy raz obliczona lista wystarczy, ale dla bezpieczeństwa)
    // Zostawiamy tę linijkę, ale wiemy, że player istnieje
  const commanderCards: CardType[] = initialCommanderCards; 


return (
  <div className={`commander-viewer-overlay ${playerColorClass}`}>
   <div className="commander-viewer-container">

    <div className="commander-viewer-header"> {/* ZMIENIONO KLASĘ */}
     <span>Commander Zone ({commanderCards.length})</span>
     <button onClick={toggleCommanderViewer}>Close</button>
    </div>

    <div className="commander-viewer-content"> {/* ZMIENIONO KLASĘ */}
     <div className="commander-card-image-preview"> {/* ZMIENIONO KLASĘ */}
      {hoveredCardImage && <img src={hoveredCardImage} alt="Card Preview" />}
     </div>

     {/* <ul className="commander-card-list"> 
      {commanderCards
       .filter(card => card.name.toLowerCase().includes(filterText.toLowerCase()))
       .map((card) => (
        <li
         key={card.id}
         onMouseEnter={() => setHoveredCardImage(card.image || null)}
        >
         {card.name}
        </li>
       ))}
     </ul> */}
    </div>

    {/* Usuwamy sekcję filtrowania z JSX zgodnie z Twoim wcześniejszym kodem */}
   </div>
  </div>
 );
}