// src/api/scryfall.ts
const BASE = "https://api.scryfall.com";
let lastRequest = 0;
const MIN_GAP = 80; // ms (safety margin within 50-100ms)

function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)); }

/**
 * Pobiera dane karty po nazwie (z rozmyciem) lub z pamięci podręcznej.
 */
export async function getCardByName(name: string) {
  const key = `scry_name_${name.toLowerCase()}`;
  const cached = localStorage.getItem(key);
  if (cached) return JSON.parse(cached);

  const now = Date.now();
  const delta = now - lastRequest;
  if (delta < MIN_GAP) await sleep(MIN_GAP - delta);

  const res = await fetch(`${BASE}/cards/named?fuzzy=${encodeURIComponent(name)}`);
  lastRequest = Date.now();
  if (!res.ok) throw new Error(`Scryfall: ${res.status}`);
  const data = await res.json();
  // store compact version
  localStorage.setItem(key, JSON.stringify(data));
  return data;
}

/**
 * NOWA FUNKCJA: Pobiera dane karty po kodzie dodatku i numerze kolekcjonerskim.
 */
export async function getCardBySetAndNumber(setCode: string, collectorNumber: string) {
  const key = `scry_setnum_${setCode.toLowerCase()}_${collectorNumber}`;
  const cached = localStorage.getItem(key);
  if (cached) return JSON.parse(cached);

  const now = Date.now();
  const delta = now - lastRequest;
  if (delta < MIN_GAP) await sleep(MIN_GAP - delta);

  // Użycie punktu końcowego /cards/:code/:number
  const res = await fetch(`${BASE}/cards/${setCode}/${encodeURIComponent(collectorNumber)}`);
  lastRequest = Date.now();
  
  if (!res.ok) {
    // Rzucenie błędu, jeśli karta nie została znaleziona
    throw new Error(`Scryfall: Card not found by Set/Number: ${setCode}/${collectorNumber} (Status: ${res.status})`);
  }
  
  const data = await res.json();
  // store compact version
  localStorage.setItem(key, JSON.stringify(data));
  return data;
}

/**
 * Pobiera dane karty (lub tokenu) bezpośrednio przez Scryfall URI
 */
export async function getCardByURI(uri: string) {
    const key = `scry_uri_${uri}`; // Klucz buforowania oparty na pełnym URI
    const cached = localStorage.getItem(key);
    if (cached) return JSON.parse(cached);

    const now = Date.now();
    const delta = now - lastRequest;
    if (delta < MIN_GAP) await sleep(MIN_GAP - delta);

    // Zapytanie jest bezpośrednio do URI, który otrzymaliśmy z pola all_parts
    const res = await fetch(uri);
    lastRequest = Date.now();
    
    if (!res.ok) throw new Error(`Scryfall: Token/URI error: ${res.status}`);
    
    const data = await res.json();
    // store compact version
    localStorage.setItem(key, JSON.stringify(data));
    return data;
}

type ScryfallCard = {
  image_uris?: { normal?: string };
  card_faces?: { image_uris?: { normal?: string } }[];
};

/**
 * Zwraca URL obrazu karty (priorytet: normal, potem pierwsza strona DFC).
 */
export function getCardImageUrl(cardData: ScryfallCard): string | null {
  return (
    cardData.image_uris?.normal ??
    cardData.card_faces?.[0]?.image_uris?.normal ??
    null
  );
}