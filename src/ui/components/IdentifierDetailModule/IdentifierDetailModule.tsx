import {
  IonButton,
  IonIcon,
  IonSpinner,
  useIonViewWillEnter,
} from "@ionic/react";
import {
  ellipsisVertical,
  heart,
  heartOutline,
  shareOutline,
} from "ionicons/icons";
import { useCallback, useState } from "react";
import { useHistory } from "react-router-dom";
import { Agent } from "../../../core/agent/agent";
import { MiscRecordId } from "../../../core/agent/agent.types";
import { BasicRecord } from "../../../core/agent/records";
import { IdentifierDetails as IdentifierDetailsCore } from "../../../core/agent/services/identifier.types";
import { i18n } from "../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  addFavouriteIdentifierCache,
  getFavouritesIdentifiersCache,
  removeFavouriteIdentifierCache,
  removeIdentifierCache,
} from "../../../store/reducers/identifiersCache";
import {
  getAuthentication,
  getStateCache,
  setCurrentOperation,
  setCurrentRoute,
  setToastMsg,
} from "../../../store/reducers/stateCache";
import "../../components/CardDetails/CardDetails.scss";
import { MAX_FAVOURITES } from "../../globals/constants";
import { OperationType, ToastMsgType } from "../../globals/types";
import { useOnlineStatusEffect } from "../../hooks";
import { showError } from "../../utils/error";
import { combineClassNames } from "../../utils/style";
import { Alert } from "../Alert";
import { CloudError } from "../CloudError";
import { IdentifierCardTemplate } from "../IdentifierCardTemplate";
import { IdentifierOptions } from "../IdentifierOptions";
import { ScrollablePageLayout } from "../layout/ScrollablePageLayout";
import { PageFooter } from "../PageFooter";
import { PageHeader } from "../PageHeader";
import { ShareConnection } from "../ShareConnection";
import { Verification } from "../Verification";
import { IdentifierContent } from "./components/IdentifierContent";
import { RotateKeyModal } from "./components/RotateKeyModal";
import "./IdentifierDetailModule.scss";
import { IdentifierDetailModuleProps } from "./IdentifierDetailModule.types";
import { getBiometricsCache } from "../../../store/reducers/biometricsCache";

