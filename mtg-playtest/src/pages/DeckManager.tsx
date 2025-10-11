import { useState } from "react";
// Zakładam, że w pliku api/scryfall.ts masz funkcje:
// getCardByName(name: string): Promise<ScryfallCardData>
// getCardImageUrl(data: ScryfallCardData): string | null
import { getCardByName, getCardImageUrl } from "../api/scryfall";
import "./DeckManager.css";
import type { CardType } from "../components/types";

// Wymaga zdefiniowania oczekiwanej struktury danych ze Scryfall, 
// przynajmniej w minimalnym zakresie potrzebnym do pobierania.
// Ta struktura jest uproszczona i nie jest pełną definicją Scryfall API.
// Powinieneś mieć ten typ w pliku `../api/scryfall.ts` lub podobnym.
// Na potrzeby tego przykładu, zakładam że wygląda to mniej więcej tak:
interface ScryfallCardFace {
    name: string;
    mana_cost: string;
    type_line: string;
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
    power?: string;
    toughness?: string;
    loyalty?: number;
    image_status: string;
    image_uris?: {
        normal: string;
    };
    // NOWOŚĆ: Pole dla kart DFC
    card_faces?: ScryfallCardFace[];
}

/**
 * Funkcja pomocnicza do pobierania danych karty z pojedynczej strony
 * (albo głównej strony, albo strony z card_faces)
 */
function mapScryfallDataToCardType(data: ScryfallCardData): CardType {
    // 1. Bezpieczne sprawdzenie, czy karta jest DFC
    const isDfc = data.card_faces && data.card_faces.length === 2;

    // 2. Bezpieczne przypisanie stron (używamy operatora '!' tylko po sprawdzeniu isDfc)
    const primaryFace = isDfc ? data.card_faces![0] : data;
    const secondFace = isDfc ? data.card_faces![1] : undefined;

    // Pobieranie obrazka dla pierwszej strony
    // Używamy opcjonalnego łańcuchowania (?.), aby bezpiecznie uzyskać obrazek
    const primaryImage = isDfc ? primaryFace.image_uris?.normal : getCardImageUrl(data);
    const primaryLoyalty = primaryFace.type_line?.includes("Planeswalker") ? primaryFace.loyalty : null;

    // Dane dla drugiej strony (jeśli istnieje)
    const secondImage = secondFace?.image_uris?.normal;
    const secondLoyalty = secondFace?.type_line?.includes("Planeswalker") ? secondFace.loyalty : null;

    return {
        id: data.id,
        // Używamy nazwy pierwszej strony dla głównej nazwy karty w Twoim obiekcie CardType
        name: primaryFace.name,
        image: primaryImage || undefined,
        mana_cost: primaryFace.mana_cost,
        type_line: primaryFace.type_line,
        // DFC data.power/toughness są na stronach, non-DFC są na obiekcie głównym (data)
        basePower: (primaryFace.power === "*" ? "0" : primaryFace.power) || null,
        baseToughness: (primaryFace.toughness === "*" ? "0" : primaryFace.toughness) || null,
        loyalty: primaryLoyalty,

        // Dane DFC
        hasSecondFace: isDfc,
        secondFaceName: secondFace?.name,
        secondFaceImage: secondImage,
        secondFaceManaCost: secondFace?.mana_cost,
        secondFaceTypeLine: secondFace?.type_line,
        secondFaceBasePower: (secondFace?.power === "*" ? "0" : secondFace?.power) || null,
        secondFaceBaseToughness: (secondFace?.toughness === "*" ? "0" : secondFace?.toughness) || null,
        secondFaceLoyalty: secondLoyalty,
    };
}

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
    const [loading, setLoading] = useState(false);
    const [bulkText, setBulkText] = useState("");

    async function handleAddCard() {
        if (!query.trim()) return;
        setLoading(true);
        try {
            // Dane zwracane przez Scryfall API
            const data: ScryfallCardData = await getCardByName(query.trim());

            // Używamy nowej funkcji mapującej
            const card: CardType = mapScryfallDataToCardType(data);

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
    }

    function handleSetCommander(card: CardType) {
        setCommander(card);
        localStorage.setItem("commander", JSON.stringify(card));
    }

    function handleRemoveCommander() {
        setCommander(null);
        localStorage.removeItem("commander");
    }

    async function handleBulkImport() {
        const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
        const newDeck: CardType[] = [];
        let newCommander: CardType | null = null;

        setLoading(true);
        try {
            for (const line of lines) {
                // ... (reszta logiki parsowania jest bez zmian)
                const match = line.match(/^(\d+)\s+([^(]+)(?:\s+\(.*\))?/);
                if (!match) continue;

                const count = parseInt(match[1], 10);
                const name = match[2].trim();

                // Dane zwracane przez Scryfall API
                const data: ScryfallCardData = await getCardByName(name);

                // Używamy nowej funkcji mapującej
                const card: CardType = mapScryfallDataToCardType(data);

                // Sprawdzamy typ linii karty (pierwszej strony)
                if (card.type_line?.includes("Legendary Creature") && !newCommander) {
                    newCommander = card;
                }

                for (let i = 0; i < count; i++) {
                    // Generujemy unikalne ID dla każdej kopii karty
                    newDeck.push({ ...card, id: `${card.id}-${i}-${Date.now()}` });
                }
            }

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

    return (
        <div className="deck-manager-container">
            <h1>Deck Manager</h1>
            <p>Dodawaj karty do swojej talii:</p>

            {/* input do pojedynczej karty */}
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

            {/* import całego decku */}
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
                    {/* Nowość: Obrazek commandera */}
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

            {/* lista kart w talii */}
            <h2 style={{ marginTop: "20px" }}>Twoja talia ({deck.length} kart)</h2>
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