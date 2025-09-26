import { useState } from "react";
import { getCardByName, getCardImageUrl } from "../api/scryfall";
import "./DeckManager.css";
import type { CardType } from "../components/types";

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
            const data = await getCardByName(query.trim());
            
            const card: CardType = {
                id: data.id,
                name: data.name,
                image: getCardImageUrl(data) || undefined,
                mana_cost: data.mana_cost,
                type_line: data.type_line,
                basePower: data.power === "*" ? "0" : data.power,
                baseToughness: data.toughness === "*" ? "0" : data.toughness,
                loyalty: data.type_line.includes("Planeswalker") ? data.loyalty : null,
            };

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
                const match = line.match(/^(\d+)\s+([^(]+)(?:\s+\(.*\))?/);
                if (!match) continue;

                const count = parseInt(match[1], 10);
                const name = match[2].trim();

                const data = await getCardByName(name);
                
                const card: CardType = {
                    id: data.id,
                    name: data.name,
                    image: getCardImageUrl(data) || undefined,
                    mana_cost: data.mana_cost,
                    type_line: data.type_line,
                    basePower: data.power === "*" ? "0" : data.power,
                    baseToughness: data.toughness === "*" ? "0" : data.toughness,
                    loyalty: data.type_line.includes("Planeswalker") ? data.loyalty : null,
                };
                
                if (data.type_line.includes("Legendary Creature") && !newCommander) {
                    newCommander = card;
                }

                for (let i = 0; i < count; i++) {
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