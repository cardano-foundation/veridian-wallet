import { IonButton, IonIcon, useIonViewWillEnter } from "@ionic/react";
import { t } from "i18next";
import { addOutline, peopleOutline } from "ionicons/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Agent } from "../../../core/agent/agent";
import { CreationStatus, MiscRecordId } from "../../../core/agent/agent.types";
import { BasicRecord } from "../../../core/agent/records/basicRecord";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";
import { i18n } from "../../../i18n";
import { TabsRoutePath } from "../../../routes/paths";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getFavouritesIdentifiersCache,
  getIdentifiersCache,
  getIdentifiersFilters,
  getMultiSigGroupCache,
  getOpenMultiSig,
  removeIdentifierCache,
  setIdentifiersFilters,
  setOpenMultiSigId,
} from "../../../store/reducers/identifiersCache";
import {
  getCurrentOperation,
  getShowWelcomePage,
  setCurrentOperation,
  setCurrentRoute,
  setToastMsg,
  showConnections,
} from "../../../store/reducers/stateCache";
import { CardSlider } from "../../components/CardSlider";
import { CardsPlaceholder } from "../../components/CardsPlaceholder";
import { CreateGroupIdentifier } from "../../components/CreateGroupIdentifier";
import { CreateIdentifier } from "../../components/CreateIdentifier";
import { FilterChip } from "../../components/FilterChip/FilterChip";
import { AllowedChipFilter } from "../../components/FilterChip/FilterChip.types";
import { FilteredItemsPlaceholder } from "../../components/FilteredItemsPlaceholder";
import { ListHeader } from "../../components/ListHeader";
import { RemovePendingAlert } from "../../components/RemovePendingAlert";
import {
  CardList as IdentifierCardList,
  SwitchCardView,
} from "../../components/SwitchCardView";
import { TabLayout } from "../../components/layout/TabLayout";
import { CardType, OperationType, ToastMsgType } from "../../globals/types";
import { showError } from "../../utils/error";
import { combineClassNames } from "../../utils/style";
import "./Identifiers.scss";
import { IdentifiersFilters, StartAnimationSource } from "./Identifiers.types";
import { Welcome } from "./components/Welcome";

const CLEAR_STATE_DELAY = 500;
interface AdditionalButtonsProps {
  handleCreateIdentifier: () => void;
  handleConnections: () => void;
}
const AdditionalButtons = ({
  handleConnections,
  handleCreateIdentifier,
}: AdditionalButtonsProps) => {
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
      <IonButton
        shape="round"
        className="add-button"
        data-testid="add-button"
        onClick={handleCreateIdentifier}
      >
        <IonIcon
          slot="icon-only"
          icon={addOutline}
          color="primary"
        />
      </IonButton>
    </>
  );
};

