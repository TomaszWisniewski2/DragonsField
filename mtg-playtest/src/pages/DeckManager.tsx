import { useState, useEffect, useCallback } from "react";
// Zakładam, że w pliku api/scryfall.ts masz funkcje:
// getCardByName(name: string): Promise<ScryfallCardData>
// getCardImageUrl(data: ScryfallCardData): string | null
// ORAZ NOWĄ: getCardByURI(uri: string): Promise<ScryfallCardData>
import { getCardByName, getCardImageUrl, getCardByURI } from "../api/scryfall"; 
import "./DeckManager.css";
// Importujemy TokenData z pliku types
import type { CardType, TokenData } from "../components/types"; 

// ----------------------------------------------------------------------
// 1. DEFINICJE INTERFEJSÓW (Pozostawione bez zmian)
// ----------------------------------------------------------------------

// Interfejs dla powiązanych części (tokeny, meld, itp.)
interface ScryfallRelatedPart {
    object: string; 
    id: string;
    component: string; // 'token' jest kluczowy
    name: string;
    type_line: string;
    uri: string; // URI do pobrania pełnych danych tokenu
}

interface ScryfallCardFace {
    name: string;
    mana_cost: string;
    type_line: string;
    cmc: number; 
    power?: string;
    toughness?: string;
    loyalty?: number;
    image_uris?: {
        normal: string;
    };
}

interface ScryfallCardData {
    id: string;
    name: string;
    mana_cost?: string;
    type_line?: string;
    cmc: number; 
    power?: string;
    toughness?: string;
    loyalty?: number;
    image_status: string;
    image_uris?: {
        normal: string;
    };
    card_faces?: ScryfallCardFace[];
    all_parts?: ScryfallRelatedPart[]; 
}

// ----------------------------------------------------------------------
// 2. FUNKCJE POMOCNICZE (Pozostawione bez zmian, znajdują się poza komponentem)
// ----------------------------------------------------------------------

/**
 * Asynchroniczna funkcja do pobierania szczegółowych danych tokenów 
 * na podstawie URI z pola all_parts.
 */
async function getTokensData(data: ScryfallCardData): Promise<TokenData[] | undefined> {
    if (!data.all_parts) return undefined;

    const tokenUris = data.all_parts
        .filter(part => part.component === 'token')
        .map(token => token.uri);

    if (tokenUris.length === 0) return undefined;

    try {
        // Pobieramy dane dla wszystkich tokenów równolegle
        const tokenDataPromises = tokenUris.map(uri => getCardByURI(uri));
        const rawTokensData = await Promise.all(tokenDataPromises);

        // Mapujemy surowe dane Scryfall na nasz interfejs TokenData
        const tokens: TokenData[] = rawTokensData.map(tokenData => ({
            name: tokenData.name,
            type_line: tokenData.type_line || '',
            basePower: (tokenData.power === "*" ? "0" : tokenData.power) || null,
            baseToughness: (tokenData.toughness === "*" ? "0" : tokenData.toughness) || null,
            image: getCardImageUrl(tokenData) || undefined,
            mana_value: tokenData.cmc,
            mana_cost: tokenData.mana_cost,
        }));

        return tokens;
    } catch (error) {
        console.error("Błąd podczas pobierania danych tokenów:", error);
        return undefined; // Zwracamy undefined w razie błędu
    }
}


/**
 * Funkcja mapująca dane karty Scryfall na CardType, przyjmująca opcjonalne, 
 * już pobrane, dane tokenów. (Pozostawiona bez zmian)
 */
function mapScryfallDataToCardType(data: ScryfallCardData, tokens?: TokenData[]): CardType {
    const isDfc = data.card_faces && data.card_faces.length === 2;

    const primaryFace = isDfc ? data.card_faces![0] : data;
    const secondFace = isDfc ? data.card_faces![1] : undefined;

    const primaryImage = isDfc ? primaryFace.image_uris?.normal : getCardImageUrl(data);
    const primaryLoyalty = primaryFace.type_line?.includes("Planeswalker") ? primaryFace.loyalty : null;

    const secondImage = secondFace?.image_uris?.normal;
    const secondLoyalty = secondFace?.type_line?.includes("Planeswalker") ? secondFace.loyalty : null;

    const primaryManaValue = primaryFace.cmc || data.cmc; 
    const secondManaValue = secondFace?.cmc;

    return {
        id: data.id,
        name: primaryFace.name,
        image: primaryImage || undefined,
        mana_cost: primaryFace.mana_cost,
        mana_value: primaryManaValue, 
        type_line: primaryFace.type_line,
        basePower: (primaryFace.power === "*" ? "0" : primaryFace.power) || null,
        baseToughness: (primaryFace.toughness === "*" ? "0" : primaryFace.toughness) || null,
        loyalty: primaryLoyalty,
        
        // Zapisujemy powiązane tokeny bezpośrednio na karcie
        tokens: tokens, 

        hasSecondFace: isDfc,
        secondFaceName: secondFace?.name,
        secondFaceImage: secondImage,
        secondFaceManaCost: secondFace?.mana_cost,
        secondFaceManaValue: secondManaValue, 
        secondFaceTypeLine: secondFace?.type_line,
        secondFaceBasePower: (secondFace?.power === "*" ? "0" : secondFace?.power) || null,
        secondFaceBaseToughness: (secondFace?.toughness === "*" ? "0" : secondFace?.toughness) || null,
        secondFaceLoyalty: secondLoyalty,
    };
}


