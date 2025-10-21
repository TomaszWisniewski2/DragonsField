// useDeckManager.ts
import { useState, useEffect, useCallback } from "react";
// Importy z DeckManager.tsx
import { getCardByName, getCardImageUrl, getCardByURI, getCardBySetAndNumber } from "../api/scryfall";
import type { CardType, TokenData } from "../components/types";
import type { ScryfallCardData} from "./DeckManagerComponents/DeckTypes";

// ----------------------------------------------------------------------
// 1. STAŁE
// ----------------------------------------------------------------------
const MISSING_IMAGE_URL = "https://assets.moxfield.net/assets/images/missing-image.png";

// ----------------------------------------------------------------------
// 2. FUNKCJE POMOCNICZE (MOŻNA JE WYEKSPORTOWAĆ LUB POZOSTAWIĆ W PLIKU)
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
 * Funkcja mapująca dane karty Scryfall na CardType.
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
// 3. GŁÓWNY HOOK: useDeckManager
// ----------------------------------------------------------------------
interface DeckManagerHook {
    deck: CardType[];
    sideboard: CardType[];
    commander: CardType | null;
    tokenList: TokenData[];
    query: string;
    bulkText: string;
    loading: boolean;
    setQuery: (query: string) => void;
    setBulkText: (text: string) => void;
    handleAddCard: () => Promise<void>;
    handleRemoveCard: (id: string, isSideboard?: boolean) => void;
    handleToggleCardLocation: (card: CardType, isSideboard: boolean) => void;
    handleSetCommander: (card: CardType) => void;
    handleRemoveCommander: () => void;
    handleBulkImport: () => Promise<void>;
    handleClearStorage: () => void;
    calculateTotalManaValue: () => number;
}