const Identifiers = () => {
  const pageId = "identifiers-tab";
  const dispatch = useAppDispatch();
  const identifiersDataCache = useAppSelector(getIdentifiersCache);
  const multisigGroupCache = useAppSelector(getMultiSigGroupCache);
  const favouriteIdentifiers = useAppSelector(getFavouritesIdentifiersCache);
  const currentOperation = useAppSelector(getCurrentOperation);
  const openMultiSigId = useAppSelector(getOpenMultiSig);
  const identifiersFiltersCache = useAppSelector(getIdentifiersFilters);
  const showWelcomePage = useAppSelector(getShowWelcomePage);

  const [favIdentifiers, setFavIdentifiers] = useState<
    IdentifierShortDetails[]
  >([]);
  const [allIdentifiers, setAllIdentifiers] = useState<
    IdentifierShortDetails[]
  >([]);
  const [pendingIdentifiers, setPendingIdentifiers] = useState<
    IdentifierShortDetails[]
  >([]);
  const [multiSigIdentifiers, setMultiSigIdentifiers] = useState<
    IdentifierShortDetails[]
  >([]);
  const [individualIdentifiers, setIndividualIdentifiers] = useState<
    IdentifierShortDetails[]
  >([]);
  const [groupIdentifiers, setGroupIdentifiers] = useState<
    IdentifierShortDetails[]
  >([]);
  const [createIdentifierModalIsOpen, setCreateIdentifierModalIsOpen] =
    useState(false);
  const [groupIdentifierOpen, setGroupIdentifierOpen] = useState(false);
  const [openGroupAfterCreate, setOpenGroupAfterCreate] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [resumeMultiSig, setResumeMultiSig] =
    useState<IdentifierShortDetails | null>(null);
  const [navAnimation, setNavAnimation] =
    useState<StartAnimationSource>("none");
  const [deletedPendingItem, setDeletePendingItem] =
    useState<IdentifierShortDetails | null>(null);
  const [openDeletePendingAlert, setOpenDeletePendingAlert] = useState(false);
  const favouriteContainerElement = useRef<HTMLDivElement>(null);
  const selectedFilter = identifiersFiltersCache ?? IdentifiersFilters.All;

  const identifiersData = useMemo(
    () => Object.values(identifiersDataCache),
    [identifiersDataCache]
  );

  useIonViewWillEnter(() => {
    dispatch(setCurrentRoute({ path: TabsRoutePath.IDENTIFIERS }));
  });

  const handleMultiSigClick = async (identifier: IdentifierShortDetails) => {
    if (identifier.creationStatus === CreationStatus.FAILED) {
      setDeletePendingItem(identifier);
      setOpenDeletePendingAlert(true);
      return;
    }

    setResumeMultiSig(identifier);
    setGroupIdentifierOpen(true);
  };

  useEffect(() => {
    const multisigId =
      OperationType.OPEN_MULTISIG_IDENTIFIER === currentOperation &&
      multisigGroupCache
        ? multisigGroupCache?.groupId
        : openMultiSigId;

    if (!multisigId) {
      return;
    }

    const identifier = identifiersData.find(
      (item) => item.groupMetadata?.groupId === multisigId
    );

    if (identifier) {
      handleMultiSigClick(identifier);
      dispatch(setOpenMultiSigId(undefined));
      dispatch(setCurrentOperation(OperationType.IDLE));
    }
  }, [
    currentOperation,
    dispatch,
    identifiersData,
    multisigGroupCache,
    openMultiSigId,
  ]);

  useEffect(() => {
    setShowPlaceholder(identifiersData.length === 0);
    const tmpPendingIdentifiers = [];
    const tmpMultisigIdentifiers = [];
    const tmpFavIdentifiers = [];
    const tmpAllIdentifiers = [];
    const tmpIndividualIdentifiers = [];
    const tmpGroupIdentifiers = [];

    for (const identifier of identifiersData) {
      if (
        identifier.creationStatus !== CreationStatus.COMPLETE &&
        !identifier.groupMetadata
      ) {
        tmpPendingIdentifiers.push(identifier);
        continue;
      }

      if (!identifier.groupMetadata) {
        identifier.groupMemberPre
          ? tmpGroupIdentifiers.push(identifier)
          : tmpIndividualIdentifiers.push(identifier);
      }

      if (favouriteIdentifiers?.some((fav) => fav.id === identifier.id)) {
        tmpFavIdentifiers.push(identifier);
        tmpAllIdentifiers.push(identifier);
        continue;
      }

      if (identifier.groupMetadata?.groupId) {
        tmpMultisigIdentifiers.push(identifier);
        continue;
      }

      tmpAllIdentifiers.push(identifier);
    }
    setAllIdentifiers(tmpAllIdentifiers);
    setFavIdentifiers(tmpFavIdentifiers);
    setPendingIdentifiers(tmpPendingIdentifiers);
    setMultiSigIdentifiers(tmpMultisigIdentifiers);
    setIndividualIdentifiers(tmpIndividualIdentifiers);
    setGroupIdentifiers(tmpGroupIdentifiers);
  }, [favouriteIdentifiers, identifiersData]);

  const findTimeById = (id: string) => {
    const found = favouriteIdentifiers?.find((item) => item.id === id);
    return found ? found.time : null;
  };

  const sortedFavIdentifiers = favIdentifiers.sort((a, b) => {
    const timeA = findTimeById(a.id);
    const timeB = findTimeById(b.id);
    if (timeA === null && timeB === null) return 0;
    if (timeA === null) return 1;
    if (timeB === null) return -1;
    return timeA - timeB;
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

  const tabClasses = combineClassNames({
    "cards-identifier-nav": navAnimation === "cards",
    "favorite-identifier-nav": navAnimation === "favourite",
  });

  const handleCloseCreateIdentifier = (identifier?: IdentifierShortDetails) => {
    if (identifier?.groupMetadata || identifier?.groupMemberPre) {
      handleMultiSigClick(identifier);
      setOpenGroupAfterCreate(true);
    }
  };

  const deletePendingIdentifier = async () => {
    if (!deletedPendingItem) return;
    setDeletePendingItem(null);

    try {
      await Agent.agent.identifiers.markIdentifierPendingDelete(
        deletedPendingItem.id
      );

      dispatch(setToastMsg(ToastMsgType.IDENTIFIER_DELETED));
      dispatch(removeIdentifierCache(deletedPendingItem.id));
    } catch (e) {
      showError(
        "Unable to delete identifier",
        e,
        dispatch,
        ToastMsgType.DELETE_IDENTIFIER_FAIL
      );
    }
  };

  const deletePendingCheck = {
    title: i18n.t("tabs.identifiers.deletepending.title"),
    description: i18n.t(
      deletedPendingItem?.creationStatus === CreationStatus.FAILED
        ? "tabs.identifiers.deletepending.witnesserror"
        : deletedPendingItem?.groupMetadata?.groupId
          ? "tabs.identifiers.deletepending.mutilsigdescription"
          : "tabs.identifiers.deletepending.description"
    ),
    button: i18n.t("tabs.identifiers.deletepending.button"),
  };

  const handleConnections = () => {
    dispatch(showConnections(true));
  };

  const handleCreateIdentifier = () => {
    setCreateIdentifierModalIsOpen(true);
  };

  const filterOptions = [
    {
      filter: IdentifiersFilters.All,
      label: i18n.t("tabs.identifiers.tab.filters.all"),
    },
    {
      filter: IdentifiersFilters.Individual,
      label: i18n.t("tabs.identifiers.tab.filters.individual"),
    },
    {
      filter: IdentifiersFilters.Group,
      label: i18n.t("tabs.identifiers.tab.filters.group"),
    },
  ];

  const handleSelectFilter = (filter: AllowedChipFilter) => {
    Agent.agent.basicStorage
      .createOrUpdateBasicRecord(
        new BasicRecord({
          id: MiscRecordId.APP_IDENTIFIER_SELECTED_FILTER,
          content: {
            filter: filter,
          },
        })
      )
      .then(() => {
        dispatch(setIdentifiersFilters(filter as IdentifiersFilters));
      });
  };

  return (
    <>
      <TabLayout
        pageId={pageId}
        header={!showWelcomePage}
        customClass={tabClasses}
        title={`${i18n.t("tabs.identifiers.tab.title")}`}
        additionalButtons={
          <AdditionalButtons
            handleConnections={handleConnections}
            handleCreateIdentifier={handleCreateIdentifier}
          />
        }
        placeholder={
          showWelcomePage ? (
            <Welcome onCreateGroupIdentifier={handleMultiSigClick} />
          ) : (
            showPlaceholder && (
              <CardsPlaceholder
                buttonLabel={`${i18n.t("tabs.identifiers.tab.create")}`}
                buttonAction={handleCreateIdentifier}
                testId={pageId}
              >
                <span className="placeholder-spacer" />
              </CardsPlaceholder>
            )
          )
        }
      >
        {!showPlaceholder && !showWelcomePage && (
          <>
            {!!favIdentifiers.length && (
              <div
                ref={favouriteContainerElement}
                className="identifiers-tab-content-block identifier-favourite-cards"
                data-testid="favourite-identifiers"
              >
                <CardSlider
                  title={`${i18n.t("tabs.identifiers.tab.favourites")}`}
                  name="favs"
                  cardType={CardType.IDENTIFIERS}
                  cardsData={sortedFavIdentifiers}
                  onShowCardDetails={() => handleShowNavAnimation("favourite")}
                />
              </div>
            )}
            {!!allIdentifiers.length && (
              <SwitchCardView
                className="identifiers-tab-content-block identifier-cards"
                cardTypes={CardType.IDENTIFIERS}
                cardsData={
                  selectedFilter === IdentifiersFilters.All
                    ? allIdentifiers
                    : selectedFilter === IdentifiersFilters.Individual
                      ? individualIdentifiers
                      : groupIdentifiers
                }
                onShowCardDetails={() => handleShowNavAnimation("cards")}
                title={`${i18n.t("tabs.identifiers.tab.allidentifiers")}`}
                name="allidentifiers"
                filters={
                  <div className="identifiers-tab-chips">
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
                      "tabs.identifiers.tab.filters.placeholder",
                      {
                        type: selectedFilter,
                      }
                    )}
                    testId={pageId}
                    buttonLabel={`${i18n.t("tabs.identifiers.tab.create")}`}
                    buttonAction={handleCreateIdentifier}
                  />
                }
              />
            )}
            {!!multiSigIdentifiers.length && (
              <div className="identifiers-tab-content-block multisig-container">
                <h3>{i18n.t("tabs.identifiers.tab.multisigidentifiers")}</h3>
                <IdentifierCardList
                  cardTypes={CardType.IDENTIFIERS}
                  cardsData={multiSigIdentifiers}
                  onCardClick={async (identifier) =>
                    handleMultiSigClick(identifier as IdentifierShortDetails)
                  }
                  testId="identifiers-list"
                />
              </div>
            )}
            {!!pendingIdentifiers.length && (
              <div className="identifiers-tab-content-block pending-container">
                <ListHeader
                  title={`${i18n.t("tabs.identifiers.tab.pendingidentifiers")}`}
                />
                <IdentifierCardList
                  cardsData={pendingIdentifiers}
                  cardTypes={CardType.IDENTIFIERS}
                  testId="pending-identifiers-list"
                  onCardClick={(identifier) => {
                    setDeletePendingItem(identifier as IdentifierShortDetails);
                    setOpenDeletePendingAlert(true);
                  }}
                />
              </div>
            )}
          </>
        )}
      </TabLayout>
      <RemovePendingAlert
        pageId={pageId}
        openFirstCheck={openDeletePendingAlert}
        firstCheckProps={deletePendingCheck}
        onClose={() => setOpenDeletePendingAlert(false)}
        secondCheckTitle={`${i18n.t(
          "tabs.identifiers.deletepending.secondchecktitle"
        )}`}
        onDeletePendingItem={deletePendingIdentifier}
      />
      <CreateIdentifier
        modalIsOpen={createIdentifierModalIsOpen}
        setModalIsOpen={setCreateIdentifierModalIsOpen}
        onClose={handleCloseCreateIdentifier}
      />
      <CreateGroupIdentifier
        modalIsOpen={groupIdentifierOpen}
        setModalIsOpen={(value) => {
          setGroupIdentifierOpen(value);
          setOpenGroupAfterCreate(false);
        }}
        setResumeMultiSig={setResumeMultiSig}
        resumeMultiSig={resumeMultiSig}
        openAfterCreate={openGroupAfterCreate}
      />
    </>
  );
};
export { AdditionalButtons, Identifiers };
