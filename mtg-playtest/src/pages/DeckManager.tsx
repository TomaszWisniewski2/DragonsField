
// Zakładam, że w pliku api/scryfall.ts masz funkcje:
// getCardByName(name: string): Promise<ScryfallCardData>
// getCardImageUrl(data: ScryfallCardData): string | null
// ORAZ: getCardByURI(uri: string): Promise<ScryfallCardData>

import "./DeckManager.css";
// Importujemy CardType i TokenData z pliku types
import type { CardType, TokenData } from "../components/types";


import { useDeckManager } from "./useDeckManager";


// ----------------------------------------------------------------------
// KOMPONENT DECKMANAGER
// ----------------------------------------------------------------------
export default function DeckManager() {
    // 💡 Używamy hooka, aby pobrać całą logikę i stany
    const {
        deck,
        sideboard,
        commander,
        tokenList,
        query,
        bulkText,
        loading,
        setQuery,
        setBulkText,
        handleAddCard,
        handleRemoveCard,
        handleToggleCardLocation,
        handleSetCommander,
        handleRemoveCommander,
        handleBulkImport,
        handleClearStorage,
        calculateTotalManaValue,
    } = useDeckManager();

    const totalManaValue = calculateTotalManaValue();
    //const totalCards = deck.length + sideboard.length;
   

    return (
        <div className="deck-manager-container">
            <h1>Deck Manager</h1>

            {/* PRZYCISK CZYSZCZENIA LOCALSTORAGE */}
            <div style={{ margin: "20px 0", textAlign: "right" }}>
                <button
                    onClick={handleClearStorage}
                    style={{
                        padding: "8px 15px",
                        background: "#d32f2f",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold"
                    }}
                >
                    Wyczyść całą talię i cache 🗑️
                </button>
            </div>
            
            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #444' }} />

            <p>Dodawaj karty do swojej talii:</p>

            {/* Inputy do dodawania kart */}
            <div style={{ marginBottom: "10px" }}>
                <input
                    type="text"
                    placeholder="Wpisz nazwę karty..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{
                        padding: "6px",
                        width: "250px",
                        backgroundColor: "#383838",
                        color: "#fff",
                        border: "1px solid #666",
                        borderRadius: "4px",
                    }}
                />
                <button
                    onClick={handleAddCard}
                    disabled={loading}
                    style={{ marginLeft: "8px", padding: "6px 12px" }}
                >
                    {loading ? "Ładowanie..." : "Dodaj do Decku"}
                </button>
            </div>

            {/* Import całego decku */}
            <h2>Import całej talii (Deck + Sideboard)</h2>
            <p style={{ fontSize: '0.9em', color: '#ccc' }}>
                Aby oddzielić sideboard, użyj linii: <code style={{ color: 'yellow' }}>SIDEBOARD:</code>
            </p>
            <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Wklej listę kart (np. 4 Lightning Bolt)
