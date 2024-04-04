import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import {
  IonButton,
  IonButtons,
  IonFooter,
  IonList,
  IonModal,
  IonToolbar,
} from "@ionic/react";
import i18next from "i18next";
import { i18n } from "../../../i18n";
import "./ArchivedCredentials.scss";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { VerifyPassword } from "../VerifyPassword";
import { VerifyPasscode } from "../VerifyPasscode";
import {
  Alert as AlertDelete,
  Alert as AlertRestore,
} from "../../components/Alert";
import {
  getStateCache,
  setCurrentOperation,
  setToastMsg,
} from "../../../store/reducers/stateCache";
import { AriesAgent } from "../../../core/agent/agent";
import {
  ArchivedCredentialsContainerRef,
  ArchivedCredentialsProps,
} from "./ArchivedCredentials.types";
import { OperationType, ToastMsgType } from "../../globals/types";
import {
  getCredsCache,
  setCredsCache,
} from "../../../store/reducers/credsCache";
import { CredentialShortDetails } from "../../../core/agent/services/credentialService.types";
import { ScrollablePageLayout } from "../layout/ScrollablePageLayout";
import { PageHeader } from "../PageHeader";
import { CredentialItem } from "./CredentialItem";

const ArchivedCredentialsContainer = forwardRef<
  ArchivedCredentialsContainerRef,
  ArchivedCredentialsProps
>(({ archivedCreds, setArchivedCredentialsIsOpen }, ref) => {
  const componentId = "archived-credentials";
  const history = useHistory();
  const dispatch = useAppDispatch();
  const credsCache = useAppSelector(getCredsCache);
  const stateCache = useAppSelector(getStateCache);
  const [activeList, setActiveList] = useState(false);
  const [selectedCredentials, setSelectedCredentials] = useState<string[]>([]);
  const [verifyPasswordIsOpen, setVerifyPasswordIsOpen] = useState(false);
  const [verifyPasscodeIsOpen, setVerifyPasscodeIsOpen] = useState(false);
  const [alertDeleteIsOpen, setAlertDeleteIsOpen] = useState(false);
  const [alertRestoreIsOpen, setAlertRestoreIsOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    clearAchirvedState: () => {
      setActiveList(false);
      setSelectedCredentials([]);
    },
  }));

  const resetList = () => {
    setActiveList(false);
    setSelectedCredentials([]);
  };

  const selectAll = () => {
    const data = [];
    for (const i in archivedCreds) {
      data.push(archivedCreds[i].id);
    }
    return data;
  };

  const handleShowCardDetails = (id: string) => {
    const pathname = `/tabs/creds/${id}`;
    history.push({ pathname: pathname });
    setArchivedCredentialsIsOpen(false);
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

  const handleDeleteCredentialBatches = async (ids: string[]) => {
    setVerifyPasswordIsOpen(false);
    setVerifyPasscodeIsOpen(false);
    // @TODO - sdisalvo: handle error
    await Promise.all(
      ids.map((id) => AriesAgent.agent.credentials.deleteCredential(id))
    );
  };

  const handleRestoreCredentials = async (selectedIds: string[]) => {
    setVerifyPasswordIsOpen(false);
    setVerifyPasscodeIsOpen(false);

    if (selectedIds.length === 0) return;

    try {
      const restoreRes = await Promise.allSettled(
        selectedIds.map((id) =>
          AriesAgent.agent.credentials.restoreCredential(id)
        )
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
    } catch (e) {
      // TODO: Handle error
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
        ? i18n.t("creds.archived.deselectall")
        : i18n.t("creds.archived.selectall")
      : i18n.t("creds.archived.done")
  }`;

  const handleActionButtonClick = () => {
    setSelectedCredentials([]);
    setActiveList(!activeList);
  };

  const actionButtonLabel = `${
    activeList
      ? i18n.t("creds.archived.cancel")
      : i18n.t("creds.archived.select")
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
            title={`${i18n.t("creds.archived.title")}`}
          />
        }
      >
        <IonList
          lines="none"
          className="archived-credentials-list"
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
                  {i18n.t("creds.archived.delete")}
                </IonButton>
              </IonButtons>
              <div className="selected-amount-credentials-label">
                {selectedCredentials.length === 1
                  ? i18n.t("creds.archived.oneselected")
                  : i18next.t("creds.archived.manyselected", {
                    amount: selectedCredentials.length,
                  })}
              </div>
              <IonButtons slot="end">
                <IonButton
                  className="restore-credentials-label"
                  onClick={() => setAlertRestoreIsOpen(true)}
                  data-testid="restore-credentials"
                >
                  {i18n.t("creds.archived.restore")}
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
        headerText={i18n.t("creds.card.details.alert.delete.title")}
        confirmButtonText={`${i18n.t(
          "creds.card.details.alert.delete.confirm"
        )}`}
        cancelButtonText={`${i18n.t("creds.card.details.alert.delete.cancel")}`}
        actionConfirm={() => {
          if (
            !stateCache?.authentication.passwordIsSkipped &&
            stateCache?.authentication.passwordIsSet
          ) {
            setVerifyPasswordIsOpen(true);
          } else {
            setVerifyPasscodeIsOpen(true);
          }
        }}
        actionCancel={handleCancelAction}
        actionDismiss={handleCancelAction}
      />
      <AlertRestore
        isOpen={alertRestoreIsOpen}
        setIsOpen={setAlertRestoreIsOpen}
        dataTestId="alert-restore"
        headerText={i18n.t("creds.card.details.alert.restore.title")}
        confirmButtonText={`${i18n.t(
          "creds.card.details.alert.restore.confirm"
        )}`}
        cancelButtonText={`${i18n.t(
          "creds.card.details.alert.restore.cancel"
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
      <VerifyPassword
        isOpen={verifyPasswordIsOpen}
        setIsOpen={setVerifyPasswordIsOpen}
        onVerify={async () => {
          await handleDeleteCredentialBatches(selectedCredentials);
          dispatch(
            setToastMsg(
              selectedCredentials.length === 1
                ? ToastMsgType.CREDENTIAL_DELETED
                : ToastMsgType.CREDENTIALS_DELETED
            )
          );
          resetList();
        }}
      />
      <VerifyPasscode
        isOpen={verifyPasscodeIsOpen}
        setIsOpen={setVerifyPasscodeIsOpen}
        onVerify={async () => {
          await handleDeleteCredentialBatches(selectedCredentials);
          dispatch(
            setToastMsg(
              selectedCredentials.length === 1
                ? ToastMsgType.CREDENTIAL_DELETED
                : ToastMsgType.CREDENTIALS_DELETED
            )
          );
          resetList();
        }}
      />
    </>
  );
});

const ArchivedCredentials = ({
  archivedCreds,
  archivedCredentialsIsOpen,
  setArchivedCredentialsIsOpen,
}: ArchivedCredentialsProps) => {
  const componentId = "archived-credentials";

  const containerRef = useRef<ArchivedCredentialsContainerRef>(null);

  return (
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
        ref={containerRef}
        archivedCreds={archivedCreds}
        archivedCredentialsIsOpen={archivedCredentialsIsOpen}
        setArchivedCredentialsIsOpen={setArchivedCredentialsIsOpen}
      />
    </IonModal>
  );
};

export { ArchivedCredentials, ArchivedCredentialsContainer };
