import {
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
} from "@ionic/react";
import { ellipsisVertical } from "ionicons/icons";
import { useCallback, useState } from "react";
import { i18n } from "../../../i18n";
import { formatShortDate } from "../../utils/formatters";
import "./ConnectionDetails.scss";

import { Agent } from "../../../core/agent/agent";
import {
  ConnectionDetails as ConnectionData,
  ConnectionHistoryItem,
  ConnectionNoteDetails,
} from "../../../core/agent/agent.types";
import { RoutePath } from "../../../routes";
import { useAppDispatch } from "../../../store/hooks";
import { removeConnectionCache } from "../../../store/reducers/connectionsCache";
import {
  setCurrentOperation,
  setToastMsg,
} from "../../../store/reducers/stateCache";
import { Alert as AlertDeleteConnection } from "../../components/Alert";
import { CardDetailsBlock } from "../../components/CardDetails";
import { CloudError } from "../../components/CloudError";
import { ConnectionOptions } from "../../components/ConnectionOptions";
import { PageFooter } from "../../components/PageFooter";
import { PageHeader } from "../../components/PageHeader";
import { Verification } from "../../components/Verification";
import { ScrollablePageLayout } from "../../components/layout/ScrollablePageLayout";
import { OperationType, ToastMsgType } from "../../globals/types";
import { useOnlineStatusEffect } from "../../hooks";
import { showError } from "../../utils/error";
import { ConnectionDetailsProps } from "./ConnectionDetails.types";
import ConnectionDetailsHeader from "./components/ConnectionDetailsHeader";
import { ConnectionHistoryEvent } from "./components/ConnectionHistoryEvent";
import { ConnectionNotes } from "./components/ConnectionNotes";
import { EditConnectionsModal } from "./components/EditConnectionsModal";

