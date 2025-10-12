// src/pages/PlaytestComponents/TokenViewer.tsx

import { useState, useRef } from "react";
// Usunięto Player z importu, ponieważ nie jest potrzebny
import type { TokenData } from "../../components/types"; 
import "./LibraryViewer.css"; 

interface TokenViewerProps {
    // Lista wszystkich unikalnych tokenów
    allAvailableTokens: TokenData[]; 
    toggleTokenViewer: () => void;
    playerColorClass: string;
    // Przywrócenie funkcji do wywołania emisji eventu 'createToken' na serwerze
    onCreateToken: (tokenData: TokenData) => void; 
}

export default function TokenViewer({ 
    allAvailableTokens, 
    toggleTokenViewer, 
    playerColorClass,
    onCreateToken, // PRZYWRÓCONY PROP
}: TokenViewerProps) {
    const [hoveredTokenImage, setHoveredTokenImage] = useState<string | null>(
        allAvailableTokens.length > 0 ? allAvailableTokens[0].image || null : null
    );
    const [filterText, setFilterText] = useState("");
    const dragImageRef = useRef<HTMLImageElement>(null);

    // ----------------------------------------------------------------------
    // LOGIKA FILTROWANIA
    // ----------------------------------------------------------------------
    const filteredTokens = allAvailableTokens
        .filter(token => 
            token.name.toLowerCase().includes(filterText.toLowerCase()) || 
            (token.type_line && token.type_line.toLowerCase().includes(filterText.toLowerCase()))
        )
        // Sortowanie alfabetyczne dla porządku (jak w LibraryViewer)
        .sort((a, b) => a.name.localeCompare(b.name));
    // ----------------------------------------------------------------------

    return (
        <div className={`library-viewer-overlay ${playerColorClass}`}>
            <div className="library-viewer-container">
                <div className="library-viewer-header">
                    <span>Viewing Tokens ({filteredTokens.length} of {allAvailableTokens.length})</span>
                    <button onClick={toggleTokenViewer}>Close</button>
                </div>
                <div className="library-viewer-content">
                    <div className="card-image-preview">
                        {hoveredTokenImage && <img src={hoveredTokenImage} alt="Token Preview" />}
                    </div>

                    <ul className="card-list">
                        {filteredTokens.map((token, index) => (
                            <li
                                // Poprawiony klucz, użyjemy nazwy + indeksu,
                                // ponieważ wiele kart może generować ten sam token
                                key={`${token.name}-${token.basePower}-${index}`} 
                                draggable
                                // Używamy onDoubleClick do szybkiego utworzenia tokenu na polu
                                onDoubleClick={() => onCreateToken(token)} 
                                onDragStart={(e) => {
                                    // Ustawiamy dane do przeciągania
                                    e.dataTransfer.setData("isToken", "true");
                                    e.dataTransfer.setData("tokenData", JSON.stringify(token));
                                    e.dataTransfer.setData("from", "token"); 

                                    // Ustawienie obrazu do przeciągania
                                    if (dragImageRef.current && token.image) {
                                        dragImageRef.current.src = token.image;
                                        e.dataTransfer.setDragImage(dragImageRef.current, 50, 70);
                                    } else {
                                        // Użyj niewidocznego obrazu, jeśli obraz tokenu jest niedostępny
                                        e.dataTransfer.setDragImage(new Image(), 0, 0);
                                    }
                                }}
                                onMouseEnter={() => setHoveredTokenImage(token.image || null)}
                                title={`${token.name} (${token.type_line})`}
                            >
                                {/* Uproszczony widok, bardziej zbliżony do LibraryViewer */}
                                <span style={{fontWeight: 'bold', marginRight: '5px'}}>{token.name}</span>
                                {token.basePower && token.baseToughness && (
                                    <span style={{fontSize: '0.8em', opacity: 0.7}}> ({token.basePower}/{token.baseToughness})</span>
                                )}
                            </li>
                        ))}
                    </ul>

                </div>
                {/* Panel filtrowania przeniesiony na dół, jak w LibraryViewer */}
                <div className="library-viewer-filter">
                    <input
                        type="text"
                        placeholder="Filter by Name or Type"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />
                </div>
                {/* Ukryty obraz do przeciągania */}
                <img ref={dragImageRef} className="drag-image-placeholder" alt="Drag Placeholder" />
            </div>
        </div>
    );
}