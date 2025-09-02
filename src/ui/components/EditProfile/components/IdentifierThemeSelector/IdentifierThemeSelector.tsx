import { IonCard, IonCol, IonGrid, IonIcon, IonRow } from "@ionic/react";
import { checkmark } from "ionicons/icons";
import "./IdentifierThemeSelector.scss";
import {
  IdentifierThemeSelectorProps,
  ThemeItemProps,
} from "./IdentifierThemeSelector.types";
import { CardTheme } from "../../../CardTheme";

const IdentifierThemeSelector = ({
  color,
  selectedTheme,
  setSelectedTheme,
}: IdentifierThemeSelectorProps) => {
  const Checkmark = () => {
    return (
      <div
        className="selected-theme-checkmark"
        data-testid="selected-theme-checkmark"
      >
        <div className="selected-theme-checkmark-inner">
          <IonIcon
            slot="icon-only"
            icon={checkmark}
          />
        </div>
      </div>
    );
  };

  const Circle = () => {
    return (
      <div
        className="unselected-theme-circle"
        data-testid="unselected-theme-circle"
      />
    );
  };

  const ThemeItem = ({ index, color }: ThemeItemProps) => {
    return (
      <IonCol className={`${selectedTheme === index ? "selected-theme" : ""}`}>
        <IonCard
          onClick={() => setSelectedTheme(index)}
          data-testid={`identifier-theme-selector-item-${index}`}
          className={`theme-input card-theme-${color}`}
        >
          <div>
            <CardTheme
              color={color}
              layout={index}
            />
          </div>
          {selectedTheme === index ? <Checkmark /> : <Circle />}
        </IonCard>
      </IonCol>
    );
  };

  return (
    <IonGrid
      className="identifier-theme-selector"
      data-testid="identifier-theme-selector"
    >
      <IonRow className="identifier-theme-input">
        <ThemeItem
          color={color}
          index={0}
        />
        <ThemeItem
          color={color}
          index={1}
        />
      </IonRow>
      <IonRow className="identifier-theme-input">
        <ThemeItem
          color={color}
          index={2}
        />
        <ThemeItem
          color={color}
          index={3}
        />
      </IonRow>
    </IonGrid>
  );
};

export { IdentifierThemeSelector };
