// src/types/index.ts

// ----------------------------------------------------------------------
// 1. TYPY DANYCH APLIKACJI
// ----------------------------------------------------------------------

export interface TokenData {
    name: string;
    type_line: string;
    basePower: string | null;
    baseToughness: string | null;
    image: string | undefined;
    mana_value?: number;
    mana_cost?: string;
}

export interface CardType {
    id: string; // Unikalne ID kopii karty
    name: string;
    image: string | undefined;
    mana_cost?: string;
    mana_value: number;
    type_line: string;
    basePower: string | null;
    baseToughness: string | null;
    loyalty: number | null;
    tokens?: TokenData[];
    hasSecondFace: boolean; // Zawsze true dla uproszczenia obracania

    // Druga strona (dla DFC, Split, Adventure - nawet jeśli pusta)
    secondFaceName?: string;
    secondFaceImage?: string;
    secondFaceManaCost?: string;
    secondFaceManaValue?: number;
    secondFaceTypeLine?: string;
    secondFaceBasePower: string | null;
    secondFaceBaseToughness: string | null;
    secondFaceLoyalty: number | null;
}

// ----------------------------------------------------------------------
// 2. INTERFEJSY SCYRFALL
// ----------------------------------------------------------------------

export interface ScryfallRelatedPart {
    object: string;
    id: string;
    component: string; // 'token' jest kluczowy
    name: string;
    type_line: string;
    uri: string; // URI do pobrania pełnych danych tokenu
}

export interface ScryfallCardFace {
    name: string;
    mana_cost: string;
    type_line: string;
    cmc: number;
    power?: string;
    toughness?: string;
    loyalty?: number;
    image_uris?: {
        normal: string;
    };
}

export interface ScryfallCardData {
    id: string;
    name: string;
    mana_cost?: string;
    type_line?: string;
    cmc: number;
    power?: string;
    toughness?: string;
    loyalty?: number;
    image_status: string;
    image_uris?: {
        normal: string;
    };
    card_faces?: ScryfallCardFace[];
    all_parts?: ScryfallRelatedPart[];
    layout?: string;
}