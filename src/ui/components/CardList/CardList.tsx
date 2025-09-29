import {
  IonIcon,
  IonItem,
  IonItemOptions,
  IonItemSliding,
  IonList,
} from "@ionic/react";
import { personCircleOutline } from "ionicons/icons";
import { combineClassNames } from "../../utils/style";
import "./CardList.scss";
import { CardItemProps, CardListProps } from "./CardList.types";
import CitizenPortal from "../../assets/images/citizen-portal.svg";
import Socialbook from "../../assets/images/socialbook.svg";

const CardInfo = <T extends object = object>({
  index,
  card,
  hiddenImage,
  onCardClick,
  onRenderEndSlot,
  onRenderStartSlot: renderStartSlot,
}: CardItemProps<T>) => {
  const titleClass = combineClassNames("card-title", {
    "has-subtitle": !!card.subtitle,
  });

  const cardImg = (() => {
    if (card.title === "Citizen Portal") {
      return (
        <div className="citizen-portal-logo-container">
          <img
            src={CitizenPortal}
            alt={card.title}
            className="card-logo"
            data-testid="card-logo"
          />
        </div>
      );
    }

    if (card.title === "Socialbook") {
      return (
        <div className="socialbook-logo-container">
          <img
            src={Socialbook}
            alt={card.title}
            className="card-logo"
            data-testid="card-logo"
          />
        </div>
      );
    }

    if (card.image) {
      return (
        <img
          src={card.image}
          alt={card.title}
          className="card-logo"
          data-testid="card-logo"
        />
      );
    }

    return (
      <div
        data-testid="card-fallback-logo"
        className="card-fallback-logo card-logo"
      >
        <IonIcon
          icon={personCircleOutline}
          color="light"
        />
      </div>
    );
  })();

  return (
    <IonItem
      onClick={(e) => onCardClick?.(card.data, e)}
      data-testid={`card-item-${card.id}`}
      className="card-item"
    >
      {renderStartSlot?.(card.data, index)}
      {!hiddenImage && cardImg}
      <div className="card-info">
        <p
          data-testid={`card-title-${card.id}`}
          className={titleClass}
        >
          {card.title}
        </p>
        {card.subtitle && (
          <p
            data-testid={`card-subtitle-${card.id}`}
            className="card-subtitle"
          >
            {card.subtitle}
          </p>
        )}
      </div>
      {onRenderEndSlot?.(card.data)}
    </IonItem>
  );
};

const CardItem = <T extends object = object>({
  index,
  card,
  onCardClick,
  onRenderCardAction,
  onRenderEndSlot,
  onRenderStartSlot: renderStartSlot,
  hiddenImage,
}: CardItemProps<T>) => {
  if (!onRenderCardAction) {
    return (
      <CardInfo
        index={index}
        card={card}
        onCardClick={onCardClick}
        onRenderEndSlot={onRenderEndSlot}
        onRenderStartSlot={renderStartSlot}
        hiddenImage={hiddenImage}
      />
    );
  }

  return (
    <IonItemSliding>
      <CardInfo
        index={index}
        card={card}
        onCardClick={onCardClick}
        onRenderEndSlot={onRenderEndSlot}
        onRenderStartSlot={renderStartSlot}
        hiddenImage={hiddenImage}
      />
      <IonItemOptions data-testid="card-actions">
        {onRenderCardAction(card.data)}
      </IonItemOptions>
    </IonItemSliding>
  );
};

const CardList = <T extends object = object>({
  data,
  className,
  lines,
  rounded = true,
  testId,
  onRenderCardAction,
  onCardClick,
  onRenderEndSlot,
  onRenderStartSlot: renderStartSlot,
  hiddenImage,
}: CardListProps<T>) => {
  const classes = combineClassNames("card-list", className, {
    "rounde-img": rounded,
  });

  return (
    <IonList
      lines={lines}
      data-testid={testId}
      className={classes}
    >
      {data.map((card, index) => (
        <CardItem
          card={card}
          key={card.id}
          index={index}
          onCardClick={onCardClick}
          onRenderCardAction={onRenderCardAction}
          onRenderEndSlot={onRenderEndSlot}
          onRenderStartSlot={renderStartSlot}
          hiddenImage={hiddenImage}
        />
      ))}
    </IonList>
  );
};

export { CardList };
