import { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { Agent } from "../../../core/agent/agent";
import { MiscRecordId } from "../../../core/agent/agent.types";
import { BasicRecord } from "../../../core/agent/records";
import { CredentialShortDetails } from "../../../core/agent/services/credentialService.types";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";
import { TabsRoutePath } from "../../../routes/paths";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setCurrentRoute } from "../../../store/reducers/stateCache";
import {
  getCredentialViewTypeCache,
  setCredentialViewTypeCache,
} from "../../../store/reducers/viewTypeCache";
import { combineClassNames } from "../../utils/style";
import { CardsStack } from "../CardsStack";
import { ListHeader } from "../ListHeader";
import { CardList } from "./CardList";
import "./SwitchCardView.scss";
import { CardListViewType, SwitchCardViewProps } from "./SwitchCardView.types";

const SwitchCardView = ({
  title,
  cardsData,
  cardTypes,
  name,
  hideHeader,
  className,
  onShowCardDetails,
  filters,
  placeholder,
}: SwitchCardViewProps) => {
  const history = useHistory();
  const dispatch = useAppDispatch();
  const [type, setType] = useState<CardListViewType>(CardListViewType.Stack);
  const credViewTypeCache = useAppSelector(getCredentialViewTypeCache);
  const viewTypeCache = credViewTypeCache;

  const setViewType = useCallback(
    (viewType: CardListViewType) => {
      setType(viewType);
      Agent.agent.basicStorage
        .createOrUpdateBasicRecord(
          new BasicRecord({
            id: MiscRecordId.APP_CRED_VIEW_TYPE,
            content: { viewType },
          })
        )
        .then(() => {
          dispatch(setCredentialViewTypeCache(viewType));
        });
    },
    [dispatch]
  );

  useEffect(() => {
    if (!viewTypeCache.viewType) {
      setType(CardListViewType.Stack);
      return;
    }

    setViewType(viewTypeCache.viewType as CardListViewType);
  }, [setViewType, viewTypeCache]);

  const handleOpenDetail = (
    data: IdentifierShortDetails | CredentialShortDetails
  ) => {
    let pathname = "";
    pathname = `${TabsRoutePath.CREDENTIALS}/${data.id}`;

    dispatch(
      setCurrentRoute({
        path: pathname,
      })
    );

    history.push({ pathname: pathname });
  };

  const classes = combineClassNames("card-switch-view", className);

  return (
    <div className={classes}>
      {!hideHeader && (
        <ListHeader
          hasAction
          activeActionIndex={type}
          title={title}
          onFirstIconClick={() => setViewType(CardListViewType.Stack)}
          onSecondIconClick={() => setViewType(CardListViewType.List)}
        />
      )}
      {filters}
      {cardsData.length === 0 ? (
        placeholder
      ) : type === CardListViewType.Stack ? (
        <CardsStack
          cardsData={cardsData}
          cardsType={cardTypes}
          onShowCardDetails={onShowCardDetails}
          name={name}
        />
      ) : (
        <CardList
          cardTypes={cardTypes}
          cardsData={cardsData}
          onCardClick={handleOpenDetail}
          testId="card-list"
        />
      )}
    </div>
  );
};

export { SwitchCardView };
