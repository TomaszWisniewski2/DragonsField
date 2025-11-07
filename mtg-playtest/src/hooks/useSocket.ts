// src/hooks/useSocket.ts

import { useEffect, useState, useRef, useCallback } from "react";
import io, { Socket } from "socket.io-client";
import type {
 Player,
 Session,
 CardType,
 Zone,
 SessionType,
 SortCriteria,
 TokenData,
} from "../components/types";

export interface SessionStats {
 [code: string]: number;
}

export type { Player, Session, CardType, Zone, SessionType };

// Funkcja pomocnicza do logowania tylko w trybie deweloperskim
const log = (...args: Array<unknown>) => {
 if (process.env.NODE_ENV === "development") {
  console.log(...args);
 }
};

export const useSocket = (serverUrl: string) => {
 const [connected, setConnected] = useState(false);
 const [session, setSession] = useState<Session | null>(null);
 const [playerId, setPlayerId] = useState<string | null>(null);
 const [allSessionStats, setAllSessionStats] = useState<SessionStats>({});
 const [allAvailableTokens, setAllAvailableTokens] = useState<TokenData[]>([]);
 
 const [isMoving, setIsMoving] = useState(false); 
 
 const socketRef = useRef<Socket | null>(null);
 
 // 🛡️ REF 1: Bezpiecznik dla blokady ruchu (isMoving)
 const moveLockTimeoutRef = useRef<NodeJS.Timeout | null>(null);
 // ⚡ REF 2: Debouncing dla aktualizacji stanu
 const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);


 // 🔌 Połączenie z serwerem
 useEffect(() => {
  if (socketRef.current) return; // zapobiega wielokrotnemu łączeniu

  const socket = io(serverUrl, {
   transports: ["websocket"],
   reconnectionAttempts: 9,
   reconnectionDelay: 1000,
  });

  socketRef.current = socket;

  socket.on("connect", () => {
   setConnected(true);
   setPlayerId(socket.id || null);
   log("✅ Połączono z serwerem Socket.IO");
  });

  socket.on("disconnect", (reason) => {
   setConnected(false);
   setSession(null);
   log("❌ Rozłączono:", reason);
  });
  
  socket.on("updateState", (updatedSession: Session) => {
   // 🛡️ 1. Otrzymano odpowiedź z serwera, więc czyścimy "bezpiecznik"
   if (moveLockTimeoutRef.current) {
    clearTimeout(moveLockTimeoutRef.current);
    moveLockTimeoutRef.current = null;
   }
   // Resetujemy flagę ruchu (teraz można wysłać nowy ruch)
   setIsMoving(false); 

   // ⚡ 2. Debouncing: Grupujemy aktualizacje stanu (50ms)
   // Zapobiega "zacinaniu się" UI przy wielu szybkich aktualizacjach
   if (updateTimeoutRef.current) {
    clearTimeout(updateTimeoutRef.current);
   }

   updateTimeoutRef.current = setTimeout(() => {
    setSession(updatedSession);
    log("📥 [AKTUALIZACJA] Aktualizacja sesji:", updatedSession.code);

    // Logika do ekstrakcji tokenów (pozostawiona bez zmian)
    const tokensFromDeck =
     updatedSession.players.find((p) => p.id === socket.id)?.initialDeck
      ?.flatMap((card) => card.tokens || []) || [];

    let tokensFromLocalStorage: TokenData[] = [];
    try {
     const saved = localStorage.getItem("tokenList");
     if (saved) tokensFromLocalStorage = JSON.parse(saved);
    } catch (err) {
     console.error("Błąd parsowania tokenList:", err);
    }

    const uniqueTokens = [...tokensFromDeck, ...tokensFromLocalStorage].filter(
     (token, index, self) =>
      index ===
      self.findIndex(
       (t) =>
        t.name === token.name &&
        t.basePower === token.basePower &&
        t.baseToughness === token.baseToughness
      )
    );

    setAllAvailableTokens((prev) =>
     JSON.stringify(prev) !== JSON.stringify(uniqueTokens)
      ? uniqueTokens
      : prev
    );
   }, 50); // 50ms opóźnienia
  });

  socket.on("forceDisconnect", (message: string) => {
      log(`🔌 Otrzymano przymusowe rozłączenie: ${message}`);
      alert(message); // Poinformuj użytkownika, dlaczego został wyrzucony
      setSession(null); // To spowoduje natychmiastowy powrót do ekranu logowania
    });

  socket.on("updateSessionStats", (stats: SessionStats) => {
   setAllSessionStats(stats);
   log("📊 Statystyki sesji:", stats);
  });

  socket.on("error", (message: string) => {
   console.error("Błąd serwera:", message);
   // Odblokuj interfejs na wypadek błędu ruchu
   setIsMoving(false); 
   if (moveLockTimeoutRef.current) {
    clearTimeout(moveLockTimeoutRef.current);
    moveLockTimeoutRef.current = null;
   }
   if (process.env.NODE_ENV === "development") alert(message);
  });

  return () => {
   log("🧹 Zamykanie połączenia Socket.IO");
   
   // Wyczyść wszystkie aktywne timeouty przy rozłączaniu
   if (moveLockTimeoutRef.current) {
    clearTimeout(moveLockTimeoutRef.current);
   }
   if (updateTimeoutRef.current) {
    clearTimeout(updateTimeoutRef.current);
   }
   
   socket.disconnect();
   socketRef.current = null;
  };
 }, [serverUrl]);

 // 🧭 Uniwersalna funkcja do wysyłania eventów
 const emitEvent = useCallback(
  <T>(eventName: string, payload: T) => {
   const socket = socketRef.current;
   if (socket && socket.connected) {
    socket.emit(eventName, payload);
   } else {
    console.warn(`⚠️ Nie wysłano ${eventName}: brak połączenia.`);
   }
  },
  []
 );

 // 🔁 Wszystkie akcje emitujące do serwera
 const createSession = useCallback(
  (code: string, playerName: string, deck: CardType[], sessionType: SessionType) =>
   emitEvent("createSession", { code, playerName, deck, sessionType }),
  [emitEvent]
 );

