import React from "react";
import type { CardType } from "./types";
import "./CardPreview.css";

interface CardPreviewProps {
  card: CardType;
}

const CardPreview: React.FC<CardPreviewProps> = ({ card }) => {
  return (
    <div className="card-preview-container">
      <img src={card.image} alt={card.name} className="card-preview-image" />
    </div>
  );
};

export default CardPreview;