const ConnectionDetails = ({
  connectionShortDetails,
  handleCloseConnectionModal,
  restrictedOptions,
}: ConnectionDetailsProps) => {
  const pageId = "connection-details";
  const dispatch = useAppDispatch();
  const [connectionDetails, setConnectionDetails] = useState<ConnectionData>();
  const [connectionHistory, setConnectionHistory] = useState<
    ConnectionHistoryItem[]
  >([]);
  const [optionsIsOpen, setOptionsIsOpen] = useState(false);
  const [alertDeleteConnectionIsOpen, setAlertDeleteConnectionIsOpen] =
    useState(false);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [notes, setNotes] = useState<ConnectionNoteDetails[]>([]);
  const [segmentValue, setSegmentValue] = useState("details");
  const [loading, setLoading] = useState({
    details: false,
    history: false,
  });
  const [cloudError, setCloudError] = useState(false);

  const getDetails = useCallback(async () => {
    if (!connectionShortDetails?.id) return;

    try {
      const connectionDetails = await Agent.agent.connections.getConnectionById(
        connectionShortDetails.id
      );

      setConnectionDetails(connectionDetails);
      setNotes(connectionDetails.notes);
      setConnectionHistory(connectionDetails.historyItems);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes(Agent.MISSING_DATA_ON_KERIA)
      ) {
        setCloudError(true);
      } else {
        handleCloseConnectionModal();
        showError("Unable to get connection details", error, dispatch);
      }
    } finally {
      setLoading((value) => ({ ...value, details: false, history: false }));
    }
  }, [connectionShortDetails?.id, dispatch]);

  const getData = useCallback(() => {
    if (!connectionShortDetails?.id) return;

    setLoading({
      history: true,
      details: true,
    });

    getDetails();
  }, [connectionShortDetails?.id, getDetails]);

  useOnlineStatusEffect(getData);

  const handleDelete = () => {
    setOptionsIsOpen(false);
    setAlertDeleteConnectionIsOpen(true);
  };

  const verifyAction = () => {
    async function deleteConnection() {
      try {
        if (cloudError) {
          await Agent.agent.connections.deleteStaleLocalConnectionById(
            connectionShortDetails.id
          );
        } else {
          await Agent.agent.connections.markConnectionPendingDelete(
            connectionShortDetails.id
          );
        }
        dispatch(setToastMsg(ToastMsgType.CONNECTION_DELETED));
        dispatch(removeConnectionCache(connectionShortDetails.id));
        handleCloseConnectionModal();
        setVerifyIsOpen(false);
      } catch (error) {
        showError(
          "Unable to delete connection",
          error,
          dispatch,
          ToastMsgType.DELETE_CONNECTION_FAIL
        );
      }
      dispatch(setCurrentOperation(OperationType.IDLE));
    }
    deleteConnection();
  };

  const connectionDetailsData = [
    {
      title: i18n.t("connections.details.label"),
      value: connectionDetails?.label,
    },
    {
      title: i18n.t("connections.details.date"),
      value: formatShortDate(`${connectionDetails?.createdAtUTC}`),
    },
    {
      title: i18n.t("connections.details.endpoints"),
      value:
        connectionDetails?.serviceEndpoints?.toString() ||
        i18n.t("connections.details.notavailable"),
    },
  ];

  if (loading.details || loading.history) {
    return (
      <div
        className="connection-detail-spinner-container"
        data-testid="connection-detail-spinner-container"
      >
        <IonSpinner name="circular" />
      </div>
    );
  }

  const deleteButtonAction = () => {
    setAlertDeleteConnectionIsOpen(true);
    dispatch(setCurrentOperation(OperationType.DELETE_CONNECTION));
  };

  const handleAuthentication = () => {
    setVerifyIsOpen(true);
  };

  const handleOpenNoteManageModal = () => {
    setModalIsOpen(true);
  };

  const cancelDeleteConnection = () =>
    dispatch(setCurrentOperation(OperationType.IDLE));

  return (
    <>
      {cloudError ? (
        <CloudError
          pageId={pageId}
          header={
            <PageHeader
              closeButton={true}
              closeButtonAction={handleCloseConnectionModal}
              closeButtonLabel={`${i18n.t("connections.details.done")}`}
              currentPath={RoutePath.CONNECTION_DETAILS}
            />
          }
        >
          <PageFooter
            pageId={pageId}
            deleteButtonText={`${i18n.t("connections.details.delete")}`}
            deleteButtonAction={() => deleteButtonAction()}
          />
        </CloudError>
      ) : (
        <ScrollablePageLayout
          pageId={pageId}
          activeStatus={true}
          customClass="item-details-page"
          header={
            <PageHeader
              closeButton={true}
              closeButtonAction={handleCloseConnectionModal}
              closeButtonLabel={`${i18n.t("connections.details.done")}`}
              currentPath={RoutePath.CONNECTION_DETAILS}
              actionButton={true}
              actionButtonAction={() => setOptionsIsOpen(true)}
              actionButtonIcon={ellipsisVertical}
            />
          }
        >
          <div className="connection-details-content">
            <ConnectionDetailsHeader
              logo={connectionDetails?.logo}
              label={connectionDetails?.label}
              date={connectionDetails?.createdAtUTC}
            />
            <IonSegment
              data-testid="connection-details-segment"
              value={segmentValue}
              onIonChange={(event) => setSegmentValue(`${event.detail.value}`)}
            >
              <IonSegmentButton
                value="details"
                data-testid="connection-details-segment-button"
              >
                <IonLabel>{`${i18n.t(
                  "connections.details.details"
                )}`}</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton
                value="notes"
                data-testid="connection-notes-segment-button"
              >
                <IonLabel>{`${i18n.t("connections.details.notes")}`}</IonLabel>
              </IonSegmentButton>
            </IonSegment>
            {segmentValue === "details" ? (
              <div
                className="connection-details-tab"
                data-testid="connection-details-tab"
              >
                {connectionDetailsData.map((infoBlock, index) => (
                  <CardDetailsBlock
                    className="connection-details-card"
                    key={index}
                    title={infoBlock.title}
                  >
                    {typeof infoBlock.value === "string" ? (
                      <IonText>{infoBlock.value}</IonText>
                    ) : (
                      infoBlock.value
                    )}
                  </CardDetailsBlock>
                ))}
                <CardDetailsBlock
                  className="connection-details-history"
                  title={i18n.t("connections.details.history")}
                >
                  {connectionHistory?.length > 0 &&
                    connectionHistory
                      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                      .map(
                        (historyItem: ConnectionHistoryItem, index: number) => (
                          <ConnectionHistoryEvent
                            key={index}
                            index={index}
                            historyItem={historyItem}
                            connectionDetails={connectionDetails}
                          />
                        )
                      )}
                  <ConnectionHistoryEvent
                    connectionDetails={connectionDetails}
                  />
                </CardDetailsBlock>
                {restrictedOptions ? (
                  <></>
                ) : (
                  <PageFooter
                    pageId={pageId}
                    deleteButtonText={`${i18n.t("connections.details.delete")}`}
                    deleteButtonAction={() => deleteButtonAction()}
                  />
                )}
              </div>
            ) : (
              <div
                className="connection-notes-tab"
                data-testid="connection-notes-tab"
              >
                <ConnectionNotes
                  notes={notes}
                  pageId={pageId}
                  onOptionButtonClick={handleOpenNoteManageModal}
                />
              </div>
            )}
          </div>
          <ConnectionOptions
            optionsIsOpen={optionsIsOpen}
            setOptionsIsOpen={setOptionsIsOpen}
            handleEdit={setModalIsOpen}
            handleDelete={handleDelete}
            restrictedOptions={restrictedOptions}
          />
        </ScrollablePageLayout>
      )}
      {connectionDetails && (
        <EditConnectionsModal
          notes={notes}
          setNotes={setNotes}
          modalIsOpen={modalIsOpen}
          setModalIsOpen={setModalIsOpen}
          connectionDetails={connectionDetails}
          onConfirm={getDetails}
        />
      )}
      <AlertDeleteConnection
        isOpen={alertDeleteConnectionIsOpen}
        setIsOpen={setAlertDeleteConnectionIsOpen}
        dataTestId="alert-confirm-delete-connection"
        headerText={i18n.t(
          "connections.details.options.alert.deleteconnection.title"
        )}
        confirmButtonText={`${i18n.t(
          "connections.details.options.alert.deleteconnection.confirm"
        )}`}
        cancelButtonText={`${i18n.t(
          "connections.details.options.alert.deleteconnection.cancel"
        )}`}
        actionConfirm={() => handleAuthentication()}
        actionCancel={cancelDeleteConnection}
        actionDismiss={cancelDeleteConnection}
      />
      <Verification
        verifyIsOpen={verifyIsOpen}
        setVerifyIsOpen={setVerifyIsOpen}
        onVerify={verifyAction}
      />
    </>
  );
};

export { ConnectionDetails };
