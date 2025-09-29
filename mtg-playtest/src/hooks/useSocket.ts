// src/hooks/useSocket.ts

import { useEffect, useState, useRef, useCallback } from "react";
import io, { Socket } from "socket.io-client";
import type { Player, Session, CardType, CardOnField, Zone, SessionType } from "../components/types";


export interface SessionStats {
 [code: string]: number; // Klucz to kod sesji, wartość to liczba graczy
}
// Eksportujemy typy, aby były dostępne dla innych komponentów
export type { Player, Session, CardType, CardOnField, Zone, SessionType };

export const useSocket = (serverUrl: string) => {
    const [connected, setConnected] = useState(false);
    const [session, setSession] = useState<Session | null>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [allSessionStats, setAllSessionStats] = useState<SessionStats>({});
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const socket = io(serverUrl);
        socketRef.current = socket;

        socket.on("connect", () => {
            setConnected(true);
            // Sprawdzamy, czy socket.id istnieje przed ustawieniem stanu
            if (socket.id) {
                setPlayerId(socket.id);
            } else {
                setPlayerId(null);
            }
            console.log("Połączono z serwerem Socket.io");
        });

        socket.on("disconnect", () => {
            setConnected(false);
            setSession(null);
            console.log("Rozłączono z serwerem Socket.io");
        });

        socket.on("updateState", (updatedSession: Session) => {
            setSession(updatedSession);
            console.log("Otrzymano aktualizację stanu sesji");
        });

         // NOWE NASŁUCHIWANIE NA STATYSTYKI
        socket.on("updateSessionStats", (stats: SessionStats) => {
            setAllSessionStats(stats);
            console.log("Otrzymano aktualne statystyki sesji:", stats);
        });

        socket.on("error", (message: string) => {
            console.error("Błąd serwera:", message);
            alert(message);
        });

        return () => {
            socket.disconnect();
        };
    }, [serverUrl]);

    const emitEvent = useCallback(<T>(eventName: string, payload: T) => {
        if (socketRef.current && connected) {
            socketRef.current.emit(eventName, payload);
        } else {
            console.warn("Nie można wysłać zdarzenia, ponieważ brak połączenia z serwerem.");
        }
    }, [connected]);

    const createSession = useCallback((code: string, playerName: string, deck: CardType[], sessionType: SessionType) => {
        emitEvent("createSession", { code, playerName, deck, sessionType });
    }, [emitEvent]);

    const joinSession = useCallback((code: string, playerName: string, deck: CardType[], sessionType: SessionType) => {
        emitEvent("joinSession", { code, playerName, deck, sessionType });
    }, [emitEvent]);

    const startGame = useCallback((code: string, sessionType: SessionType) => {
        emitEvent("startGame", { code, sessionType });
    }, [emitEvent]);

    const draw = useCallback((code: string, playerId: string, count?: number) => {
        emitEvent("draw", { code, playerId, count });
    }, [emitEvent]);

    const shuffle = useCallback((code: string, playerId: string) => {
        emitEvent("shuffle", { code, playerId });
    }, [emitEvent]);

    const resetPlayer = useCallback((code: string, playerId: string) => {
        emitEvent("resetPlayer", { code, playerId });
    }, [emitEvent]);

    const changeLife = useCallback((code: string, playerId: string, newLife: number) => {
        emitEvent("changeLife", { code, playerId, newLife });
    }, [emitEvent]);

    const moveCard = useCallback((code: string, playerId: string, from: Zone, to: Zone, cardId: string, x?: number, y?: number) => {
        emitEvent("moveCard", { code, playerId, from, to, cardId, x, y });
    }, [emitEvent]);

    const rotateCard = useCallback((code: string, playerId: string, cardId: string) => {
        emitEvent("rotateCard", { code, playerId, cardId });
    }, [emitEvent]);

    const nextTurn = useCallback((code: string, playerId: string) => {
        emitEvent("nextTurn", { code, playerId });
    }, [emitEvent]);

    const changeMana = useCallback((code: string, playerId: string, color: keyof Player["manaPool"], newValue: number) => {
        emitEvent("changeMana", { code, playerId, color, newValue });
    }, [emitEvent]);
    
    const changeCounters = useCallback((code: string, playerId: string, type: string, newValue: number) => {
        emitEvent("changeCounters", { code, playerId, type, newValue });
    }, [emitEvent]);

    const incrementCardStats = useCallback((code: string, playerId: string, cardId: string) => {
        emitEvent("increment_card_stats", { code, playerId, cardId });
    }, [emitEvent]);

    const moveAllCards = useCallback((code: string, playerId: string, from: Zone, to: Zone) => {
        emitEvent("moveAllCards", { code, playerId, from, to });
    }, [emitEvent]);

    const incrementCardCounters = useCallback((code: string, playerId: string, cardId: string) => {
        emitEvent("increment_card_counters", { code, playerId, cardId });
    }, [emitEvent]);

        const decreaseCardCounters = useCallback((code: string, playerId: string, cardId: string) => {
        emitEvent("decrease_card_counters", { code, playerId, cardId });
    }, [emitEvent]);

  return {
    connected,
    session,
    playerId,
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
    allSessionStats,
    incrementCardCounters,
    decreaseCardCounters,
        // DODANIE NOWEJ FUNKCJI DO ZWRACANEGO OBIEKTU
        moveAllCards,
  };
};