const joinSession = useCallback(
  (
   code: string,
   playerName: string,
   deck: CardType[],
   sessionType: SessionType,
   sideboardCards: CardType[],
   commanderCard?: CardType[] | null 
  ) => emitEvent("joinSession", { code, playerName, deck, sessionType, sideboardCards,commanderCard }),
  [emitEvent]
 );

 const startGame = useCallback(
  (code: string, sessionType: SessionType, ) => emitEvent("startGame", { code, sessionType }),
  [emitEvent]
 );

 const draw = useCallback(
  (code: string, playerId: string, count?: number) =>
   emitEvent("draw", { code, playerId, count }),
  [emitEvent]
 );

 const shuffle = useCallback(
  (code: string, playerId: string) => emitEvent("shuffle", { code, playerId }),
  [emitEvent]
 );

 const resetPlayer = useCallback(
  (code: string, playerId: string) => emitEvent("resetPlayer", { code, playerId }),
  [emitEvent]
 );

 const changeLife = useCallback(
  (code: string, playerId: string, newLife: number) =>
   emitEvent("changeLife", { code, playerId, newLife }),
  [emitEvent]
 );

const moveCard = useCallback(
 (
  code: string,
  playerId: string,
  from: Zone,
  to: Zone,
  cardId: string,
  x?: number,
  y?: number,
  position?: number,
  toBottom?: boolean
 ) => {
  // 🛑 1. Zablokuj wysyłanie kolejnych ruchów, jeśli poprzedni się synchronizuje
  if (isMoving) {
   console.warn("⚠️ moveCard() zablokowane: poprzedni ruch w trakcie synchronizacji.");
   return;
  }

  // 🧩 2. Walidacja frontendu
  if (!from) {
   console.warn("⚠️ moveCard() wywołane z pustym `from`!", { code, playerId, from, to, cardId });
   return;
  }
  if (!to) {
   console.warn("⚠️ moveCard() wywołane z pustym `to`!", { code, playerId, from, to, cardId });
   return;
  }

  // 3. Ustaw flagę i wyślij event
  setIsMoving(true); 
  emitEvent("moveCard", { code, playerId, from, to, cardId, x, y, position, toBottom });

  // 🛡️ 4. Ustaw "bezpiecznik" na wypadek braku odpowiedzi
  // Wyczyść stary, jeśli jakimś cudem istnieje
  if (moveLockTimeoutRef.current) {
   clearTimeout(moveLockTimeoutRef.current);
  }
  
  moveLockTimeoutRef.current = setTimeout(() => {
   setIsMoving(false);
   console.warn("🛡️ BEZPIECZNIK: Odblokowano 'isMoving' po 3s braku odpowiedzi serwera.");
  }, 3000); // 3 sekundy

 },
 [emitEvent, isMoving] // isMoving jest potrzebne w zależnościach
);

 const rotateCard = useCallback(
  (code: string, playerId: string, cardId: string) =>
   emitEvent("rotateCard", { code, playerId, cardId }),
  [emitEvent]
 );

 const nextTurn = useCallback(
  (code: string, playerId: string) => emitEvent("nextTurn", { code, playerId }),
  [emitEvent]
 );

 const changeMana = useCallback(
  (code: string, playerId: string, color: keyof Player["manaPool"], newValue: number) =>
   emitEvent("changeMana", { code, playerId, color, newValue }),
  [emitEvent]
 );

 const changeCounters = useCallback(
  (code: string, playerId: string, type: string, newValue: number) =>
   emitEvent("changeCounters", { code, playerId, type, newValue }),
  [emitEvent]
 );

 const incrementCardStats = useCallback(
  (code: string, playerId: string, cardId: string) =>
   emitEvent("increment_card_stats", { code, playerId, cardId }),
  [emitEvent]
 );

 const moveAllCards = useCallback(
  (code: string, playerId: string, from: Zone, to: Zone) =>
   emitEvent("moveAllCards", { code, playerId, from, to }),
  [emitEvent]
 );

 const incrementCardCounters = useCallback(
  (code: string, playerId: string, cardId: string) =>
   emitEvent("increment_card_counters", { code, playerId, cardId }),
  [emitEvent]
 );

 const decreaseCardCounters = useCallback(
  (code: string, playerId: string, cardId: string) =>
   emitEvent("decrease_card_counters", { code, playerId, cardId }),
  [emitEvent]
 );

 const setCardStats = useCallback(
  (code: string, playerId: string, cardId: string, powerValue: number, toughnessValue: number) =>
   emitEvent("set_card_stats", { code, playerId, cardId, powerValue, toughnessValue }),
  [emitEvent]
 );

 const rotateCard180 = useCallback(
  (code: string, playerId: string, cardId: string) =>
   emitEvent("rotateCard180", { code, playerId, cardId }),
  [emitEvent]
 );

 const flipCard = useCallback(
  (code: string, playerId: string, cardId: string) =>
   emitEvent("flipCard", { code, playerId, cardId }),
  [emitEvent]
 );

 const sortHand = useCallback(
  (code: string, playerId: string, criteria: SortCriteria) =>
   emitEvent("sortHand", { code, playerId, criteria }),
  [emitEvent]
 );

 const moveAllCardsToBottomOfLibrary = useCallback(
  (code: string, playerId: string, from: Zone) =>
   emitEvent("moveAllToBottom", { code, playerId, from, to: "library" }),
  [emitEvent]
 );

 const discardRandomCard = useCallback(
  (code: string, playerId: string) => emitEvent("discardRandomCard", { code, playerId }),
  [emitEvent]
 );


 const createToken = useCallback(
  (code: string, playerId: string, tokenData: TokenData) =>
   emitEvent("createToken", { code, playerId, tokenData }),
  [emitEvent]
 );

 const cloneCard = useCallback(
  (code: string, playerId: string, cardId: string) =>
   emitEvent("cloneCard", { code, playerId, cardId }),
  [emitEvent]
 );

 const moveCardToBattlefieldFlipped = useCallback(
  (code: string, playerId: string, cardId: string, from: Zone) =>
   emitEvent("moveCardToBattlefieldFlipped", { code, playerId, cardId, from }),
  [emitEvent]
 );

 const disconnectPlayer = useCallback(
  (code: string, playerId: string) => {
   emitEvent("disconnectPlayer", { code, playerId });
   // 🔌 Natychmiastowy reset UI po opuszczeniu sesji
   setSession(null); 
   log(`🔌 Rozłączono gracza ${playerId} z sesji ${code}.`);
  },
  [emitEvent] // setSession nie jest potrzebne w zależnościach
 );

// 💡 NOWA FUNKCJA EMITUJĄCA
  const forceResetSession = useCallback(
    (code: string) => emitEvent("forceResetSession", { code }),
    [emitEvent]
  );

 return {
  connected,
  session,
  playerId,
  allSessionStats,
  allAvailableTokens,
  isMoving, // Eksportujemy flagę do UI
  createSession,
  joinSession,
  startGame,
  draw,
  shuffle,
  resetPlayer,
  changeLife,
  moveCard,
  rotateCard,
  nextTurn,
  changeMana,
  changeCounters,
  incrementCardStats,
  moveAllCards,
  incrementCardCounters,
  decreaseCardCounters,
  setCardStats,
  rotateCard180,
  flipCard,
  sortHand,
  moveAllCardsToBottomOfLibrary,
  discardRandomCard,
  createToken,
  cloneCard,
  moveCardToBattlefieldFlipped,
  disconnectPlayer,
  forceResetSession,
 };
};