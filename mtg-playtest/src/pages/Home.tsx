import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <h1>MTG Playtest</h1>
      <p>Witaj! Wybierz co chcesz zrobić:</p>
      <ul>
        <li>
          <Link to="/playtest" className="nav-button" style={{ margin: "1rem" }}>Rozpocznij playtest</Link>
        </li>
        <li>
          <Link to="/decks" className="nav-button" style={{ margin: "1rem" }}>Zarządzaj taliami</Link>
        </li>
      </ul>
    </div>
  );
}
