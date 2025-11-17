import { IonIcon } from "@ionic/react";
import { chevronForwardOutline } from "ionicons/icons";
import { TileProps } from "./Tile.types";
import "./Tile.scss";

const Tile = ({ className, icon, title, text }: TileProps) => {
  return (
    <div
      className={`tile ${className || ""}`}
      data-testid={`tile-${title}`}
    >
      <span className="tile-top">
        <span className="tile-icon">
          <IonIcon icon={icon} />
        </span>
        <span className="tile-chevron">
          <IonIcon icon={chevronForwardOutline} />
        </span>
      </span>
      <span className="tile-bottom">
        <strong className="tile-title">{title}</strong>
        <p className="tile-text">{text}</p>
      </span>
    </div>
  );
};
export { Tile };
