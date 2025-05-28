import {
  IonButton,
  IonIcon,
  IonLabel,
  useIonViewWillEnter,
} from "@ionic/react";
import { t } from "i18next";
import { peopleOutline } from "ionicons/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Agent } from "../../../core/agent/agent";
import { MiscRecordId } from "../../../core/agent/agent.types";
import { BasicRecord } from "../../../core/agent/records";
import {
  CredentialShortDetails,
  CredentialStatus,
} from "../../../core/agent/services/credentialService.types";
import { IdentifierType } from "../../../core/agent/services/identifier.types";
import { i18n } from "../../../i18n";
import { TabsRoutePath } from "../../../routes/paths";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getCredsArchivedCache,
  setCredsArchivedCache,
} from "../../../store/reducers/credsArchivedCache";
import {
  getCredentialsFilters,
  getCredsCache,
  getFavouritesCredsCache,
  setCredentialsFilters,
  setCredsCache,
} from "../../../store/reducers/credsCache";
import {
  setCurrentRoute,
  setToastMsg,
  showConnections,
} from "../../../store/reducers/stateCache";
import { ArchivedCredentials } from "../../components/ArchivedCredentials";
import { CardSlider } from "../../components/CardSlider";
import { CardsPlaceholder } from "../../components/CardsPlaceholder";
import { FilterChip } from "../../components/FilterChip/FilterChip";
import { AllowedChipFilter } from "../../components/FilterChip/FilterChip.types";
import { FilteredItemsPlaceholder } from "../../components/FilteredItemsPlaceholder";
import { TabLayout } from "../../components/layout/TabLayout";
import { ListHeader } from "../../components/ListHeader";
import { RemovePendingAlert } from "../../components/RemovePendingAlert";
import {
  CardList as CredentialCardList,
  SwitchCardView,
} from "../../components/SwitchCardView";
import { CardType, ToastMsgType } from "../../globals/types";
import { useOnlineStatusEffect } from "../../hooks";
import { showError } from "../../utils/error";
import { combineClassNames } from "../../utils/style";
import { StartAnimationSource } from "../Identifiers/Identifiers.types";
import "./Credentials.scss";
import { CredentialsFilters } from "./Credentials.types";

const CLEAR_STATE_DELAY = 1000;

const AdditionalButtons = ({
  handleConnections,
}: {
  handleConnections: () => void;
}) => {
  return (
    <>
      <IonButton
        shape="round"
        className="connections-button"
        data-testid="connections-button"
        onClick={handleConnections}
      >
        <IonIcon
          slot="icon-only"
          icon={peopleOutline}
          color="primary"
        />
      </IonButton>
    </>
  );
};

