import {
  IonButton,
  IonButtons,
  IonFooter,
  IonList,
  IonModal,
  IonToolbar,
} from "@ionic/react";
import { t } from "i18next";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Agent } from "../../../core/agent/agent";
import { NotificationRoute } from "../../../core/agent/services/keriaNotificationService.types";
import { CredentialShortDetails } from "../../../core/agent/services/credentialService.types";
import { i18n } from "../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setCredsArchivedCache } from "../../../store/reducers/credsArchivedCache";
import {
  getCredsCache,
  setCredsCache,
} from "../../../store/reducers/credsCache";
import {
  getNotificationsCache,
  setNotificationsCache,
} from "../../../store/reducers/notificationsCache";
import {
  setCurrentOperation,
  setToastMsg,
} from "../../../store/reducers/stateCache";
import {
  Alert as AlertDelete,
  Alert as AlertRestore,
} from "../../components/Alert";
import { OperationType, ToastMsgType } from "../../globals/types";
import { CredentialDetailModal } from "../CredentialDetailModule";
import { ScrollablePageLayout } from "../layout/ScrollablePageLayout";
import { ListHeader } from "../ListHeader";
import { PageHeader } from "../PageHeader";
import { Verification } from "../Verification";
import "./ArchivedCredentials.scss";
import {
  ArchivedCredentialsContainerRef,
  ArchivedCredentialsProps,
} from "./ArchivedCredentials.types";
import { CredentialItem } from "./CredentialItem";
import { showError } from "../../utils/error";

const ArchivedCredentialsContainer = forwardRef<
  ArchivedCredentialsContainerRef,
  ArchivedCredentialsProps
