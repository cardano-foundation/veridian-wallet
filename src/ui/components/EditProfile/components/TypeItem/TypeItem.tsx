import { IonCard } from "@ionic/react";
import { TypeItemProps } from "./TypeItem.types";
import "./TypeItem.scss";

const TypeItem = ({
  dataTestId,
  index,
  text,
  clickEvent,
  selectedType,
  disabled,
}: TypeItemProps) => {
  return (
    <IonCard
      data-testid={dataTestId}
      onClick={() => clickEvent(index)}
      className={`type-input ${selectedType === index ? "selected-type" : ""}`}
      disabled={disabled}
    >
      <span>{text}</span>
    </IonCard>
  );
};

export { TypeItem };
