// useDeckManager.ts
import { useState, useEffect, useCallback, useMemo } from "react";
// Importy z DeckManager.tsx
import { getCardByName, getCardImageUrl, getCardByURI, getCardBySetAndNumber } from "../api/scryfall";
import type { CardType, TokenData } from "../components/types";
import type { ScryfallCardData} from "./DeckManagerComponents/DeckTypes";

// ----------------------------------------------------------------------
// 1. STAŁE
// ----------------------------------------------------------------------
const MISSING_IMAGE_URL = "https://assets.moxfield.net/assets/images/missing-image.png";

export const STATIC_TOKENS: CardType[] = [
    // ----------------------------------------------------------------------
    // 1. Treasure (Jednostronny)
    { 
        id: "static-treasure", 
        name: "Treasure", 
        type_line: "Artifact Token", 
        image: "https://cards.scryfall.io/large/front/b/b/bbe8bced-9524-47f6-a600-bf4ddc072698.jpg?1562539795", 
        basePower: null, baseToughness: null, 
        mana_value: 0, mana_cost: undefined,
        
        hasSecondFace: false,
    },
    // ----------------------------------------------------------------------
    // 2. Start Your Engines! (Jednostronny Marker/Karta)
    // UWAGA: Mimo że nie jest to oficjalny token statusu, definiujemy go jako CardType.
    { 
        id: "static-start-engines", 
        name: "Start Your Engines!", 
        type_line: "Status Marker", 
        image: "https://cards.scryfall.io/large/front/8/2/82613de6-ed37-48c1-8d2f-d91a3f496794.jpg?1739184127", 
        basePower: null, baseToughness: null, 
        mana_value: 0, mana_cost: undefined,
        
        hasSecondFace: false,
    },
    // ----------------------------------------------------------------------
    // 3. The Ring (Jednostronny Status)
    { 
        id: "static-the-ring", 
        name: "The Ring", 
        type_line: "Status Token", 
        image: "https://cards.scryfall.io/large/front/7/2/7215460e-8c06-47d0-94e5-d1832d0218af.jpg?1742651318", 
        basePower: null, baseToughness: null, 
        mana_value: 0, mana_cost: undefined,
        
        hasSecondFace: false,
    },
    // ----------------------------------------------------------------------
    // 4. Day/Night (Dwustronny Status)
    { 
        id: "static-daynight", 
        name: "Day", 
        type_line: "Status Token", 
        image: "https://cards.scryfall.io/large/front/9/c/9c0f7843-4cbb-4d0f-8887-ec823a9238da.jpg?1644880530", 
        basePower: null, baseToughness: null, 
        mana_value: 0, mana_cost: undefined,

        hasSecondFace: true, 
        secondFaceName: "Night",
        // Rewers (Night) używa tej samej karty, zmieniając 'front' na 'back'
        secondFaceImage: "https://cards.scryfall.io/large/back/9/c/9c0f7843-4cbb-4d0f-8887-ec823a9238da.jpg?1644880530", 
        secondFaceManaValue: 0,
        secondFaceTypeLine: "Status Token",
    },
    // ----------------------------------------------------------------------
    // 5. City's Blessing (Jednostronny Status)
    { 
        id: "static-city-blessing", 
        name: "City's Blessing", 
        type_line: "Status Token", 
        image: "https://cards.scryfall.io/large/front/b/a/ba64ed3e-93c5-406f-a38d-65cc68472122.jpg?1691108010", 
        basePower: null, baseToughness: null, 
        mana_value: 0, mana_cost: undefined,
        
        hasSecondFace: false,
    },
    // ----------------------------------------------------------------------
    // 6. The Monarch (Jednostronny Status)
    { 
        id: "static-the-monarch", 
        name: "The Monarch", 
        type_line: "Status Token", 
        image: "https://cards.scryfall.io/large/front/4/0/40b79918-22a7-4fff-82a6-8ebfe6e87185.jpg?1680498245", 
        basePower: null, baseToughness: null, 
        mana_value: 0, mana_cost: undefined,
        
        hasSecondFace: false,
    },
    // ----------------------------------------------------------------------
    // 7. The Initiative (Dwustronny Status/Dungeon)
    { 
        id: "static-initiative", 
        name: "The Initiative", 
        type_line: "Status Token", 
        // Awers - sam status 'The Initiative'
        image: "https://cards.scryfall.io/large/front/2/c/2c65185b-6cf0-451d-985e-56aa45d9a57d.jpg?1707897435", 
        basePower: null, baseToughness: null, 
        mana_value: 0, mana_cost: undefined,
        
        hasSecondFace: true, 
        secondFaceName: "The Undercity",
        // Rewers - Dungeony The Undercity
        secondFaceImage: "https://cards.scryfall.io/large/back/2/c/2c65185b-6cf0-451d-985e-56aa45d9a57d.jpg?1707897435", 
        secondFaceManaValue: 0,
        secondFaceTypeLine: "Dungeon",
    },
    // ----------------------------------------------------------------------
    // 8. Foretell (Jednostronny Status)
    { 
        id: "static-foretell", 
        name: "Foretell", 
        type_line: "Status Token", 
        image: "https://cards.scryfall.io/large/front/f/b/fb02637f-1385-4d3d-8dc0-de513db7633a.jpg?1615690969", 
        basePower: null, baseToughness: null, 
        mana_value: 0, mana_cost: undefined,
        
        hasSecondFace: false,
    },
];