>(({ archivedCreds, revokedCreds, setArchivedCredentialsIsOpen }, ref) => {
  const componentId = "archived-credentials";
  const dispatch = useAppDispatch();
  const credsCache = useAppSelector(getCredsCache);
  const notifications = useAppSelector(getNotificationsCache);
  const [activeList, setActiveList] = useState(false);
  const [selectedCredentials, setSelectedCredentials] = useState<string[]>([]);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const [alertDeleteIsOpen, setAlertDeleteIsOpen] = useState(false);
  const [alertRestoreIsOpen, setAlertRestoreIsOpen] = useState(false);
  const [alertRestoreRevoked, setAlertRestoreRevoked] = useState(false);
  const [viewCred, setViewCred] = useState("");
  const [isOpenCredModal, setIsOpenCredModal] = useState(false);
  const haveRevokedCreds = revokedCreds.length > 0;
  const haveArchivedCreds = archivedCreds.length > 0;
  const hasData = haveArchivedCreds || haveRevokedCreds;

  useEffect(() => {
    if (!hasData) setArchivedCredentialsIsOpen(false);
  }, [hasData, setArchivedCredentialsIsOpen]);

  const resetList = () => {
    setActiveList(false);
    setSelectedCredentials([]);
  };

  useImperativeHandle(ref, () => ({
    clearAchirvedState: resetList,
  }));

  const selectAll = () => {
    const data = [];
    for (const i in archivedCreds) {
      data.push(archivedCreds[i].id);
    }
    for (const i in revokedCreds) {
      data.push(revokedCreds[i].id);
    }
    return data;
  };

  const handleShowCardDetails = (id: string) => {
    setViewCred(id);
    setIsOpenCredModal(true);
  };

  const handleHideCardDetails = () => {
    setViewCred("");
    setIsOpenCredModal(false);
  };

  const handleSelectCredentials = (id: string) => {
    let data = selectedCredentials;
    if (data.find((item) => item === id)) {
      data = data.filter((item) => item !== id);
    } else {
      data = [...selectedCredentials, id];
    }
    setSelectedCredentials(data);
  };

  const deleteRevokedNotification = async (deletedRevokedIds: string[]) => {
    const deleteRes = await Promise.allSettled(
      deletedRevokedIds.map((id) => {
        const notification = notifications.find(
          (noti) => noti.a.credentialId === id
        );

        if (!notification) return Promise.reject();

        return Agent.agent.keriaNotifications.deleteNotificationRecordById(
          notification.id,
          notification.a.r as NotificationRoute
        );
      })
    );

    let newNotification = [...notifications];

    deleteRes.forEach((item, index) => {
      if (item.status === "rejected") return;

      newNotification = newNotification.filter(
        (noti) => noti.a.credentialId !== deletedRevokedIds[index]
      );
    });

    dispatch(setNotificationsCache(newNotification));
  };

  const handleDeleteCredentialBatches = async (selectedIds: string[]) => {
    setVerifyIsOpen(false);

    if (selectedIds.length === 0) return;

    const selectedRevokedIds = selectedIds.filter((id) =>
      revokedCreds.some((item) => item.id === id)
    );

    try {
      await Promise.all(
        selectedRevokedIds.map((id) =>
          Agent.agent.credentials.archiveCredential(id)
        )
      );
      const deleteRes = await Promise.allSettled(
        selectedIds.map((id) =>
          Agent.agent.credentials.markCredentialPendingDeletion(id)
        )
      );

      const deleteSuccessCrendentials: string[] = [];
      const deletedRevokedIds: string[] = [];

      deleteRes.forEach((res, index) => {
        if (res.status === "rejected") return;

        deleteSuccessCrendentials.push(selectedIds[index]);

        if (selectedRevokedIds.includes(selectedIds[index])) {
          deletedRevokedIds.push(selectedIds[index]);
        }
      });

      if (deleteSuccessCrendentials.length === 0) return;

      if (deletedRevokedIds.length > 0) {
        await deleteRevokedNotification(deletedRevokedIds);
      }

      const newCredData = credsCache.filter(
        (item) => !deleteSuccessCrendentials.includes(item.id)
      );

      dispatch(setCredsCache(newCredData));
      const creds = await Agent.agent.credentials.getCredentials(true);
      dispatch(setCredsArchivedCache(creds));
    } catch (e) {
      showError(
        "Unable to delete creds",
        e,
        dispatch,
        ToastMsgType.DELETE_CRED_FAIL
      );
    }
  };

  const handleRestoreCredentials = async (selectedIds: string[]) => {
    setVerifyIsOpen(false);

    if (selectedIds.length === 0) return;

    try {
      const restoreRes = await Promise.allSettled(
        selectedIds.map((id) => Agent.agent.credentials.restoreCredential(id))
      );

      const restoreSuccessCrendentials: CredentialShortDetails[] = [];

      restoreRes.forEach((res, index) => {
        if (res.status === "rejected") return;

        const restoredCred = archivedCreds.find(
          (cred) => cred.id === selectedIds[index]
        );

        if (restoredCred) {
          restoreSuccessCrendentials.push(restoredCred);
        }
      });

      if (restoreSuccessCrendentials.length === 0) return;

      dispatch(setCredsCache([...credsCache, ...restoreSuccessCrendentials]));

      const creds = await Agent.agent.credentials.getCredentials(true);
      dispatch(setCredsArchivedCache(creds));
    } catch (e) {
      showError("Unable to restore credentials", e, dispatch);
    }
  };

  const handleCancelAction = () => {
    !activeList && setSelectedCredentials([]);
    dispatch(setCurrentOperation(OperationType.IDLE));
  };

  const handlePageClose = () =>
    activeList
      ? selectedCredentials.length > 0
        ? setSelectedCredentials([])
        : setSelectedCredentials(selectAll)
      : setArchivedCredentialsIsOpen(false);

  const closeButtonLabel = `${
    activeList
      ? selectedCredentials.length > 0
        ? i18n.t("tabs.credentials.archived.deselectall")
        : i18n.t("tabs.credentials.archived.selectall")
      : i18n.t("tabs.credentials.archived.done")
  }`;

  const handleActionButtonClick = () => {
    setSelectedCredentials([]);
    setActiveList(!activeList);
  };

  const actionButtonLabel = `${
    activeList
      ? i18n.t("tabs.credentials.archived.cancel")
      : i18n.t("tabs.credentials.archived.select")
  }`;

  const handleClickCard = (id: string) => {
    activeList ? handleSelectCredentials(id) : handleShowCardDetails(id);
  };

  const handleCardCheckboxChange = (id: string) => {
    handleSelectCredentials(id);
  };

  const handleCardRestoreClick = (id: string) => {
    setSelectedCredentials([id]);
    setAlertRestoreIsOpen(true);
  };

  const handleCardDeleteClick = (id: string) => {
    setSelectedCredentials([id]);
    setAlertDeleteIsOpen(true);
  };

  const handleAfterVerify = async () => {
    await handleDeleteCredentialBatches(selectedCredentials);
    dispatch(
      setToastMsg(
        selectedCredentials.length === 1
          ? ToastMsgType.CREDENTIAL_DELETED
          : ToastMsgType.CREDENTIALS_DELETED
      )
    );
    resetList();
  };

  const handleHardwareBackButton = () => {
    if (activeList) {
      handleActionButtonClick();
      return;
    }

    setArchivedCredentialsIsOpen(false);
  };

  const handleBatchRestore = () => {
    const isRestoreRevokedCred = selectedCredentials.some((id) =>
      revokedCreds.some((item) => item.id === id)
    );

    if (isRestoreRevokedCred) {
      setAlertRestoreRevoked(true);
      return;
    }

    setAlertRestoreIsOpen(true);
  };

  return (
    <>
      <ScrollablePageLayout
        pageId={componentId + "-content"}
        customClass={activeList ? "active-list" : ""}
        header={
          <PageHeader
            closeButton={true}
            closeButtonAction={handlePageClose}
            closeButtonLabel={closeButtonLabel}
            actionButton={true}
            actionButtonAction={handleActionButtonClick}
            actionButtonLabel={actionButtonLabel}
            title={`${i18n.t("tabs.credentials.archived.title")}`}
            hardwareBackButtonConfig={{
              prevent: false,
              handler: handleHardwareBackButton,
            }}
          />
        }
      >
        {haveRevokedCreds && haveArchivedCreds && (
          <ListHeader
            title={`${i18n.t("tabs.credentials.archived.archivedtitle")}`}
          />
        )}
        {haveArchivedCreds && (
          <IonList
            lines="none"
            className={`archived-credentials-list ${
              haveRevokedCreds ? "all-border" : ""
            }`}
          >
            {archivedCreds.map((credential: CredentialShortDetails) => {
              return (
                <CredentialItem
                  key={credential.id}
                  credential={credential}
                  activeList={activeList}
                  onClick={handleClickCard}
                  onCheckboxChange={handleCardCheckboxChange}
                  onDelete={handleCardDeleteClick}
                  onRestore={handleCardRestoreClick}
                  isSelected={selectedCredentials.includes(credential.id)}
                />
              );
            })}
          </IonList>
        )}
        {haveRevokedCreds && haveArchivedCreds && (
          <ListHeader
            title={`${i18n.t("tabs.credentials.archived.revokedtitle")}`}
          />
        )}
        {haveRevokedCreds && (
          <IonList
            lines="none"
            className="archived-credentials-list"
          >
            {revokedCreds.map((credential: CredentialShortDetails) => {
              return (
                <CredentialItem
                  key={credential.id}
                  credential={credential}
                  activeList={activeList}
                  onClick={handleClickCard}
                  onCheckboxChange={handleCardCheckboxChange}
                  onDelete={handleCardDeleteClick}
                  isSelected={selectedCredentials.includes(credential.id)}
                />
              );
            })}
          </IonList>
        )}
        {activeList && (
          <IonFooter
            collapse="fade"
            className="archived-credentials-footer ion-no-border"
          >
            <IonToolbar
              color="light"
              className="page-footer"
            >
              <IonButtons slot="start">
                <IonButton
                  className="delete-credentials-label"
                  onClick={() => setAlertDeleteIsOpen(true)}
                  data-testid="delete-credentials"
                >
                  {i18n.t("tabs.credentials.archived.delete")}
                </IonButton>
              </IonButtons>
              <div
                data-testid="selected-amount-credentials"
                className="selected-amount-credentials-label"
              >
                {selectedCredentials.length === 1
                  ? i18n.t("tabs.credentials.archived.oneselected")
                  : t("tabs.credentials.archived.manyselected", {
                    amount: selectedCredentials.length,
                  })}
              </div>
              <IonButtons slot="end">
                <IonButton
                  className="restore-credentials-label"
                  onClick={handleBatchRestore}
                  data-testid="restore-credentials"
                >
                  {i18n.t("tabs.credentials.archived.restore")}
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonFooter>
        )}
      </ScrollablePageLayout>
      <AlertDelete
        isOpen={alertDeleteIsOpen}
        setIsOpen={setAlertDeleteIsOpen}
        dataTestId="alert-delete"
        headerText={i18n.t("tabs.credentials.details.alert.delete.title")}
        confirmButtonText={`${i18n.t(
          "tabs.credentials.details.alert.delete.confirm"
        )}`}
        cancelButtonText={`${i18n.t(
          "tabs.credentials.details.alert.delete.cancel"
        )}`}
        actionConfirm={() => {
          setVerifyIsOpen(true);
        }}
        actionCancel={handleCancelAction}
        actionDismiss={handleCancelAction}
      />
      <AlertRestore
        isOpen={alertRestoreIsOpen}
        setIsOpen={setAlertRestoreIsOpen}
        dataTestId="alert-restore"
        headerText={i18n.t("tabs.credentials.details.alert.restore.title")}
        confirmButtonText={`${i18n.t(
          "tabs.credentials.details.alert.restore.confirm"
        )}`}
        cancelButtonText={`${i18n.t(
          "tabs.credentials.details.alert.restore.cancel"
        )}`}
        actionConfirm={async () => {
          await handleRestoreCredentials(selectedCredentials);
          dispatch(
            setToastMsg(
              selectedCredentials.length === 1
                ? ToastMsgType.CREDENTIAL_RESTORED
                : ToastMsgType.CREDENTIALS_RESTORED
            )
          );
          resetList();
        }}
        actionCancel={handleCancelAction}
        actionDismiss={handleCancelAction}
      />
      <AlertRestore
        isOpen={alertRestoreRevoked}
        setIsOpen={setAlertRestoreRevoked}
        dataTestId="alert-restore-revoked"
        headerText={i18n.t(
          "tabs.credentials.archived.alert.restorerevoked.title"
        )}
        confirmButtonText={`${i18n.t(
          "tabs.credentials.archived.alert.restorerevoked.confirm"
        )}`}
        actionConfirm={() => {
          setAlertRestoreRevoked(false);
        }}
      />
      <Verification
        verifyIsOpen={verifyIsOpen}
        setVerifyIsOpen={setVerifyIsOpen}
        onVerify={handleAfterVerify}
      />
      <CredentialDetailModal
        pageId="archived-credential-detail"
        isOpen={isOpenCredModal}
        setIsOpen={setIsOpenCredModal}
        onClose={handleHideCardDetails}
        id={viewCred}
      />
    </>
  );
});

const ArchivedCredentials = ({
  archivedCreds,
  archivedCredentialsIsOpen,
  revokedCreds,
  setArchivedCredentialsIsOpen,
}: ArchivedCredentialsProps) => {
  const componentId = "archived-credentials";

  const containerRef = useRef<ArchivedCredentialsContainerRef>(null);

  return (
    <>
      <IonModal
        isOpen={archivedCredentialsIsOpen}
        className={`${componentId}-modal`}
        data-testid={componentId}
        onDidDismiss={() => {
          setArchivedCredentialsIsOpen(false);
          containerRef.current?.clearAchirvedState();
        }}
      >
        <ArchivedCredentialsContainer
          revokedCreds={revokedCreds}
          ref={containerRef}
          archivedCreds={archivedCreds}
          archivedCredentialsIsOpen={archivedCredentialsIsOpen}
          setArchivedCredentialsIsOpen={setArchivedCredentialsIsOpen}
        />
      </IonModal>
    </>
  );
};

export { ArchivedCredentials, ArchivedCredentialsContainer };