// ----------------------------------------------------------------------
// 3. KOMPONENT DECKMANAGER
// ----------------------------------------------------------------------
export default function DeckManager() {
    const [query, setQuery] = useState("");
    const [deck, setDeck] = useState<CardType[]>(
        () => {
            try {
                const savedDeck = localStorage.getItem("currentDeck");
                return savedDeck ? JSON.parse(savedDeck) : [];
            } catch {
                return [];
            }
        }
    );
    const [commander, setCommander] = useState<CardType | null>(
        () => {
            try {
                const savedCommander = localStorage.getItem("commander");
                return savedCommander ? JSON.parse(savedCommander) : null;
            } catch {
                return null;
            }
        }
    );
    // NOWY STAN: Lista unikalnych tokenów w całej talii
    const [tokenList, setTokenList] = useState<TokenData[]>(
        () => {
            try {
                const savedTokens = localStorage.getItem("tokenList");
                return savedTokens ? JSON.parse(savedTokens) : [];
            } catch {
                return [];
            }
        }
    );
    const [loading, setLoading] = useState(false);
    const [bulkText, setBulkText] = useState("");

    // Użyj useEffect do aktualizacji localStorage dla tokenList, gdy się zmieni
    useEffect(() => {
        localStorage.setItem("tokenList", JSON.stringify(tokenList));
    }, [tokenList]);

    /**
     * Funkcja aktualizująca globalną listę tokenów.
     * Zapobiega duplikatom po nazwie tokenu.
     * Używa setTokenList, więc nie musi być w useCallback.
     */
    const updateTokenList = (newTokens: TokenData[] | undefined) => {
        if (!newTokens || newTokens.length === 0) return;

        setTokenList(prevList => {
            const currentTokenNames = new Set(prevList.map(t => t.name));
            const uniqueNewTokens = newTokens.filter(token => !currentTokenNames.has(token.name));
            
            if (uniqueNewTokens.length > 0) {
                return [...prevList, ...uniqueNewTokens];
            }
            return prevList;
        });
    };

    /**
     * Funkcja do czyszczenia listy tokenów i ponownego skanowania talii.
     * Zdefiniowana za pomocą useCallback, aby była stabilna.
     * Ma zależności: deck i setTokenList.
     */
    const recomputeTokenList = useCallback(() => {
        const uniqueTokensMap = new Map<string, TokenData>();

        deck.forEach(card => {
            card.tokens?.forEach(token => {
                if (!uniqueTokensMap.has(token.name)) {
                    uniqueTokensMap.set(token.name, token);
                }
            });
        });
        setTokenList(Array.from(uniqueTokensMap.values()));
    }, [deck, setTokenList]); // Dodano deck i setTokenList jako zależności!

    const calculateTotalManaValue = (): number => {
        return deck.reduce((sum, card) => sum + (card.mana_value || 0), 0);
    };

    /**
     * Zmodyfikowano do pobierania szczegółów tokenów ORAZ aktualizacji tokenList
     */
    async function handleAddCard() {
        if (!query.trim()) return;
        setLoading(true);
        try {
            const data: ScryfallCardData = await getCardByName(query.trim());
            
            const tokens = await getTokensData(data); 
            const card: CardType = mapScryfallDataToCardType(data, tokens);

            // AKTUALIZACJA GLOBALNEJ LISTY TOKENÓW
            updateTokenList(tokens);

            const newDeck = [...deck, card];
            setDeck(newDeck);
            localStorage.setItem("currentDeck", JSON.stringify(newDeck));
            setQuery("");
        } catch (err) {
            alert("Nie udało się znaleźć karty.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function handleRemoveCard(id: string) {
        if (commander && commander.id === id) {
            setCommander(null);
            localStorage.removeItem("commander");
        }
        const newDeck = deck.filter((c) => c.id !== id);
        setDeck(newDeck);
        localStorage.setItem("currentDeck", JSON.stringify(newDeck));
        
        // Funkcja recomputeTokenList zostanie automatycznie wywołana
        // przez useEffect poniżej, kiedy zmieni się stan deck.
    }
    
    // Użyj useEffect do ponownego przeliczenia tokenów po zmianie decku
    // Teraz recomputeTokenList jest stabilne i nie musi być w zależnościach
    useEffect(() => {
        recomputeTokenList();
    }, [deck, recomputeTokenList]); // Dodano recomputeTokenList jako zależność (jest to dobra praktyka)


    function handleSetCommander(card: CardType) {
        setCommander(card);
        localStorage.setItem("commander", JSON.stringify(card));
    }

    function handleRemoveCommander() {
        setCommander(null);
        localStorage.removeItem("commander");
    }

    /**
     * Zmodyfikowano do pobierania szczegółów tokenów i aktualizacji tokenList
     */
    async function handleBulkImport() {
        const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
        const newDeck: CardType[] = [];
        const bulkTokens: TokenData[] = [];
        let newCommander: CardType | null = null;
        const uniqueTokenNamesInBulk = new Set<string>();

        setLoading(true);
        try {
            for (const line of lines) {
                const match = line.match(/^(\d+)\s+([^(]+)(?:\s+\(.*\))?/);
                if (!match) continue;

                const count = parseInt(match[1], 10);
                const name = match[2].trim();

                const data: ScryfallCardData = await getCardByName(name);
                
                const tokens = await getTokensData(data);
                const card: CardType = mapScryfallDataToCardType(data, tokens);

                // Zbieranie unikalnych tokenów podczas importu
                if (tokens) {
                    tokens.forEach(token => {
                        if (!uniqueTokenNamesInBulk.has(token.name)) {
                            uniqueTokenNamesInBulk.add(token.name);
                            bulkTokens.push(token);
                        }
                    });
                }

                if (card.type_line?.includes("Legendary Creature") && !newCommander) {
                    newCommander = card;
                }

                for (let i = 0; i < count; i++) {
                    newDeck.push({ ...card, id: `${card.id}-${i}-${Date.now()}` });
                }
            }
            
            // AKTUALIZACJA GLOBALNEJ LISTY TOKENÓW Z PAKIETU
            updateTokenList(bulkTokens);

            setDeck(newDeck);
            setCommander(newCommander);
            localStorage.setItem("currentDeck", JSON.stringify(newDeck));
            if (newCommander) {
                localStorage.setItem("commander", JSON.stringify(newCommander));
            } else {
                localStorage.removeItem("commander");
            }
        } catch (err) {
            alert("Błąd przy imporcie talii.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }
    
    const totalManaValue = calculateTotalManaValue();

    return (
        <div className="deck-manager-container">
            <h1>Deck Manager</h1>
            <p>Dodawaj karty do swojej talii:</p>

            {/* Inputy do dodawania kart */}
            {/* ... (kod inputów) ... */}
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
                    {loading ? "Ładowanie..." : "Dodaj"}
                </button>
            </div>

            {/* Import całego decku */}
            <h2>Import całej talii</h2>
            <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Wklej listę kart (np. 4 Lightning Bolt)"
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
            {/* KONIEC GLOBALNEJ LISTY TOKENÓW */}
            
            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #444' }} />

            {/* lista kart w talii */}
            <h2 style={{ marginTop: "20px" }}>Twoja talia ({deck.length} kart)</h2>
            <p style={{ fontWeight: 'bold' }}>
                Całkowity Mana Value talii: {totalManaValue.toFixed(2)}
            </p>
            <div className="deck-list">
                {deck.map((card) => (
                    <div
                        key={card.id}
                        style={{
                            border: commander && commander.id === card.id ? '2px solid gold' : '1px solid gray',
                            padding: "4px",
                            textAlign: "center",
                            width: "120px",
                        }}
                    >
                        {card.image ? (
                            <img
                                src={card.image}
                                alt={card.name}
                                style={{ width: "100%", height: "auto" }}
                            />
                        ) : (
                            <div style={{ height: "160px" }}>{card.name}</div>
                        )}
                        {/* Wyróżnienie karty DFC */}
                        {card.hasSecondFace && (
                            <p style={{ margin: '4px 0', fontSize: '0.8em', color: 'lightblue' }}>
                                Karta dwustronna
                            </p>
                        )}
                        
                        {/* WYŚWIETLANIE SZCZEGÓŁÓW TOKENÓW ZWIĄZANYCH Z TĄ KARTĄ */}
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
                                onClick={() => handleRemoveCard(card.id)}
                                style={{
                                    padding: "4px 8px",
                                    background: "red",
                                    color: "white",
                                    border: "none",
                                    cursor: "pointer",
                                }}
                            >
                                Usuń
                            </button>
                            <button
                                onClick={() => handleSetCommander(card)}
                                style={{
                                    padding: "4px 8px",
                                    background: "#4CAF50",
                                    color: "white",
                                    border: "none",
                                    cursor: "pointer",
                                }}
                            >
                                Ustaw jako commandera
                            </button>
                        </div>
                    </div>
                ))}
            </div>


            
        </div>
    );
}