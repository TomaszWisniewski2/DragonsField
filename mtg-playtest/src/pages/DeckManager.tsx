import { useState, useEffect, useCallback } from "react";
// Zakładam, że w pliku api/scryfall.ts masz funkcje:
// getCardByName(name: string): Promise<ScryfallCardData>
// getCardImageUrl(data: ScryfallCardData): string | null
// ORAZ: getCardByURI(uri: string): Promise<ScryfallCardData>
import { getCardByName, getCardImageUrl, getCardByURI, getCardBySetAndNumber } from "../api/scryfall";
import "./DeckManager.css";
// Importujemy CardType i TokenData z pliku types
import type { CardType, TokenData } from "../components/types";

// ----------------------------------------------------------------------
// 1. DEFINICJE INTERFEJSÓW SCYRFALL (BEZ ZMIAN)
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
    // Kluczowe pole do rozróżnienia typów kart dwustronnych/wielopołówkowych
    layout?: string;
}

// ----------------------------------------------------------------------
// 2. FUNKCJE POMOCNICZE (BEZ ZMIANY MAPOWANIA)
// ----------------------------------------------------------------------

/**
 * Asynchroniczna funkcja do pobierania szczegółowych danych tokenów
 * na podstawie URI z pola all_parts.
 */
const MISSING_IMAGE_URL = "https://assets.moxfield.net/assets/images/missing-image.png";
async function getTokensData(data: ScryfallCardData): Promise<TokenData[] | undefined> {
    if (!data.all_parts) return undefined;

    const tokenUris = data.all_parts
        .filter(part => part.component === 'token')
        .map(token => token.uri);

    if (tokenUris.length === 0) return undefined;

    try {
        const tokenDataPromises = tokenUris.map(uri => getCardByURI(uri));
        const rawTokensData = await Promise.all(tokenDataPromises);

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
        return undefined;
    }
}


/**
 * Funkcja mapująca dane karty Scryfall na CardType, z logiką
 * obsługi obrazków dla kart Split, Adventure i DFC.
 */
