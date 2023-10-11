import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonCol,
  IonFooter,
  IonGrid,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonRow,
  IonToolbar,
} from "@ionic/react";
import i18next from "i18next";
import { PageLayout } from "../layout/PageLayout";
import { i18n } from "../../../i18n";
import "./ArchivedCredentials.scss";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getCredsCache,
  setCredsCache,
} from "../../../store/reducers/credsCache";
import { formatShortDate } from "../../../utils";
import { VerifyPassword } from "../VerifyPassword";
import { VerifyPasscode } from "../VerifyPasscode";
import {
  Alert as AlertDelete,
  Alert as AlertRestore,
} from "../../components/Alert";
import {
  getStateCache,
  setCurrentOperation,
} from "../../../store/reducers/stateCache";
import { AriesAgent } from "../../../core/agent/agent";
import { CredentialShortDetails } from "../../../core/agent/agent.types";
import { ArchivedCredentialsProps } from "./ArchivedCredentials.types";

const ArchivedCredentials = ({
  archivedCredentialsIsOpen,
  setArchivedCredentialsIsOpen,
}: ArchivedCredentialsProps) => {
  const history = useHistory();
  const dispatch = useAppDispatch();
  const stateCache = useAppSelector(getStateCache);
  const credsCache = useAppSelector(getCredsCache);
  const [archivedCreds, setArchivedCreds] = useState<CredentialShortDetails[]>(
    []
  );
  const [activeList, setActiveList] = useState(false);
  const [selectedCredentials, setSelectedCredentials] = useState<string[]>([]);
  const [verifyPasswordIsOpen, setVerifyPasswordIsOpen] = useState(false);
  const [verifyPasscodeIsOpen, setVerifyPasscodeIsOpen] = useState(false);
  const [alertDeleteIsOpen, setAlertDeleteIsOpen] = useState(false);
  const [alertRestoreIsOpen, setAlertRestoreIsOpen] = useState(false);

  const fetchArchivedCreds = async () => {
    try {
      const creds = await AriesAgent.agent.credentials.getCredentials(true);
      setArchivedCreds(creds);
    } catch (e) {
      // @TODO - sdisalvo: handle error
    }
  };

  useEffect(() => {
    fetchArchivedCreds();
  }, []);

  const resetList = () => {
    setActiveList(false);
    setSelectedCredentials([]);
    fetchArchivedCreds();
  };

  const selectAll = () => {
    const data = [];
    for (const i in archivedCreds) {
      data.push(archivedCreds[i].id);
    }
    return data;
  };

  interface CredentialItemProps {
    key: number;
    index: number;
    credential: CredentialShortDetails;
  }

  const CredentialItem = ({ credential, index }: CredentialItemProps) => {
    const credentialColor = {
      background: `linear-gradient(91.86deg, ${credential.colors[0]} 28.76%, ${credential.colors[1]} 119.14%)`,
      zIndex: index,
    };

    return (
      <IonItem>
        <IonGrid>
          <IonRow>
            {activeList && (
              <IonCol className="credential-selector">
                <IonCheckbox
                  checked={selectedCredentials.includes(credential.id)}
                  onIonChange={() => {
                    handleSelectCredentials(credential.id);
                  }}
                />
              </IonCol>
            )}
            <IonCol
              className="credential-color"
              style={credentialColor}
            />
            <IonCol
              className="credential-info"
              onClick={() => handleShowCardDetails(credential.id)}
            >
              <IonLabel className="credential-name">
                {credential.credentialType}
              </IonLabel>
              <IonLabel className="credential-expiration">
                {formatShortDate(credential.issuanceDate)}
              </IonLabel>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonItem>
    );
  };

  const handleShowCardDetails = (id: string) => {
    const pathname = `/tabs/creds/${id}`;
    history.push({ pathname: pathname });
    setArchivedCredentialsIsOpen(false);
  };

  const handleSelectCredentials = (id: string) => {
    let data = selectedCredentials;
    let match = false;
    for (let i = 0; i < data.length; i++) {
      if (data[i] === id) {
        match = true;
        break;
      }
    }
    if (match) {
      data = data.filter((item) => item !== id);
    } else {
      data = [...selectedCredentials, id];
    }
    setSelectedCredentials(data);
  };

  const handleDeleteCredential = async (id: string) => {
    // @TODO - sdisalvo: hook up function to delete credential
    setVerifyPasswordIsOpen(false);
    setVerifyPasscodeIsOpen(false);
    await AriesAgent.agent.credentials.deleteCredential(id);
    const creds = credsCache.filter((item) => item.id !== id);
    dispatch(setCredsCache(creds));
    resetList();
  };

  const handleRestoreCredential = async (id: string) => {
    // @TODO - sdisalvo: hook up function to restore credential
    setVerifyPasswordIsOpen(false);
    setVerifyPasscodeIsOpen(false);
    await AriesAgent.agent.credentials.restoreCredential(id);
    const creds = [...credsCache];
    for (const i in creds) {
      if (creds[i].id == id) {
        creds[i].isArchived = false;
        break;
      }
    }
    dispatch(setCredsCache(creds));
    resetList();
  };

  return (
    <IonModal
      isOpen={archivedCredentialsIsOpen}
      className={""}
      data-testid="archived-credentials"
      onDidDismiss={() => setArchivedCredentialsIsOpen(false)}
    >
      <div
        className={`archived-credentials modal ${
          activeList ? "active-list" : ""
        }`}
      >
        <PageLayout
          header={true}
          closeButton={true}
          closeButtonAction={() =>
            activeList
              ? selectedCredentials.length > 0
                ? setSelectedCredentials([])
                : setSelectedCredentials(selectAll)
              : setArchivedCredentialsIsOpen(false)
          }
          closeButtonLabel={`${
            activeList
              ? selectedCredentials.length > 0
                ? i18n.t("creds.archived.deselectall")
                : i18n.t("creds.archived.selectall")
              : i18n.t("creds.archived.done")
          }`}
          actionButton={true}
          actionButtonAction={() => {
            setSelectedCredentials([]);
            setActiveList(!activeList);
          }}
          actionButtonLabel={`${
            activeList
              ? i18n.t("creds.archived.cancel")
              : i18n.t("creds.archived.edit")
          }`}
          title={`${i18n.t("creds.archived.title")}`}
        >
          <IonList
            lines="none"
            className="archived-credentials-list"
          >
            {archivedCreds.map(
              (credential: CredentialShortDetails, index: number) => {
                return (
                  <CredentialItem
                    key={index}
                    index={index}
                    credential={credential as CredentialShortDetails}
                  />
                );
              }
            )}
          </IonList>
          {activeList ? (
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
                  {i18next.t("creds.archived.selectedamount", {
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
          ) : null}
        </PageLayout>
      </div>
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
        actionCancel={() => dispatch(setCurrentOperation(""))}
        actionDismiss={() => dispatch(setCurrentOperation(""))}
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
        actionConfirm={() =>
          selectedCredentials.forEach((id) => handleRestoreCredential(id))
        }
        actionCancel={() => dispatch(setCurrentOperation(""))}
        actionDismiss={() => dispatch(setCurrentOperation(""))}
      />
      <VerifyPassword
        isOpen={verifyPasswordIsOpen}
        setIsOpen={setVerifyPasswordIsOpen}
        onVerify={() =>
          selectedCredentials.forEach((id) => handleDeleteCredential(id))
        }
      />
      <VerifyPasscode
        isOpen={verifyPasscodeIsOpen}
        setIsOpen={setVerifyPasscodeIsOpen}
        onVerify={() =>
          selectedCredentials.forEach((id) => handleDeleteCredential(id))
        }
      />
    </IonModal>
  );
};

export { ArchivedCredentials };