function mapCardToToken(card: CardType): TokenData {
    return {
        name: card.name,
        // 💡 Poprawka: Zapewnienie, że type_line jest zawsze stringiem.
        type_line: card.type_line || 'Token', 
        
        basePower: card.basePower,
        baseToughness: card.baseToughness,
        image: card.image,
        mana_value: card.mana_value,
        mana_cost: card.mana_cost,
    };
}
// ----------------------------------------------------------------------
// 2. FUNKCJE POMOCNICZE (MOŻNA JE WYEKSPORTOWAĆ LUB POZOSTAWIĆ W PLIKU)
// ----------------------------------------------------------------------

/**
 * Asynchroniczna funkcja do pobierania szczegółowych danych tokenów
 * na podstawie URI z pola all_parts.
 */
export async function getTokensData(data: ScryfallCardData): Promise<TokenData[]> {
    // Brak powiązanych części = brak tokenów/emblematów
    if (!data.all_parts) return [];

    //console.log("All parts:", data.all_parts);
    // Pobieramy tokeny i emblematy z all_parts
    const tokenUris = data.all_parts
        .filter(
            part =>
                part.component === "token" ||
                part.type_line?.toLowerCase().includes("emblem")
        )
        .map(part => part.uri);

    // Jeśli nic nie znaleziono – kończymy
    if (tokenUris.length === 0) return [];

    // Pobieramy wszystkie dane tokenów/emblematów
    const rawTokensData = await Promise.all(
        tokenUris.map(async (uri) => {
            try {
                const tokenData = await getCardByURI(uri);
                return tokenData;
            } catch (e) {
                console.warn("Błąd pobierania tokenu/emblemu z Scryfall:", e);
                return null;
            }
        })
    );

    // Mapujemy dane na nasz wewnętrzny format TokenData
    const tokens: TokenData[] = rawTokensData
        .filter((t): t is ScryfallCardData => t !== null)
        .map((tokenData) => {
            const isEmblem = tokenData.type_line?.toLowerCase().includes("emblem");

            return {
                name: tokenData.name,
                type_line: isEmblem ? "Emblem" : (tokenData.type_line || ""),
                basePower:
                    tokenData.power === "*"
                        ? "0"
                        : tokenData.power ?? null,
                baseToughness:
                    tokenData.toughness === "*"
                        ? "0"
                        : tokenData.toughness ?? null,
                image: getCardImageUrl(tokenData) ?? undefined,
                mana_value: tokenData.cmc,
                mana_cost: tokenData.mana_cost,
            };
        });

    return tokens;
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
    // ZMIANA: commander jest tablicą
    commander: CardType[];
    tokenList: TokenData[];
    query: string;
    bulkText: string;
    loading: boolean;
    setQuery: (query: string) => void;
    setBulkText: (text: string) => void;
    handleAddCard: () => Promise<void>;
    handleRemoveCard: (id: string, isSideboard?: boolean) => void;
    handleToggleCardLocation: (card: CardType, isSideboard: boolean) => void;
    // ZMIANA: Handlery przyjmują teraz CardType do usunięcia
    handleSetCommander: (card: CardType) => void;
    handleRemoveCommander: (card: CardType) => void;
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
    // ZMIANA: Stan commandera jest teraz tablicą (CardType[])
    const [commander, setCommander] = useState<CardType[]>(
        () => {
            try {
                const savedCommander = localStorage.getItem("commander");
                if (!savedCommander) return [];
                
                const parsed = JSON.parse(savedCommander);
                
                // Obsługa migracji ze starego formatu (pojedyncza karta)
                if (Array.isArray(parsed)) {
                    return parsed;
                } else if (parsed && typeof parsed === 'object') {
                    return [parsed]; // Jeśli to stara, pojedyncza karta, zamień na tablicę
                }
                
                return [];
            } catch {
                return [];
            }
        }
    );
const [staticTokens] = useState<TokenData[]>(STATIC_TOKENS.map(mapCardToToken));

// Dynamiczne tokeny (dodawane przez karty)
const [dynamicTokens, setDynamicTokens] = useState<TokenData[]>(() => {
    try {
        // Używamy "dynamicTokens" zamiast "tokenList" do przechowywania *tylko* generowanych tokenów
        const savedDynamic = JSON.parse(localStorage.getItem("dynamicTokens") || "[]");
        return savedDynamic;
    } catch {
        return [];
    }
});

// Dla zachowania kompatybilności — łączona lista (dynamiczne + statyczne)
const tokenList = useMemo(() => {
    // Upewniamy się, że nie ma duplikatów (nazwy statyczne + dynamiczne)
    const combined = [...dynamicTokens, ...staticTokens];
    const uniqueTokens = new Map<string, TokenData>();
    for (const token of combined) {
        if (!uniqueTokens.has(token.name)) {
            uniqueTokens.set(token.name, token);
        }
    }
    return Array.from(uniqueTokens.values());
}, [dynamicTokens, staticTokens]);

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

    setDynamicTokens(prevList => {
        const currentNames = new Set(prevList.map(t => t.name));
        // Dodajemy tylko tokeny, których jeszcze nie mamy (po nazwie)
        const uniqueNewTokens = newTokens.filter(t => !currentNames.has(t.name));
        return uniqueNewTokens.length > 0 ? [...prevList, ...uniqueNewTokens] : prevList;
    });
}, []);

    /**
     * Funkcja do czyszczenia listy dynamicznych tokenów i ponownego skanowania talii.
     */