const IdentifierDetailModule = ({
  identifierDetailId,
  onClose: handleDone,
  navAnimation,
  pageId,
  hardwareBackButtonConfig,
  restrictedOptions,
}: IdentifierDetailModuleProps) => {
  const history = useHistory();
  const dispatch = useAppDispatch();
  const stateCache = useAppSelector(getStateCache);
  const biometrics = useAppSelector(getBiometricsCache);
  const favouritesIdentifiersData = useAppSelector(
    getFavouritesIdentifiersCache
  );
  const passwordAuthentication =
    useAppSelector(getAuthentication).passwordIsSet;
  const [shareIsOpen, setShareIsOpen] = useState(false);
  const [identifierOptionsIsOpen, setIdentifierOptionsIsOpen] = useState(false);
  const [alertIsOpen, setAlertIsOpen] = useState(false);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const [openRotateKeyModal, setOpenRotateKeyModal] = useState(false);
  const [cardData, setCardData] = useState<IdentifierDetailsCore | undefined>();
  const userName = stateCache.authentication.userName;
  const [oobi, setOobi] = useState("");
  const [cloudError, setCloudError] = useState(false);
  const [hidden, setHidden] = useState(false);

  const fetchOobi = useCallback(async () => {
    try {
      if (!cardData?.id) return;

      const oobiValue = await Agent.agent.connections.getOobi(
        `${cardData.id}`,
        userName
      );
      if (oobiValue) {
        setOobi(oobiValue);
      }
    } catch (e) {
      showError("Unable to fetch oobi", e, dispatch);
    }
  }, [cardData?.id, userName, dispatch]);

  const isFavourite = favouritesIdentifiersData?.some(
    (fav) => fav.id === identifierDetailId
  );

  const getDetails = useCallback(async () => {
    try {
      const cardDetailsResult = await Agent.agent.identifiers.getIdentifier(
        identifierDetailId
      );
      setCardData(cardDetailsResult);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes(Agent.MISSING_DATA_ON_KERIA)
      ) {
        setCloudError(true);
      } else {
        handleDone?.(false);
        showError("Unable to get identifier details", error, dispatch);
      }
    }
  }, [identifierDetailId, handleDone, dispatch]);

  useOnlineStatusEffect(getDetails);
  useOnlineStatusEffect(fetchOobi);

  useIonViewWillEnter(() => {
    dispatch(setCurrentRoute({ path: history.location.pathname }));
  });

  const handleDelete = async () => {
    handleDone?.(false);
    setHidden(true);

    try {
      setVerifyIsOpen(false);
      const filterId = cardData
        ? cardData.id
        : cloudError
          ? identifierDetailId
          : undefined;

      await deleteIdentifier();
      dispatch(setToastMsg(ToastMsgType.IDENTIFIER_DELETED));
      dispatch(removeIdentifierCache(filterId || ""));
    } catch (e) {
      showError(
        "Unable to delete identifier",
        e,
        dispatch,
        ToastMsgType.DELETE_IDENTIFIER_FAIL
      );
    }
  };

  const deleteIdentifier = async () => {
    if (identifierDetailId && cloudError) {
      await Agent.agent.identifiers.deleteStaleLocalIdentifier(
        identifierDetailId
      );

      if (isFavourite) {
        handleSetFavourite(identifierDetailId);
      }
    }

    if (cardData) {
      await Agent.agent.identifiers.markIdentifierPendingDelete(cardData.id);
      if (isFavourite) {
        handleSetFavourite(cardData.id);
      }
    }
  };

  const handleSetFavourite = (id: string) => {
    if (isFavourite) {
      Agent.agent.basicStorage
        .createOrUpdateBasicRecord(
          new BasicRecord({
            id: MiscRecordId.IDENTIFIERS_FAVOURITES,
            content: {
              favourites: favouritesIdentifiersData.filter(
                (fav) => fav.id !== id
              ),
            },
          })
        )
        .then(() => {
          dispatch(removeFavouriteIdentifierCache(id));
        })
        .catch((e) => {
          showError("Unable to remove favourite identifier", e, dispatch);
        });
    } else {
      if (favouritesIdentifiersData.length >= MAX_FAVOURITES) {
        dispatch(setToastMsg(ToastMsgType.MAX_FAVOURITES_REACHED));
        return;
      }
      Agent.agent.basicStorage
        .createOrUpdateBasicRecord(
          new BasicRecord({
            id: MiscRecordId.IDENTIFIERS_FAVOURITES,
            content: {
              favourites: [
                { id, time: Date.now() },
                ...favouritesIdentifiersData,
              ],
            },
          })
        )
        .then(() => {
          dispatch(addFavouriteIdentifierCache({ id, time: Date.now() }));
        })
        .catch((e) => {
          showError("Unable to add favourite identifier", e, dispatch);
        });
    }
  };

  const deleteButtonAction = () => {
    setAlertIsOpen(true);
  };

  const handleAuthentication = () => {
    setHidden(!passwordAuthentication && !biometrics.enabled);
    setVerifyIsOpen(true);
  };

  const toggleFavourite = () => {
    if (!cardData) return;
    handleSetFavourite(identifierDetailId);
  };

  const openShareModal = () => {
    if (!cardData) return;
    setShareIsOpen(true);
  };

  const openOptionModal = () => {
    if (!cardData) return;
    setIdentifierOptionsIsOpen(true);
  };

  const cancelDelete = () => dispatch(setCurrentOperation(OperationType.IDLE));

  const openRotateModal = useCallback(() => {
    setOpenRotateKeyModal(true);
  }, []);

  const AdditionalButtons = () => {
    return (
      <>
        <IonButton
          shape="round"
          className={`heart-button-${
            isFavourite ? "favourite" : "no-favourite"
          }`}
          data-testid="heart-button"
          onClick={toggleFavourite}
        >
          <IonIcon
            slot="icon-only"
            icon={isFavourite ? heart : heartOutline}
            className={`heart-icon-${
              isFavourite ? "favourite" : "no-favourite"
            }`}
            data-testid={`heart-icon-${
              isFavourite ? "favourite" : "no-favourite"
            }`}
          />
        </IonButton>
        <IonButton
          shape="round"
          className="share-button"
          data-testid="share-button"
          onClick={openShareModal}
        >
          <IonIcon
            slot="icon-only"
            icon={shareOutline}
            color="primary"
          />
        </IonButton>
        <IonButton
          shape="round"
          className="identifier-options-button"
          data-testid="identifier-options-button"
          onClick={openOptionModal}
        >
          <IonIcon
            slot="icon-only"
            icon={ellipsisVertical}
            color="primary"
          />
        </IonButton>
      </>
    );
  };

  const pageClasses = combineClassNames(
    "card-details identifier-details-module",
    {
      "back-animation": navAnimation,
      "open-animation": !navAnimation,
      "ion-hide": hidden,
    }
  );

  return (
    <>
      {cloudError ? (
        <CloudError
          pageId={pageId}
          header={
            <PageHeader
              closeButton={true}
              closeButtonLabel={`${i18n.t("tabs.identifiers.details.done")}`}
              closeButtonAction={handleDone}
            />
          }
        >
          <PageFooter
            pageId={pageId}
            deleteButtonText={`${i18n.t(
              "tabs.identifiers.details.delete.button"
            )}`}
            deleteButtonAction={deleteButtonAction}
          />
        </CloudError>
      ) : (
        <ScrollablePageLayout
          pageId={pageId}
          customClass={pageClasses}
          header={
            <PageHeader
              closeButton={true}
              closeButtonLabel={`${i18n.t("tabs.identifiers.details.done")}`}
              closeButtonAction={handleDone}
              additionalButtons={<AdditionalButtons />}
              hardwareBackButtonConfig={hardwareBackButtonConfig}
            />
          }
        >
          {!cardData ? (
            <div
              className="identifier-card-detail-spinner-container"
              data-testid="identifier-card-detail-spinner-container"
            >
              <IonSpinner name="circular" />
            </div>
          ) : (
            <>
              <IdentifierCardTemplate
                cardData={cardData}
                isActive={false}
              />
              <div className="card-details-content">
                <IdentifierContent
                  onRotateKey={openRotateModal}
                  cardData={cardData as IdentifierDetailsCore}
                />
                {restrictedOptions ? (
                  <></>
                ) : (
                  <PageFooter
                    pageId={pageId}
                    deleteButtonText={`${i18n.t(
                      "tabs.identifiers.details.delete.button"
                    )}`}
                    deleteButtonAction={deleteButtonAction}
                  />
                )}
              </div>
              <ShareConnection
                isOpen={shareIsOpen}
                setIsOpen={setShareIsOpen}
                oobi={oobi}
              />
              <IdentifierOptions
                handleRotateKey={openRotateModal}
                optionsIsOpen={identifierOptionsIsOpen}
                setOptionsIsOpen={setIdentifierOptionsIsOpen}
                cardData={cardData}
                setCardData={setCardData}
                oobi={oobi}
                handleDeleteIdentifier={deleteButtonAction}
                restrictedOptions={restrictedOptions}
              />
            </>
          )}
        </ScrollablePageLayout>
      )}
      <Alert
        isOpen={alertIsOpen}
        setIsOpen={setAlertIsOpen}
        dataTestId="alert-confirm-identifier-delete-details"
        headerText={i18n.t("tabs.identifiers.details.delete.alert.title")}
        confirmButtonText={`${i18n.t(
          "tabs.identifiers.details.delete.alert.confirm"
        )}`}
        cancelButtonText={`${i18n.t(
          "tabs.identifiers.details.delete.alert.cancel"
        )}`}
        actionConfirm={handleAuthentication}
        actionCancel={cancelDelete}
        actionDismiss={cancelDelete}
      />
      <RotateKeyModal
        identifierId={identifierDetailId}
        onReloadData={getDetails}
        signingKey={cardData?.k[0] || ""}
        isOpen={openRotateKeyModal}
        onClose={() => setOpenRotateKeyModal(false)}
      />
      <Verification
        verifyIsOpen={verifyIsOpen}
        setVerifyIsOpen={(value, isCancel) => {
          if (isCancel) {
            setHidden(false);
          }

          setVerifyIsOpen(value);
        }}
        onVerify={handleDelete}
      />
    </>
  );
};

export { IdentifierDetailModule };
