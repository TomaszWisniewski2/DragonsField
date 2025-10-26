// src/pages/PlaytestComponents/TokenViewer.tsx (Zaktualizowany)

import { useState, useRef } from "react";
import type { TokenData } from "../../components/types";
import "./LibraryViewer.css";
// IMPORTUJEMY NOWY KOMPONENT MODALU
import CreateTokenModal from "./CreateTokenModal"; 

interface TokenViewerProps {
    // Lista wszystkich unikalnych tokenów
    allAvailableTokens: TokenData[]; 
    toggleTokenViewer: () => void;
    playerColorClass: string;
    // Funkcja do wywołania emisji eventu 'createToken' na serwerze
    onCreateToken: (tokenData: TokenData) => void; 
}

export default function TokenViewer({ 
    allAvailableTokens, 
    toggleTokenViewer, 
    playerColorClass,
    onCreateToken,
}: TokenViewerProps) {
    const [filterText, setFilterText] = useState("");
    const dragImageRef = useRef<HTMLImageElement>(null);
    // NOWY STAN DLA MODALA TWORZENIA TOKENU
    const [isCreateTokenModalOpen, setIsCreateTokenModalOpen] = useState(false);

    const filteredTokens = allAvailableTokens
        .filter(token => 
            token.name.toLowerCase().includes(filterText.toLowerCase()) || 
            (token.type_line && token.type_line.toLowerCase().includes(filterText.toLowerCase()))
        )
        
    
    const [hoveredTokenImage, setHoveredTokenImage] = useState<string | null>(
        filteredTokens.length > 0 ? filteredTokens[0].image || null : null
    );

    return (
        <div className={`library-viewer-overlay ${playerColorClass}`}>
            <div className="library-viewer-container">
                <div className="library-viewer-header">
                    <span>Viewing Tokens ({filteredTokens.length} of {allAvailableTokens.length})</span>
                    <div>

                        <button onClick={toggleTokenViewer}>Close</button>
                    </div>
                </div>
                <div className="library-viewer-content">
                    <div className="card-image-preview">
                        {hoveredTokenImage && <img src={hoveredTokenImage} alt="Token Preview" />}
                    </div>

<ul className="card-list">
    {filteredTokens.map((token, index) => {
        const items: React.ReactNode[] = [];

        // Normalny token
        items.push(
            <li
                key={`${token.name}-${token.basePower}-${index}`} 
                draggable
                onDoubleClick={() => onCreateToken(token)} 
                onDragStart={(e) => {
                    e.dataTransfer.setData("isToken", "true");
                    e.dataTransfer.setData("tokenData", JSON.stringify(token));
                    e.dataTransfer.setData("from", "token"); 

                    if (dragImageRef.current && token.image) {
                        dragImageRef.current.src = token.image;
                        e.dataTransfer.setDragImage(dragImageRef.current, 50, 70);
                    } else {
                        e.dataTransfer.setDragImage(new Image(), 0, 0);
                    }
                }}
                onMouseEnter={() => setHoveredTokenImage(token.image || null)}
                title={`${token.name} (${token.type_line})`}
            >
                <span style={{fontWeight: 'bold', marginRight: '5px'}}>{token.name}</span>
                {token.basePower && token.baseToughness && (
                    <span style={{fontSize: '0.8em', opacity: 0.7}}> ({token.basePower}/{token.baseToughness})</span>
                )}
            </li>
        );

        // Separator po Treasure
        if (token.name === "Treasure") {
            items.push(
                <li key={`separator-${index}`} className="token-separator">
                    <hr />
                </li>
            );
        }

        return items;
    })}
</ul>


                </div>
                                    <div>
                        {/* NOWY PRZYCISK "New Token" */}
                        <button 
                            className="sidebar-button"
                            style={{ marginRight: '10px' }}
                            onClick={() => setIsCreateTokenModalOpen(true)}
                        >
                            New Token
                        </button>
                    </div>
                <div className="library-viewer-filter">
                    <input
                        type="text"
                        placeholder="Filter by Name or Type"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />
                </div>
                <img ref={dragImageRef} className="drag-image-placeholder" alt="Drag Placeholder" />
            </div>

            {/* WARUNKOWE RENDEROWANIE NOWEGO MODALA */}
            {isCreateTokenModalOpen && (
                <CreateTokenModal
                    onClose={() => setIsCreateTokenModalOpen(false)}
                    onCreateToken={onCreateToken}
                />
            )}
        </div>
    );
}