export function useDeckManager(): DeckManagerHook {
    // ----------------------------------------------------------------------
    // STANY
    // ----------------------------------------------------------------------
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
    const [bulkText, setBulkText] = useState("");

    // ----------------------------------------------------------------------
    // FUNKCJE POMOCNICZE W HOOKU
    // ----------------------------------------------------------------------

    /**
     * Funkcja aktualizująca globalną listę tokenów.
     */
    const updateTokenList = useCallback((newTokens: TokenData[] | undefined) => {
        if (!newTokens || newTokens.length === 0) return;

        setTokenList(prevList => {
            const currentTokenNames = new Set(prevList.map(t => t.name));
            const uniqueNewTokens = newTokens.filter(token => !currentTokenNames.has(token.name));

            if (uniqueNewTokens.length > 0) {
                return [...prevList, ...uniqueNewTokens];
            }
            return prevList;
        });
    }, []);

    /**
     * Funkcja do czyszczenia listy tokenów i ponownego skanowania talii.
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
    }, [deck, sideboard]); 

    // ----------------------------------------------------------------------
    // SIDE EFFECTS (useEffect)
    // ----------------------------------------------------------------------

    // Użyj useEffect do aktualizacji localStorage
    useEffect(() => {
        localStorage.setItem("tokenList", JSON.stringify(tokenList));
    }, [tokenList]);

    useEffect(() => {
        localStorage.setItem("currentSideboard", JSON.stringify(sideboard));
    }, [sideboard]);
    
    // Specjalne useEffect dla decku (można również ręcznie w handleAddCard/handleRemoveCard)
    useEffect(() => {
        localStorage.setItem("currentDeck", JSON.stringify(deck));
    }, [deck]);

    useEffect(() => {
        // Ponowne przeliczenie tokenów po zmianie decku lub sideboardu
        recomputeTokenList();
    }, [deck, sideboard, recomputeTokenList]); 
    
    useEffect(() => {
        if (commander) {
            localStorage.setItem("commander", JSON.stringify(commander));
        } else {
            localStorage.removeItem("commander");
        }
    }, [commander]);
    
    // ----------------------------------------------------------------------
    // OBSŁUGA ZDARZEŃ (HANDLERY)
    // ----------------------------------------------------------------------

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

            // Nowe karty trafiają do głównej talii
            const newDeck = [...deck, { ...card, id: `${card.id}-${Date.now()}` }]; // Dodajemy unikalne ID
            setDeck(newDeck);
            // localStorage.setItem("currentDeck", JSON.stringify(newDeck)); // Już jest w useEffect
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
        }

        if (isSideboard) {
            setSideboard(prevSideboard => prevSideboard.filter((c) => c.id !== id));
        } else {
            setDeck(prevDeck => prevDeck.filter((c) => c.id !== id));
        }
        // TokenList i localStorage są aktualizowane przez useEffect/recomputeTokenList
    }

    /**
     * Funkcja do przenoszenia karty między taliami.
     */
    function handleToggleCardLocation(card: CardType, isSideboard: boolean) {
        if (isSideboard) {
            // Przenieś z Sideboard do Deck
            setSideboard(prevSideboard => prevSideboard.filter(c => c.id !== card.id));
            setDeck(prevDeck => [...prevDeck, card]);
        } else {
            // Przenieś z Deck do Sideboard
            setDeck(prevDeck => prevDeck.filter(c => c.id !== card.id));
            setSideboard(prevSideboard => [...prevSideboard, card]);
            
            // Jeśli przenoszona jest commander, usuwamy go z commandera
            if (commander && commander.id === card.id) {
                setCommander(null);
            }
        }
    }

    function handleSetCommander(card: CardType) {
        setCommander(card);
        
        // Jeśli commander jest w sideboardzie, usuń go stamtąd
        if (sideboard.some(c => c.id === card.id)) {
            setSideboard(prevSideboard => prevSideboard.filter(c => c.id !== card.id));
            setDeck(prevDeck => [...prevDeck, card]);
        }
        // Upewnij się, że commander jest w talii (jeśli nie był nigdzie)
        if (!deck.some(c => c.id === card.id) && !sideboard.some(c => c.id === card.id)) {
             setDeck(prevDeck => [...prevDeck, card]);
        }
    }

    function handleRemoveCommander() {
        setCommander(null);
    }
    
    /**
     * Obsługa masowego importu.
     */
    async function handleBulkImport() {
        // 1. Regex do precyzyjnego pobierania: ILOŚĆ NAZWA (SET) NUMER
        const preciseCardLineRegex = /^(\d+)\s+(.+?)\s+\(([A-Z0-9]+)\)\s+([A-Z0-9\-\\/]+)$/;

        // 2. Poprawiony Regex do fallbacku: ILOŚĆ NAZWA (opcjonalny SET) (opcjonalny NUMER lub inne śmieci, które ignorujemy)
        const basicCardLineRegex = /^(\d+)\s+(.+?)(?:\s+\(([A-Z0-9]+)\))?(?:\s+[A-Z0-9\-\\/]+)?$/;

        // 3. NOWY Regex do pobierania tylko po NAZWIE (ignorując set i numer)
        const bareNameLineRegex = /^(\d+)\s+(.+)$/;

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

                // 3. Najprostszy Fallback: Wyszukiwanie tylko po samej nazwie karty
if (!data) {
    const bareMatch = line.match(bareNameLineRegex);
    if (bareMatch) {
        let namePart = bareMatch[2].trim(); // np. "Mountain (EOE) 265 *F*"

        // Usunięcie wszystkich niepożądanych znaczników, które Scryfall może zinterpretować źle.
        // Usuwa (SET), NUMER, *F*
        namePart = namePart.replace(/\s+\(.*?\)/g, '') // Usuń (SET)
                           .replace(/\s+[A-Z0-9\-\\/]+(?=\s|$)/g, '') // Usuń NUMER
                           .replace(/\s+\*?[FNG]+\*?$/i, '') // Usuń *F* / *NF*
                           .trim();
        
        // Z "Mountain (EOE) 265 *F*" pozostanie tylko "Mountain"

        if (namePart) {
            try {
                data = await getCardByName(namePart); 
            } catch (error) {
                console.error(`Nie udało się pobrać karty (Tylko Nazwa - oczyszczona): ${line}. Błąd: ${error}`);
            }
        }
    }
}

                if (!data) {
                    console.error(`Ostatecznie nie udało się pobrać danych dla linii: ${line}`);
                    continue; 
                }


                // LOGIKA DODAWANIA KARTY
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
                    // UWAGA: Ustawiamy commandera na pierwszą znalezioną legendary creature w sekcji głównej talii.
                    // Card musi mieć unikalne ID (zgodne z resztą talii)
                    newCommander = { ...card, id: `${card.id}-${Date.now()}-commander` };
                }

                // Dodawanie kart do odpowiedniej listy z odpowiednią ilością kopii
                for (let i = 0; i < count; i++) {
                    // Upewniamy się, że commander nie jest dodawany dwa razy jeśli był w linii 1,
                    // ale musi być dodany, jeśli nie został oznaczony jako commander.
                    const isCommanderCopy = newCommander && card.id === newCommander.id && i === 0 && !isSideboardSection;
                    
                    const uniqueCard: CardType = isCommanderCopy
                        ? newCommander!
                        : { ...card, id: `${card.id}-${i}-${Date.now()}` }; 

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
            setSideboard(newSideboard); 
            setCommander(newCommander);

            setBulkText(""); 
        } catch (error) {
            alert(`Błąd krytyczny podczas importu talii. (Błąd: ${error instanceof Error ? error.message : "Nieznany błąd"})`);
            console.error(error);
        } finally {
            setLoading(false);
        }
    }


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
            localStorage.removeItem("currentSideboard"); 
            localStorage.removeItem("commander");
            localStorage.removeItem("tokenList");

            // 3. Resetowanie stanów komponentu
            setDeck([]);
            setSideboard([]); 
            setCommander(null);
            setTokenList([]);
            setBulkText("");
            setQuery("");
            alert("Talia, Sideboard i cache kart zostały usunięte z pamięci lokalnej.");
        }
    };
    // ----------------------------------------------------------------------
    // ZWRACANE WARTOŚCI
    // ----------------------------------------------------------------------
    return {
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
    };
}