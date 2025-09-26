// // src/hooks/useGameStore.ts
// import { create } from "zustand";
// import { persist } from "zustand/middleware";
// import type { CardType, CardOnField } from "../components/types";

// export type Player = {
//   id: number;
//   name: string;
//   life: number;
//   library: CardType[];
//   hand: CardType[];
//   battlefield: CardOnField[];
//   graveyard: CardType[];
//   manaPool: { W: number; U: number; B: number; R: number; G: number; C: number };
// };

// export type Zone = "library" | "hand" | "battlefield" | "graveyard";

// type GameState = {
//   players: Player[];
//   turn: number;
//   activePlayer: number;
//   history: string[];
//   startGame: (playerCount: number) => void;
//   resetGame: () => void;
//   moveCard: (
//     playerId: number,
//     from: Zone,
//     to: Zone,
//     cardId: string,
//     x?: number,
//     y?: number
//   ) => void;
//   draw: (playerId: number, count?: number) => void;
// };

// export const useGameStore = create<GameState>()(
//   persist(
//     (set, get) => ({
//       players: [],
//       turn: 1,
//       activePlayer: 0,
//       history: [],

//       startGame: (playerCount: number) => {
//         const deck: CardType[] = JSON.parse(
//           localStorage.getItem("currentDeck") || "[]"
//         );
//         const players: Player[] = Array.from({ length: playerCount }).map(
//           (_, i) => ({
//             id: i,
//             name: `Player ${i + 1}`,
//             life: 20,
//             library: shuffle(deck),
//             hand: [],
//             battlefield: [],
//             graveyard: [],
//             manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 },
//           })
//         );
//         set({ players, turn: 1, activePlayer: 0, history: ["Game started"] });
//         players.forEach((p) => get().draw(p.id, 7));
//       },

//       resetGame: () => {
//         const deck: CardType[] = JSON.parse(
//           localStorage.getItem("currentDeck") || "[]"
//         );
//         const players: Player[] = Array.from({ length: 1 }).map((_, i) => ({
//           id: i,
//           name: `Player ${i + 1}`,
//           life: 20,
//           library: shuffle(deck),
//           hand: [],
//           battlefield: [],
//           graveyard: [],
//           manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 },
//         }));
//         set({ players, turn: 1, activePlayer: 0, history: ["Game reset"] });
//         players.forEach((p) => get().draw(p.id, 7));
//       },

// moveCard: (playerId, from, to, cardId, x, y) => {
//   set((state) => {
//     const players = [...state.players];
//     const player = players[playerId];
//     if (!player) return state;

//     if (from === "battlefield" && to === "battlefield") {
//       // przesunięcie karty na battlefield
//       const cardOnField = player.battlefield.find((c) => c.id === cardId);
//       if (cardOnField) {
//         cardOnField.x = x ?? cardOnField.x;
//         cardOnField.y = y ?? cardOnField.y;
//       }
//       return { players };
//     }

//     const fromZone = player[from] as CardType[];
//     const index = fromZone.findIndex((c) => c.id === cardId);
//     if (index >= 0) {
//       const [card] = fromZone.splice(index, 1);

//       if (to === "battlefield") {
//         const cardOnField: CardOnField = { id: card.id, card, x: x ?? 50, y: y ?? 50 };
//         player.battlefield.push(cardOnField);
//       } else {
//         player[to].push(card);
//       }
//     }

//     return { players };
//   });
// },

//       draw: (playerId, count = 1) => {
//         set((state) => {
//           const players = [...state.players];
//           const player = players[playerId];
//           for (let i = 0; i < count; i++) {
//             const card = player.library.shift();
//             if (card) player.hand.push(card);
//           }
//           return { players };
//         });
//       },
//     }),
//     { name: "game-storage" }
//   )
// );

// function shuffle<T>(array: T[]): T[] {
//   const result = [...array];
//   for (let i = result.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [result[i], result[j]] = [result[j], result[i]];
//   }
//   return result;
// }