SIDEBOARD:
1 Atomize"
                className="bulk-import-textarea"
            />
            <button
                onClick={handleBulkImport}
                disabled={loading}
                style={{ marginTop: "10px", padding: "6px 12px" }}
            >
                Importuj talię
            </button>

            {/* Wyświetlanie informacji o commanderze */}
            {commander && (
                <div style={{ marginTop: "20px", padding: "10px", border: "2px solid gold", borderRadius: "8px", display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {commander.image && (
                        <img
                            src={commander.image}
                            alt={commander.name}
                            style={{ width: '60px', borderRadius: '4px' }}
                        />
                    )}
                    <h3 style={{ margin: 0 }}>Commander: {commander.name}</h3>
                    <button onClick={handleRemoveCommander} style={{ background: 'transparent', color: 'red', border: 'none', cursor: 'pointer', fontSize: '1.2em' }}>
                        &times;
                    </button>
                </div>
            )}

            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #444' }} />

            {/* GLOBALNA LISTA TOKENÓW */}
            <h2 style={{ marginTop: "20px" }}>Lista tokenów do gry ({tokenList.length}) 🎲</h2>
            <div className="token-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', padding: '10px', backgroundColor: '#222', borderRadius: '8px' }}>
                {tokenList.length === 0 ? (
                    <p style={{ color: '#ccc' }}>Brak tokenów związanych z kartami w talii.</p>
                ) : (
                    tokenList.map((token) => (
                        <div key={token.name} style={{ width: '100px', textAlign: 'center', padding: '5px', border: '1px solid #444', borderRadius: '4px', backgroundColor: '#333' }}>
                            {token.image && (
                                <img
                                    src={token.image}
                                    alt={token.name}
                                    style={{ width: '100%', height: 'auto', borderRadius: '4px', marginBottom: '4px' }}
                                />
                            )}
                            <div style={{ fontWeight: 'bold', fontSize: '0.9em' }}>{token.name}</div>
                            <div style={{ fontSize: '0.7em', color: '#aaa' }}>{token.type_line}</div>
                            {token.basePower !== null && token.baseToughness !== null && (
                                <div style={{ color: 'lightcoral', fontSize: '0.8em' }}>{token.basePower}/{token.baseToughness}</div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #444' }} />

            {/* lista kart w talii */}
            <h2 style={{ marginTop: "20px" }}>Twoja Główna Talia ({deck.length} kart)</h2>
            <p style={{ fontWeight: 'bold' }}>
                Całkowity Mana Value talii: {totalManaValue.toFixed(2)}
            </p>
            <div className="deck-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {deck.map((card) => (
                    <CardDisplay
                        key={card.id}
                        card={card}
                        commander={commander}
                        isSideboard={false}
                        handleRemoveCard={handleRemoveCard}
                        handleSetCommander={handleSetCommander}
                        handleToggleCardLocation={handleToggleCardLocation}
                    />
                ))}
            </div>
            
            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #444' }} />
            
            {/* 💡 NOWA SEKCJA DLA SIDEBOARDU */}
            <h2 style={{ marginTop: "20px" }}>Sideboard ({sideboard.length} kart) 🩹</h2>
            <div className="sideboard-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {sideboard.length === 0 ? (
                    <p style={{ color: '#ccc' }}>Brak kart w Sideboardzie.</p>
                ) : (
                    sideboard.map((card) => (
                        <CardDisplay
                            key={card.id}
                            card={card}
                            commander={commander}
                            isSideboard={true} // 💡 Oznaczamy jako sideboard
                            handleRemoveCard={handleRemoveCard}
                            handleSetCommander={handleSetCommander}
                            handleToggleCardLocation={handleToggleCardLocation}
                        />
                    ))
                )}
            </div>
            {/* Koniec sekcji sideboardu */}


        </div>
    );
}

// ----------------------------------------------------------------------
// 4. NOWY KOMPONENT POMOCNICZY DO WYŚWIETLANIA KARTY (aby uniknąć powtarzania kodu)
// ----------------------------------------------------------------------
interface CardDisplayProps {
    card: CardType;
    commander: CardType | null;
    isSideboard: boolean;
    handleRemoveCard: (id: string, isSideboard: boolean) => void;
    handleSetCommander: (card: CardType) => void;
    handleToggleCardLocation: (card: CardType, isSideboard: boolean) => void;
}

const CardDisplay: React.FC<CardDisplayProps> = ({
    card,
    commander,
    isSideboard,
    handleRemoveCard,
    handleSetCommander,
    handleToggleCardLocation
}) => {
    return (
        <div
            style={{
                border: commander && commander.id === card.id ? '2px solid gold' : '1px solid gray',
                padding: "4px",
                textAlign: "center",
                width: "120px",
                backgroundColor: isSideboard ? '#252525' : '#1e1e1e', // Lżejsze tło dla sideboardu
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
            }}
        >
            {card.image ? (
                <img
                    src={card.image}
                    alt={card.name}
                    style={{ width: "100%", height: "auto", borderRadius: '2px' }}
                />
            ) : (
                <div style={{ height: "160px", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{card.name}</div>
            )}

            {/* Tokeny */}
            {card.tokens && card.tokens.length > 0 && (
                <div style={{ margin: '4px 0', fontSize: '0.7em', color: 'yellowgreen', borderTop: '1px solid #333', paddingTop: '4px' }}>
                    **Tokeny tej karty:**
                    {card.tokens.map((token: TokenData, index) => (
                        <div key={index} style={{ margin: '0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ fontWeight: 'bold' }}>{token.name}</div>
                            {token.basePower !== null && token.baseToughness !== null && (
                                <div style={{ color: 'lightcoral', fontSize: '0.8em' }}>{token.basePower}/{token.baseToughness}</div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                <button
                    onClick={() => handleRemoveCard(card.id, isSideboard)}
                    style={{
                        padding: "4px 8px",
                        background: "red",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                        borderRadius: '2px',
                    }}
                >
                    Usuń
                </button>
                
                {isSideboard ? (
                    // Przycisk dla Sideboardu
                    <button
                        onClick={() => handleToggleCardLocation(card, true)}
                        style={{
                            padding: "4px 8px",
                            background: "skyblue",
                            color: "black",
                            border: "none",
                            cursor: "pointer",
                            borderRadius: '2px',
                        }}
                    >
                        Przenieś do Decku
                    </button>
                ) : (
                    // Przyciski dla Decku
                    <>
                        <button
                            onClick={() => handleSetCommander(card)}
                            disabled={!!commander && commander.id === card.id}
                            style={{
                                padding: "4px 8px",
                                background: "#4CAF50",
                                color: "white",
                                border: "none",
                                cursor: "pointer",
                                borderRadius: '2px',
                            }}
                        >
                            {commander && commander.id === card.id ? 'Commander (ustawiony)' : 'Ustaw jako commandera'}
                        </button>
                        <button
                            onClick={() => handleToggleCardLocation(card, false)}
                            style={{
                                padding: "4px 8px",
                                background: "#ff9800",
                                color: "white",
                                border: "none",
                                cursor: "pointer",
                                borderRadius: '2px',
                            }}
                        >
                            Przenieś do Sideboardu
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};