function mapScryfallDataToCardType(data: ScryfallCardData, tokens?: TokenData[]): CardType {
    // Karta jest DFC (Double-Faced Card) TYLKO, gdy layout wymaga obracania
    const isDfcLayout = ['transform', 'modal_dfc', 'flip'].includes(data.layout || '');
    const isDfc = data.card_faces && data.card_faces.length === 2 && isDfcLayout;

    // Dla kart Split/Adventure/Normal, obiekt 'data' jest stroną główną
    const primaryFace = isDfc ? data.card_faces![0] : data;
    const secondFace = isDfc ? data.card_faces![1] : undefined;

    // LOGIKA OBRAZKA PIERWSZEJ STRONY
    const primaryImage = isDfc
        ? primaryFace.image_uris?.normal
        : getCardImageUrl(data);

    const primaryLoyalty = primaryFace.type_line?.includes("Planeswalker") ? primaryFace.loyalty : null;

    // Definicje stałych dla brakującej strony
    const fallbackSecondFaceName = "Odwrotna strona (Brak)";
    const fallbackSecondFaceTypeLine = "Karta bez drugiej strony";

    // 1. Inicjalizacja zmiennych dla drugiej strony na podstawie danych Scryfall
    let finalSecondFaceImage = secondFace?.image_uris?.normal;
    let finalSecondFaceName = secondFace?.name;
    let finalSecondFaceManaCost = secondFace?.mana_cost;
    let finalSecondFaceManaValue = secondFace?.cmc;
    let finalSecondFaceTypeLine = secondFace?.type_line;

    // Inicjalizacja statystyk i lojalności (używa || null, co jest bezpieczne)
    let finalSecondFaceBasePower: string | null = (secondFace?.power === "*" ? "0" : secondFace?.power) || null;
    let finalSecondFaceBaseToughness: string | null = (secondFace?.toughness === "*" ? "0" : secondFace?.toughness) || null;
    let finalSecondFaceLoyalty: number | null = secondFace?.type_line?.includes("Planeswalker")
        ? (secondFace.loyalty ?? null)
        : null;


    if (!secondFace) {
        // B) Karta JEST jednostronna - nadpisujemy wartościami domyślnymi
        finalSecondFaceImage = MISSING_IMAGE_URL;
        finalSecondFaceName = fallbackSecondFaceName;
        finalSecondFaceTypeLine = fallbackSecondFaceTypeLine;

        // Pola, które w CardType są T | undefined, muszą pozostać undefined
        finalSecondFaceManaCost = undefined;
        finalSecondFaceManaValue = undefined;

        // Statystyki, które są T | null, ustawiamy na null
        finalSecondFaceBasePower = "0";
        finalSecondFaceBaseToughness = "0";
        finalSecondFaceLoyalty = null;
    }

    // 2. Zwracanie obiektu z bezpiecznym mapowaniem na typy CardType.
    // Pola oczekujące T | undefined nie używają ?? null, aby uniknąć błędu typowania.
    return {
        id: data.id,
        name: primaryFace.name,
        image: primaryImage || undefined,
        mana_cost: primaryFace.mana_cost,
        mana_value: primaryFace.cmc || data.cmc,
        type_line: primaryFace.type_line,
        basePower: (primaryFace.power === "*" ? "0" : primaryFace.power) || null,
        baseToughness: (primaryFace.toughness === "*" ? "0" : primaryFace.toughness) || null,
        loyalty: primaryLoyalty,

        tokens: tokens,

        // 💡 Ustawiamy na TRUE, aby każda karta mogła być odwrócona.
        hasSecondFace: true,

        // Pola oczekujące T | undefined: przypisujemy bezpośrednio (wartości nie-DFC to undefined)
        secondFaceName: finalSecondFaceName,
        secondFaceImage: finalSecondFaceImage,
        secondFaceManaCost: finalSecondFaceManaCost,
        secondFaceManaValue: finalSecondFaceManaValue,
        secondFaceTypeLine: finalSecondFaceTypeLine,

        // Pola oczekujące T | null (lub T | null | undefined): używamy ?? null dla pewności
        secondFaceBasePower: finalSecondFaceBasePower,
        secondFaceBaseToughness: finalSecondFaceBaseToughness,
        secondFaceLoyalty: finalSecondFaceLoyalty ?? null,
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
    // 💡 NOWY STAN DLA SIDEBOARDU
    const [sideboard, setSideboard] = useState<CardType[]>(
        () => {
            try {
                const savedSideboard = localStorage.getItem("currentSideboard");
                return savedSideboard ? JSON.parse(savedSideboard) : [];
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
    // 💡 Zmieniamy pole bulkText na pole, które obsługuje rozdzielenie Deck/Sideboard
    const [bulkText, setBulkText] = useState("");

    // Użyj useEffect do aktualizacji localStorage
    useEffect(() => {
        localStorage.setItem("tokenList", JSON.stringify(tokenList));
    }, [tokenList]);

    // 💡 Aktualizacja localStorage dla Sideboardu
    useEffect(() => {
        localStorage.setItem("currentSideboard", JSON.stringify(sideboard));
    }, [sideboard]);

    /**
     * Funkcja aktualizująca globalną listę tokenów (teraz uwzględnia sideboard).
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
     * Funkcja do czyszczenia listy tokenów i ponownego skanowania talii (teraz uwzględnia sideboard).
     */
    const recomputeTokenList = useCallback(() => {
        const uniqueTokensMap = new Map<string, TokenData>();

        // Skanowanie głównej talii i sideboardu
        [...deck, ...sideboard].forEach(card => {
            card.tokens?.forEach(token => {
                if (!uniqueTokensMap.has(token.name)) {
                    uniqueTokensMap.set(token.name, token);
                }
            });
        });
        setTokenList(Array.from(uniqueTokensMap.values()));
    }, [deck, sideboard, setTokenList]); // 💡 Zmieniono zależności na deck i sideboard

    const calculateTotalManaValue = (): number => {
        return deck.reduce((sum, card) => sum + (card.mana_value || 0), 0);
    };

    /**
     * Obsługa dodawania pojedynczej karty.
     */
    async function handleAddCard() {
        if (!query.trim()) return;
        setLoading(true);
        try {
            const data: ScryfallCardData = await getCardByName(query.trim());

            const tokens = await getTokensData(data);
            const card: CardType = mapScryfallDataToCardType(data, tokens);

            updateTokenList(tokens);

            // 💡 Nowe karty trafiają do głównej talii
            const newDeck = [...deck, { ...card, id: `${card.id}-${Date.now()}` }]; // Dodajemy unikalne ID
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

    /**
     * Funkcja do usuwania karty z dowolnej listy (Deck lub Sideboard).
     */
    function handleRemoveCard(id: string, isSideboard: boolean = false) {
        if (commander && commander.id === id) {
            setCommander(null);
            localStorage.removeItem("commander");
        }

        if (isSideboard) {
            const newSideboard = sideboard.filter((c) => c.id !== id);
            setSideboard(newSideboard);
        } else {
            const newDeck = deck.filter((c) => c.id !== id);
            setDeck(newDeck);
        }
        // localStorage jest aktualizowany w useEffect, ale dla decku musimy to zrobić tu, 
        // jeśli to nie jest tylko useEffect (dla decku jest odświeżany po dodaniu, więc dla usuwania 
        // też powinniśmy) - jednak rezygnujemy z ręcznego update w tym miejscu, 
        // polegając na recomputeTokenList + useEffects.
    }

    /**
     * Funkcja do przenoszenia karty między taliami.
     */
    function handleToggleCardLocation(card: CardType, isSideboard: boolean) {
        if (isSideboard) {
            // Przenieś z Sideboard do Deck
            const newSideboard = sideboard.filter(c => c.id !== card.id);
            setSideboard(newSideboard);
            setDeck(prevDeck => [...prevDeck, card]);
        } else {
            // Przenieś z Deck do Sideboard
            const newDeck = deck.filter(c => c.id !== card.id);
            setDeck(newDeck);
            setSideboard(prevSideboard => [...prevSideboard, card]);
        }
    }


    // Użyj useEffect do ponownego przeliczenia tokenów po zmianie decku lub sideboardu
    useEffect(() => {
        recomputeTokenList();
    }, [deck, sideboard, recomputeTokenList]); // 💡 Dodano sideboard do zależności

    function handleSetCommander(card: CardType) {
        setCommander(card);
        localStorage.setItem("commander", JSON.stringify(card));
        
        // 💡 Jeśli commander jest w sideboardzie, usuń go stamtąd
        if (sideboard.some(c => c.id === card.id)) {
            setSideboard(prevSideboard => prevSideboard.filter(c => c.id !== card.id));
        }
        // 💡 Upewnij się, że commander jest w talii, jeśli był tylko w sideboardzie
        if (!deck.some(c => c.id === card.id) && !sideboard.some(c => c.id === card.id)) {
             setDeck(prevDeck => [...prevDeck, card]);
        }
    }

    function handleRemoveCommander() {
        setCommander(null);
        localStorage.removeItem("commander");
    }

    /**
     * Obsługa masowego importu.
     * 💡 Zmodyfikowana logika, by rozdzielić Deck i Sideboard na podstawie klucza "SIDEBOARD:".
     */
    async function handleBulkImport() {
        const preciseCardLineRegex = /^(\d+)\s+(.+?)\s+\(([A-Z0-9]+)\)\s+([A-Z0-9\-\\/]+)$/;
        const basicCardLineRegex = /^(\d+)\s+(.+?)(?:\s+\(([A-Z0-9]+)\))?$/;

        const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
        const newDeck: CardType[] = [];
        const newSideboard: CardType[] = [];
        const bulkTokens: TokenData[] = [];
        let newCommander: CardType | null = null;
        const uniqueTokenNamesInBulk = new Set<string>();

        let isSideboardSection = false;

        setLoading(true);
        try {
            for (const line of lines) {
                // 💡 Sprawdzanie, czy linia oznacza początek sideboardu
                if (line.toUpperCase() === "SIDEBOARD:") {
                    isSideboardSection = true;
                    continue;
                }
                
                let data: ScryfallCardData | null = null;
                const countMatch = line.match(/^(\d+)/);
                if (!countMatch) continue;

                const count = parseInt(countMatch[1], 10);
                
                // ... (Logika pobierania danych karty, bez zmian) ...
                
                // 1. Próba precyzyjnego pobrania (SET + NUMER)
                const preciseMatch = line.match(preciseCardLineRegex);
                if (preciseMatch) {
                    const setCode = preciseMatch[3]; 
                    const collectorNumber = preciseMatch[4];
                    try {
                        data = await getCardBySetAndNumber(setCode, collectorNumber);
                    } catch (error) { 
                        console.warn(`Nie udało się pobrać karty (SET/NUMER): ${line}. Próba nazwy. Błąd: ${error}`);
                    }
                }
                
                // 2. Fallback do pobierania po NAZWIE + (ewentualnie SET)
                if (!data) {
                    const basicMatch = line.match(basicCardLineRegex);
                    if (basicMatch) {
                        const baseName = basicMatch[2].trim();
                        const setCode = basicMatch[3]; 
                        
                        let scryfallQuery = baseName;
                        if (setCode) {
                            scryfallQuery += ` set:${setCode}`;
                        }
                        
                        try {
                            data = await getCardByName(scryfallQuery);
                        } catch (error) {
                            console.error(`Nie udało się pobrać karty (Nazwa/SET): ${line}. Błąd: ${error}`);
                        }
                    }
                }

                if (!data) {
                    console.error(`Ostatecznie nie udało się pobrać danych dla linii: ${line}`);
                    continue; 
                }


                // LOGIKA DODAWANIA KARTY (taka jak poprzednio)
                const tokens = await getTokensData(data);
                const card: CardType = mapScryfallDataToCardType(data, tokens);

                // Zbieranie unikalnych tokenów
                if (tokens) {
                    tokens.forEach(token => {
                        if (!uniqueTokenNamesInBulk.has(token.name)) {
                            uniqueTokenNamesInBulk.add(token.name);
                            bulkTokens.push(token);
                        }
                    });
                }

                // Sprawdzanie i ustawianie commandera (tylko w głównej talii)
                if (!isSideboardSection && card.type_line?.includes("Legendary Creature") && !newCommander) {
                    newCommander = card;
                }

                // Dodawanie kart do odpowiedniej listy z odpowiednią ilością kopii
                for (let i = 0; i < count; i++) {
                    const uniqueCard = { ...card, id: `${card.id}-${i}-${Date.now()}` };
                    if (isSideboardSection) {
                        newSideboard.push(uniqueCard);
                    } else {
                        newDeck.push(uniqueCard);
                    }
                }
            }
            
            // Zakończenie importu
            updateTokenList(bulkTokens);

            setDeck(newDeck);
            setSideboard(newSideboard); // 💡 Zapisywanie sideboardu
            setCommander(newCommander);

            // Zapisywanie w localStorage
            localStorage.setItem("currentDeck", JSON.stringify(newDeck));
            localStorage.setItem("currentSideboard", JSON.stringify(newSideboard)); // 💡 Zapisywanie sideboardu
            if (newCommander) {
                localStorage.setItem("commander", JSON.stringify(newCommander));
            } else {
                localStorage.removeItem("commander");
            }
            setBulkText(""); 
        } catch (error) {
            alert(`Błąd krytyczny podczas importu talii. (Błąd: ${error instanceof Error ? error.message : "Nieznany błąd"})`);
            console.error(error);
        } finally {
            setLoading(false);
        }
    }
    //--------------------------------------------------------------------------------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------
    // ZAKTUALIZOWANA FUNKCJA DO CZYSZCZENIA (Z CZYSZCZENIEM SIDEBOARDU)
    // ----------------------------------------------------------------------
    const handleClearStorage = () => {
        if (window.confirm("Czy na pewno chcesz usunąć całą talię (w tym commandera, tokeny) ORAZ cały cache wyszukiwania kart Scryfall z pamięci lokalnej?")) {

            // 1. ITERACJA I USUWANIE CACHE'U KART 
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);

                if (key &&  key.startsWith("scry")) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });

            // 2. USUWANIE GŁÓWNYCH KLUCZY TALII, SIDEBOARDU I TOKENÓW
            localStorage.removeItem("currentDeck");
            localStorage.removeItem("currentSideboard"); // 💡 Usuwanie klucza sideboardu
            localStorage.removeItem("commander");
            localStorage.removeItem("tokenList");

            // 3. Resetowanie stanów komponentu
            setDeck([]);
            setSideboard([]); // 💡 Resetowanie stanu sideboardu
            setCommander(null);
            setTokenList([]);
            setBulkText("");
            setQuery("");
            alert("Talia, Sideboard i cache kart zostały usunięte z pamięci lokalnej.");
        }
    };
    // ----------------------------------------------------------------------


    const totalManaValue = calculateTotalManaValue();

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
            
            {/* {card.hasSecondFace && (
                <p style={{ margin: '4px 0', fontSize: '0.8em', color: 'lightblue' }}>
                    Karta dwustronna
                </p>
            )} */}

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