const Credentials = () => {
  const pageId = "credentials-tab";
  const dispatch = useAppDispatch();
  const credsCache = useAppSelector(getCredsCache);
  const archivedCreds = useAppSelector(getCredsArchivedCache);
  const credentialsFiltersCache = useAppSelector(getCredentialsFilters);
  const favouriteCredentialsCache = useAppSelector(getFavouritesCredsCache);
  const [archivedCredentialsIsOpen, setArchivedCredentialsIsOpen] =
    useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [navAnimation, setNavAnimation] =
    useState<StartAnimationSource>("none");
  const favouriteContainerElement = useRef<HTMLDivElement>(null);
  const [deletedPendingItem, setDeletePendingItem] =
    useState<CredentialShortDetails | null>(null);
  const [openDeletePendingAlert, setOpenDeletePendingAlert] = useState(false);
  const [individualCredentials, setIndividualCredentials] = useState<
    CredentialShortDetails[]
  >([]);
  const [groupCredentials, setGroupCredentials] = useState<
    CredentialShortDetails[]
  >([]);
  const selectedFilter = credentialsFiltersCache ?? CredentialsFilters.All;

  const revokedCreds = credsCache.filter(
    (item) => item.status === CredentialStatus.REVOKED
  );
  const pendingCreds = credsCache.filter(
    (item) => item.status === CredentialStatus.PENDING
  );
  const confirmedCreds = useMemo(
    () =>
      credsCache.filter((item) => item.status === CredentialStatus.CONFIRMED),
    [credsCache]
  );

  const fetchArchivedCreds = useCallback(async () => {
    try {
      const creds = await Agent.agent.credentials.getCredentials(true);
      dispatch(setCredsArchivedCache(creds));
    } catch (e) {
      showError("Unable to get archived credential", e, dispatch);
    }
  }, [dispatch]);

  const findTimeById = (id: string) => {
    const found = favouriteCredentialsCache.find((item) => item.id === id);
    return found ? found.time : null;
  };

  const favouriteCredentials = credsCache.filter((cred) =>
    favouriteCredentialsCache?.some((fav) => fav.id === cred.id)
  );

  const sortedFavouriteCredentials = favouriteCredentials.sort((a, b) => {
    const timeA = findTimeById(a.id);
    const timeB = findTimeById(b.id);

    if (timeA === null && timeB === null) return 0;
    if (timeA === null) return 1;
    if (timeB === null) return -1;

    return timeA - timeB;
  });

  useEffect(() => {
    setShowPlaceholder(confirmedCreds.length + pendingCreds.length === 0);
    setIndividualCredentials(
      confirmedCreds.filter(
        (cred) => cred.identifierType !== IdentifierType.Group
      )
    );
    setGroupCredentials(
      confirmedCreds.filter(
        (cred) => cred.identifierType !== IdentifierType.Individual
      )
    );
  }, [confirmedCreds, credsCache, pendingCreds.length]);

  useOnlineStatusEffect(fetchArchivedCreds);

  const handleConnections = () => {
    dispatch(showConnections(true));
  };

  useIonViewWillEnter(() => {
    dispatch(setCurrentRoute({ path: TabsRoutePath.CREDENTIALS }));
  });

  const handleShowNavAnimation = (source: StartAnimationSource) => {
    if (favouriteContainerElement.current && source !== "favourite") {
      favouriteContainerElement.current.style.height =
        favouriteContainerElement.current.scrollHeight + "px";
    }

    setNavAnimation(source);

    setTimeout(() => {
      setNavAnimation("none");
      if (favouriteContainerElement.current) {
        favouriteContainerElement.current.removeAttribute("style");
      }
    }, CLEAR_STATE_DELAY);
  };

  const tabClasses = combineClassNames("credential-tab", {
    "cards-credential-nav": navAnimation === "cards",
    "favorite-credential-nav": navAnimation === "favourite",
  });

  const handleArchivedCredentialsDisplayChange = (value: boolean) => {
    if (value === archivedCredentialsIsOpen) return;
    setArchivedCredentialsIsOpen(value);
    fetchArchivedCreds();
  };

  const ArchivedCredentialsButton = () => {
    return (
      <div
        className={`archived-credentials-button-container${
          archivedCreds?.length > 0 || revokedCreds.length > 0
            ? " visible"
            : " hidden"
        }`}
      >
        <IonButton
          fill="outline"
          className="secondary-button"
          data-testid="cred-archived-revoked-button"
          onClick={() => setArchivedCredentialsIsOpen(true)}
        >
          <IonLabel color="secondary">
            {i18n.t("tabs.credentials.tab.viewarchived")}
          </IonLabel>
        </IonButton>
      </div>
    );
  };

  const deletePendingCheck = {
    title: i18n.t("tabs.credentials.tab.deletepending.title"),
    description: i18n.t("tabs.credentials.tab.deletepending.description"),
    button: i18n.t("tabs.credentials.tab.deletepending.button"),
  };

  const deletePendingCred = async () => {
    if (!deletedPendingItem) return;
    setDeletePendingItem(null);

    try {
      await Agent.agent.credentials.archiveCredential(deletedPendingItem.id);
      await Agent.agent.credentials.markCredentialPendingDeletion(
        deletedPendingItem.id
      );

      dispatch(setToastMsg(ToastMsgType.CREDENTIAL_DELETED));

      const creds = await Agent.agent.credentials.getCredentials();
      dispatch(setCredsCache(creds));
    } catch (e) {
      showError(
        "Unable to delete credential",
        e,
        dispatch,
        ToastMsgType.DELETE_CRED_FAIL
      );
    }
  };

  const filterOptions = [
    {
      filter: CredentialsFilters.All,
      label: i18n.t("tabs.credentials.tab.filters.all"),
    },
    {
      filter: CredentialsFilters.Individual,
      label: i18n.t("tabs.credentials.tab.filters.individual"),
    },
    {
      filter: CredentialsFilters.Group,
      label: i18n.t("tabs.credentials.tab.filters.group"),
    },
  ];

  const handleSelectFilter = (filter: AllowedChipFilter) => {
    Agent.agent.basicStorage
      .createOrUpdateBasicRecord(
        new BasicRecord({
          id: MiscRecordId.APP_CRED_SELECTED_FILTER,
          content: {
            filter: filter,
          },
        })
      )
      .then(() => {
        dispatch(setCredentialsFilters(filter as CredentialsFilters));
      });
  };

  return (
    <>
      <TabLayout
        pageId={pageId}
        header={true}
        customClass={tabClasses}
        title={`${i18n.t("tabs.credentials.tab.title")}`}
        additionalButtons={
          <AdditionalButtons handleConnections={handleConnections} />
        }
        placeholder={
          showPlaceholder && (
            <CardsPlaceholder testId={pageId}>
              <p>
                <i>{i18n.t("tabs.credentials.tab.placeholder")}</i>
              </p>
              <ArchivedCredentialsButton />
            </CardsPlaceholder>
          )
        }
      >
        {!showPlaceholder && (
          <>
            {favouriteCredentials.length > 0 && (
              <div
                ref={favouriteContainerElement}
                className="credentials-tab-content-block credential-favourite-cards"
                data-testid="favourite-container-element"
              >
                <CardSlider
                  title={`${i18n.t("tabs.credentials.tab.favourites")}`}
                  name="favs"
                  cardType={CardType.CREDENTIALS}
                  cardsData={sortedFavouriteCredentials}
                  onShowCardDetails={() => handleShowNavAnimation("favourite")}
                />
              </div>
            )}
            {!!confirmedCreds.length && (
              <SwitchCardView
                className="credentials-tab-content-block credential-cards"
                cardTypes={CardType.CREDENTIALS}
                cardsData={
                  selectedFilter === CredentialsFilters.All
                    ? confirmedCreds
                    : selectedFilter === CredentialsFilters.Individual
                      ? individualCredentials
                      : groupCredentials
                }
                onShowCardDetails={() => handleShowNavAnimation("cards")}
                title={`${i18n.t("tabs.credentials.tab.allcreds")}`}
                name="allcreds"
                filters={
                  <div className="credentials-tab-chips">
                    {filterOptions.map((option) => (
                      <FilterChip
                        key={option.filter}
                        filter={option.filter}
                        label={option.label}
                        isActive={option.filter === selectedFilter}
                        onClick={handleSelectFilter}
                      />
                    ))}
                  </div>
                }
                placeholder={
                  <FilteredItemsPlaceholder
                    placeholderText={t(
                      "tabs.credentials.tab.filters.placeholder",
                      {
                        type: selectedFilter,
                      }
                    )}
                    testId={pageId}
                  />
                }
              />
            )}
            {!!pendingCreds.length && (
              <div className="credetial-tab-content-block pending-container">
                <ListHeader
                  title={`${i18n.t("tabs.credentials.tab.pendingcred")}`}
                />
                <CredentialCardList
                  cardsData={pendingCreds}
                  cardTypes={CardType.CREDENTIALS}
                  testId="pending-creds-list"
                  onCardClick={(cred) => {
                    setDeletePendingItem(cred as CredentialShortDetails);
                    setOpenDeletePendingAlert(true);
                  }}
                />
              </div>
            )}
            <ArchivedCredentialsButton />
          </>
        )}
      </TabLayout>
      <RemovePendingAlert
        pageId={pageId}
        openFirstCheck={openDeletePendingAlert}
        firstCheckProps={deletePendingCheck}
        onClose={() => setOpenDeletePendingAlert(false)}
        secondCheckTitle={`${i18n.t(
          "tabs.credentials.tab.deletepending.secondchecktitle"
        )}`}
        onDeletePendingItem={deletePendingCred}
      />
      <ArchivedCredentials
        revokedCreds={revokedCreds}
        archivedCreds={archivedCreds}
        archivedCredentialsIsOpen={archivedCredentialsIsOpen}
        setArchivedCredentialsIsOpen={handleArchivedCredentialsDisplayChange}
      />
    </>
  );
};

export { Credentials };
