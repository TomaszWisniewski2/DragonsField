// src/pages/PlaytestComponents/CreateTokenModal.tsx

import { useState } from "react";
import type { TokenData } from "../../components/types";
import { getCardByName, getCardImageUrl } from "../../api/scryfall";
import "./CreateTokenModal.css"; 

interface CreateTokenModalProps {
    onClose: () => void;
    onCreateToken: (tokenData: TokenData) => void;
}

// Interfejsy dla częściowej odpowiedzi Scryfall
// Ograniczamy do pól potrzebnych do konwersji TokenData i pobrania obrazka
interface ScryfallCardFace {
    power?: string;
    toughness?: string;
    // Pamiętamy o polach potrzebnych przez getCardImageUrl dla kart dwustronnych
    image_uris?: { normal?: string; art_crop?: string; }; 
    name?: string;
    type_line?: string;
    mana_cost?: string;
    cmc?: number;
}

// Pełny typ odpowiedzi, zunifikowany
export interface ScryfallResponse {
    object: string;
    name: string;
    type_line: string;
    cmc: number;
    mana_cost?: string; 
    power?: string;
    toughness?: string;
    image_uris?: { normal?: string };
    details?: string; // Dla odpowiedzi typu "error"
    // Używamy zunifikowanego typu dla card_faces, który obejmuje zarówno dane statystyczne jak i URI obrazka
    card_faces?: ScryfallCardFace[]; 
}

// Funkcja pomocnicza do konwersji danych Scryfall na TokenData
// Usunięto 'as any' z getCardImageUrl dzięki lepszemu typowaniu ScryfallResponse
function cardToTokenData(card: ScryfallResponse): TokenData {
    
    // Scryfall może mieć power/toughness na głównym obiekcie LUB na card_faces[0]
    // Używamy opcjonalnego łańcuchowania, aby bezpiecznie dostać się do card_faces
    const power = card.power ?? (card.card_faces?.[0]?.power || null);
    const toughness = card.toughness ?? (card.card_faces?.[0]?.toughness || null);

    // Domyślnie ScryfallResponse jest typem oczekiwanym przez getCardImageUrl, 
    // co eliminuje potrzebę 'as any'.
    const imageUrl = getCardImageUrl(card) || undefined;

    return {
        name: card.name,
        type_line: card.type_line,
        // Konwersja string | null na string | undefined
        basePower: power === null ? undefined : power,
        baseToughness: toughness === null ? undefined : toughness,
        
        image: imageUrl,
        mana_value: card.cmc || 0,
        // Zapewnienie, że mana_cost jest stringiem lub undefined
        mana_cost: card.mana_cost || undefined, 
    };
}

export default function CreateTokenModal({ onClose, onCreateToken }: CreateTokenModalProps) {
    const [cardName, setCardName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewToken, setPreviewToken] = useState<TokenData | null>(null);

    const handleSearch = async () => {
        if (!cardName) return;

        setLoading(true);
        setError(null);
        setPreviewToken(null);

        try {
            // Wyszukanie karty (lub tokenu) za pomocą fuzzy search
            const cardData = await getCardByName(cardName) as ScryfallResponse;

            if (cardData.object === "error") {
                setError(cardData.details || "Card not found.");
                setLoading(false);
                return;
            }

            const tokenData = cardToTokenData(cardData);
            setPreviewToken(tokenData);

        } catch (err) {
            console.error("Scryfall search error:", err);
            // Bezpieczna konwersja błędu na wiadomość tekstową
            const errorMessage = err instanceof Error ? err.message : 'Unknown error during card search.';
            setError(`Error searching card: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        if (previewToken) {
            onCreateToken(previewToken);
            onClose(); 
        }
    };

    return (
        <div className="create-token-modal-overlay">
            <div className="create-token-modal-content">
                <div className="modal-header">
                    <h2>Create Custom Token</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>

                <div className="modal-body">
                    <p>Enter the name of any card or token from the Scryfall database:</p>
                    
                    <div className="search-group">
                        <input
                            type="text"
                            placeholder="e.g., 'Goblin Token' or 'Phyrexian Obliterator'"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSearch();
                            }}
                            disabled={loading}
                        />
                        <button onClick={handleSearch} disabled={loading}>
                            {loading ? "Searching..." : "Search"}
                        </button>
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    {previewToken && (
                        <div className="token-preview">
                            <div className="preview-info">
                                <h3>{previewToken.name}</h3>
                                <p>{previewToken.type_line}</p>
                                {previewToken.basePower && previewToken.baseToughness && (
                                    <p>P/T: **{previewToken.basePower}/{previewToken.baseToughness}**</p>
                                )}
                                <button 
                                    onClick={handleCreate} 
                                    className="create-button"
                                    disabled={loading}
                                >
                                    Create and Place on Battlefield
                                </button>
                            </div>
                            <div className="preview-image">
                                {previewToken.image ? (
                                    <img src={previewToken.image} alt={previewToken.name} />
                                ) : (
                                    <div className="no-image">No Image Available</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}