import { useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import { CredentialShortDetails } from "../../../core/agent/services/credentialService.types";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";
import { useAppDispatch } from "../../../store/hooks";
import { setCurrentRoute } from "../../../store/reducers/stateCache";
import { CredentialCardTemplate } from "../CredentialCardTemplate";
import { TabsRoutePath } from "../navigation/TabsMenu";
import "./CardsStack.scss";
import { CardsStackProps } from "./CardsStack.types";

const NAVIGATION_DELAY = 250;
const CLEAR_STATE_DELAY = 1000;

const CardsStack = ({
  name,
  cardsData,
  onShowCardDetails,
}: CardsStackProps) => {
  const history = useHistory();
  const [pickedCardIndex, setPickedCardIndex] = useState<number | null>(null);
  const inShowCardProgress = useRef(false);
  const dispatch = useAppDispatch();

  const renderCards = (
    cardsData: IdentifierShortDetails[] | CredentialShortDetails[]
  ) => {
    return cardsData.map(
      (
        cardData: IdentifierShortDetails | CredentialShortDetails,
        index: number
      ) => (
        <CredentialCardTemplate
          name={name}
          key={index}
          index={index}
          cardData={cardData as CredentialShortDetails}
          isActive={pickedCardIndex !== null}
          pickedCard={index === pickedCardIndex}
          onHandleShowCardDetails={() => handleShowCardDetails(index)}
        />
      )
    );
  };

  const handleShowCardDetails = async (index: number) => {
    if (inShowCardProgress.current) return;
    inShowCardProgress.current = true;
    setPickedCardIndex(index);
    onShowCardDetails?.();
    let pathname = "";

    const data = cardsData[index];
    pathname = `${TabsRoutePath.CREDENTIALS}/${data.id}`;

    dispatch(
      setCurrentRoute({
        path: pathname,
      })
    );

    setTimeout(() => {
      history.push({ pathname: pathname });
    }, NAVIGATION_DELAY);

    setTimeout(() => {
      setPickedCardIndex(null);
      inShowCardProgress.current = false;
    }, CLEAR_STATE_DELAY);
  };

  const containerClasses = `cards-stack-container ${
    pickedCardIndex !== null ? "transition-start" : ""
  }`;

  return (
    <div
      data-testid="card-stack"
      className={containerClasses}
    >
      {renderCards(cardsData)}
    </div>
  );
};

export { CardsStack, CLEAR_STATE_DELAY, NAVIGATION_DELAY };