const recomputeTokenList = useCallback(() => {
    const tokenMap = new Map<string, TokenData>();
    // ZMIANA: Skanujemy tokeny ze wszystkich kart, wliczając commandery
    const allCards = [...deck, ...sideboard, ...commander];

    // Dodajemy tokeny ze wszystkich kart, w tym commanderów
    allCards.forEach(card => {
        card.tokens?.forEach(token => {
            if (!tokenMap.has(token.name)) {
                tokenMap.set(token.name, token);
            }
        });
    });

    setDynamicTokens(Array.from(tokenMap.values()));
}, [deck, sideboard, commander]);

    // ----------------------------------------------------------------------
    // SIDE EFFECTS (useEffect)
    // ----------------------------------------------------------------------
    
    useEffect(() => {
        localStorage.setItem("currentSideboard", JSON.stringify(sideboard));
    }, [sideboard]);
    
    useEffect(() => {
        localStorage.setItem("currentDeck", JSON.stringify(deck));
    }, [deck]);

    // ZMIANA: Zapis commandera
    useEffect(() => {
        if (commander.length > 0) {
            localStorage.setItem("commander", JSON.stringify(commander));
        } else {
            localStorage.removeItem("commander");
        }
    }, [commander]);

    useEffect(() => {
        // Ponowne przeliczenie tokenów po zmianie decku, sideboardu lub commandera
        recomputeTokenList();
    }, [deck, sideboard, commander, recomputeTokenList]); 
    
    useEffect(() => {
        localStorage.setItem("dynamicTokens", JSON.stringify(dynamicTokens));
    }, [dynamicTokens]);
    
    // ----------------------------------------------------------------------
    // OBSŁUGA ZDARZEŃ (HANDLERY)
    // ----------------------------------------------------------------------

    const calculateTotalManaValue = (): number => {
        // Liczymy tylko karty z głównej talii
        return deck.reduce((sum, card) => sum + (card.mana_value || 0), 0);
    };

    /**
     * Obsługa dodawania pojedynczej karty.
     */
    const handleAddCard = useCallback(async () => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            const data: ScryfallCardData = await getCardByName(query.trim());

            const tokens = await getTokensData(data);
            const card: CardType = mapScryfallDataToCardType(data, tokens);

            updateTokenList(tokens);

            // Nowe karty trafiają do głównej talii
            // Używamy unikalnego ID dla instancji karty
            const newDeck = [...deck, { ...card, id: `${card.id}-${Date.now()}` }]; 
            setDeck(newDeck);
            setQuery("");
        } catch (err) {
            alert("Nie udało się znaleźć karty.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [query, deck, updateTokenList]);

    /**
     * Funkcja do usuwania karty z dowolnej listy (Deck lub Sideboard).
     */
const handleRemoveCard = useCallback((id: string, isSideboard: boolean = false) => {
        if (isSideboard) {
            setSideboard(prevSideboard => prevSideboard.filter((c) => c.id !== id));
        } else {
            setDeck(prevDeck => prevDeck.filter((c) => c.id !== id));
        }

        // ZMIANA: Usuwamy kartę z listy commanderów, jeśli jej ID pasuje
        setCommander(prevCommanders => prevCommanders.filter(c => c.id !== id));
        
        // TokenList i localStorage są aktualizowane przez useEffect/recomputeTokenList
    }, []);

    /**
     * Funkcja do przenoszenia karty między taliami.
     */
    const handleToggleCardLocation = useCallback((card: CardType, isSideboard: boolean) => {
        if (isSideboard) {
            // Przenieś z Sideboard do Deck
            setSideboard(prevSideboard => prevSideboard.filter(c => c.id !== card.id));
            setDeck(prevDeck => [...prevDeck, card]);
        } else {
            // Przenieś z Deck do Sideboard
            setDeck(prevDeck => prevDeck.filter(c => c.id !== card.id));
            setSideboard(prevSideboard => [...prevSideboard, card]);
            
            // ZMIANA: Jeśli przenoszona jest commander, usuwamy go z listy commanderów
            setCommander(prevCommanders => prevCommanders.filter(c => c.id !== card.id));
        }
    }, []);

    /**
     * ZMIANA: Dodaje kartę do listy commanderów.
     */
    const handleSetCommander = useCallback((card: CardType) => {
        // Dodaj kartę do listy commanderów tylko, jeśli jej tam nie ma (sprawdzamy po unikalnym ID)
        setCommander(prevCommanders => {
            if (prevCommanders.some(c => c.id === card.id)) {
                return prevCommanders;
            }
            return [...prevCommanders, card];
        });
        
        // Zapewnienie, że commander jest w głównej talii
        setSideboard(prevSideboard => prevSideboard.filter(c => c.id !== card.id));
        if (!deck.some(c => c.id === card.id)) {
            setDeck(prevDeck => [...prevDeck, card]);
        }
    }, [deck]);

    /**
     * ZMIANA: Usuwa KONKRETNĄ kartę z listy commanderów.
     */
    const handleRemoveCommander = useCallback((cardToRemove: CardType) => {
        // Filtrujemy listę, usuwając kartę o pasującym ID instancji
        setCommander(prevCommanders => prevCommanders.filter(c => c.id !== cardToRemove.id));
    }, []);
    
    /**
     * Obsługa masowego importu.
     */
    async function handleBulkImport() {
        // 1. Regex do precyzyjnego pobierania: ILOŚĆ NAZWA (SET) NUMER
        const preciseCardLineRegex = /^(\d+)\s+(.+?)\s+\(([A-Z0-9]+)\)\s+([A-Z0-9\-\\/]+)$/;

        // 2. Poprawiony Regex do fallbacku: ILOŚĆ NAZWA (opcjonalny SET) (opcjonalny NUMER lub inne śmieci, które ignorujemy)
        // Zauważ, że usunięto grupę dla numeru, aby uniknąć problemów
        const basicCardLineRegex = /^(\d+)\s+(.+?)(?:\s+\(([A-Z0-9]+)\))?/;

        // 3. NOWY Regex do pobierania tylko po NAZWIE (ignorując set i numer)
        const bareNameLineRegex = /^(\d+)\s+(.+)$/;

        const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
        const newDeck: CardType[] = [];
        const newSideboard: CardType[] = [];
        const bulkTokens: TokenData[] = [];
        // ZMIANA: newCommanders to tablica
        const newCommanders: CardType[] = []; 
        const uniqueTokenNamesInBulk = new Set<string>();
        // 💡 NOWOŚĆ: Śledzenie, które karty (po Scryfall ID) już zostały dodane jako dowódcy
        const commanderBaseIdsInBulk = new Set<string>();
        let isCommanderAlreadySet = false;
        let isSideboardSection = false;
//-----------------------------------------------------------------------------------
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
            } catch { // Usunięto deklarację 'error'
                // console.warn(`Nie udało się pobrać karty (SET/NUMER): ${line}. Próba nazwy. Błąd: ${error}`);
            }
        }
                
                // 2. Fallback do pobierania po NAZWIE + (ewentualnie SET)
                if (!data) {
                    const basicMatch = line.match(basicCardLineRegex);
                    if (basicMatch) {
                        const baseName = basicMatch[2].trim(); 
                        const setCode = basicMatch[3]; 
                        
                        let scryfallQuery = baseName;
                        // Usuwamy wszystko, co jest za nawiasem, np. numer kolekcjonerski, *F*
                        let finalName = baseName.replace(/\s+\(.*?\)/g, ''); // Usuń (SET)
                        finalName = finalName.replace(/\s+[A-Z0-9\-\\/]+(?=\s|$)/g, '') // Usuń NUMER
                                              .replace(/\s+\*?[FNG]+\*?$/i, '') // Usuń *F* / *NF*
                                              .trim();

                        if (setCode) {
                            scryfallQuery = `${finalName} set:${setCode}`;
                        } else {
                            scryfallQuery = finalName;
                        }
                        
                        try {
                            data = await getCardByName(scryfallQuery);
                        } catch  {
                            // console.error(`Nie udało się pobrać karty (Nazwa/SET): ${line}. Błąd: ${error}`);
                        }
                    }
                }

                // 3. Najprostszy Fallback: Wyszukiwanie tylko po samej nazwie karty
if (!data) {
    const bareMatch = line.match(bareNameLineRegex);
    if (bareMatch) {
        let namePart = bareMatch[2].trim(); 

        // Usuwamy wszystkie niepożądane znaczniki, które Scryfall może zinterpretować źle.
        namePart = namePart.replace(/\s+\(.*?\)/g, '') // Usuń (SET)
                         .replace(/\s+[A-Z0-9\-\\/]+(?=\s|$)/g, '') // Usuń NUMER
                         .replace(/\s+\*?[FNG]+\*?$/i, '') // Usuń *F* / *NF*
                         .trim();
        
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

// ZMIANA: Sprawdzanie i dodawanie commandera do listy (tylko w głównej talii)
                if (!isSideboardSection && card.type_line?.includes("Legendary Creature")) {
                    const commanderBaseId = card.id; // To jest ID Scryfall karty

                    // 💡 Zmieniony WARUNEK: Sprawdzamy, czy commander został już ustawiony
                    if (!isCommanderAlreadySet) {
                        // Dodajemy pierwszą znalezioną kartę jako commandera
                        
                        // Musimy użyć unikalnego ID dla instancji commandera (aby powiązać ją z kopią w Decku)
                        const newCommanderInstance: CardType = { 
                            ...card, 
                            id: `${commanderBaseId}-${Date.now()}-commander` 
                        };

                        newCommanders.push(newCommanderInstance);
                        
                        // 💡 WAŻNE: Ustawiamy flagę na true po dodaniu pierwszego
                        isCommanderAlreadySet = true;
                        
                        // Zapisujemy ID Scryfall, aby móc użyć tej samej instancji w talii
                        commanderBaseIdsInBulk.add(card.id); 
                    }
                }

                // Dodawanie kart do odpowiedniej listy z odpowiednią ilością kopii
                for (let i = 0; i < count; i++) {
                    
                    // Sprawdzamy, czy aktualnie dodawana karta jest instancją commandera, która została już utworzona
                    const commanderInstance = newCommanders.find(c => c.id.startsWith(card.id));
                    
                    // Logika: Jeśli to jest pierwsza kopia i jest commanderem, użyj instancji commandera (o specjalnym ID)
                    const isCommanderCopy = (i === 0 && !isSideboardSection && !!commanderInstance);
                    
                    const uniqueCard: CardType = isCommanderCopy
                        ? commanderInstance!
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
            // ZMIANA: Ustawienie tablicy commanderów
            setCommander(newCommanders); 

            setBulkText(""); 
        } catch (error) {
            alert(`Błąd krytyczny podczas importu talii. (Błąd: ${error instanceof Error ? error.message : "Nieznany błąd"})`);
            console.error(error);
        } finally {
            setLoading(false);
        }
    }
//------------------------------------------------------------------------------

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
            localStorage.removeItem("dynamicTokens"); // Zmiana z "tokenList" na "dynamicTokens"

            // 3. Resetowanie stanów komponentu
            setDeck([]);
            setSideboard([]); 
            setCommander([]); // ZMIANA: Reset na pustą tablicę
            setDynamicTokens([])
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