// src/api/scryfall.ts
const BASE = "https://api.scryfall.com";
let lastRequest = 0;
const MIN_GAP = 80; // ms (safety margin within 50-100ms)

function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)); }

export async function getCardByName(name: string) {
  const key = `scry_${name.toLowerCase()}`;
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

type ScryfallCard = {
  image_uris?: { normal?: string };
  card_faces?: { image_uris?: { normal?: string } }[];
};

export function getCardImageUrl(cardData: ScryfallCard): string | null {
  return (
    cardData.image_uris?.normal ??
    cardData.card_faces?.[0]?.image_uris?.normal ??
    null
  );
}
