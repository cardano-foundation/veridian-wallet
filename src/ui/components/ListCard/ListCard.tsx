import { IonCard, IonList } from "@ionic/react";
import { ListCardProps } from "./ListCard.types";
import "./ListCard.scss";

const ListCard = <T,>({
  items,
  renderItem,
  testId,
  className,
}: ListCardProps<T>) => (
  <IonCard className={`list-card ${className}`}>
    <IonList
      lines="none"
      data-testid={testId}
    >
      {items.map((item, index) => renderItem(item, index))}
    </IonList>
  </IonCard>
);

export { ListCard };
