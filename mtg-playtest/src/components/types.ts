// src/components/types.ts
export type Zone =
  | "hand"
  | "library"
  | "battlefield"
  | "graveyard"
  | "exile"
  | "commanderZone"
  | "sideboard";

export type SessionType = "standard" | "commander";

export type SortCriteria = "mana_cost" | "name" | "type_line";

export interface CardType {
  id: string;
  name: string;
  image?: string;
  mana_cost?: string;
  mana_value: number;
  type_line?: string;
  basePower?: string | null;
  baseToughness?: string | null;
  loyalty?: number | null;


  hasSecondFace?: boolean; // Flaga ułatwiająca sprawdzenie, czy karta ma drugą stronę
  secondFaceName?: string;
  secondFaceImage?: string;
  secondFaceManaCost?: string;
  secondFaceManaValue?: number;
  secondFaceTypeLine?: string;
  secondFaceBasePower?: string | null;
  secondFaceBaseToughness?: string | null;
  secondFaceLoyalty?: number | null;

  tokens?: TokenData[]; 
}

export interface TokenData {
    name: string;
    type_line: string;
    basePower?: string | null;
    baseToughness?: string | null;
    image?: string;
    mana_value: number; 
    mana_cost?: string;
}
export interface CardOnField {
  id: string;
  card: CardType;
  x: number;
  y: number;
  rotation: number;
  isFlipped: boolean;
  stats: {
    power: number;
    toughness: number;
  };
  counters: number;
  isToken: boolean;
}

export interface Player {
  id: string;
  name: string;
  life: number;
  initialDeck: CardType[];
  library: CardType[];
  hand: CardType[];
  battlefield: CardOnField[];
  graveyard: CardType[];
  exile: CardType[];
  commanderZone: CardType[];
  commander?: CardType;
  sideboard: CardType[];
  manaPool: {
    W: number;
    U: number;
    B: number;
    R: number;
    G: number;
    C: number;
  };
  counters: { [key: string]: number };
}

export interface Session {
  code: string;
  players: Player[];
  turn: number;
  activePlayer: string;
  sessionType: SessionType;
}

export interface PanelProps {
  onClose: () => void;
  panelRef: React.RefObject<HTMLDivElement | null>;
}
