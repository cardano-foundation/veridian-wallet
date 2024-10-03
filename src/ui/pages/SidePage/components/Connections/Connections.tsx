import {
  IonButton,
  IonCol,
  IonContent,
  IonGrid,
  IonIcon,
  IonItemDivider,
  IonItemGroup,
  IonLabel,
  IonRow,
} from "@ionic/react";
import { addOutline } from "ionicons/icons";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { useHistory } from "react-router-dom";
import { Agent } from "../../../../../core/agent/agent";
import {
  ConnectionShortDetails,
  ConnectionStatus,
} from "../../../../../core/agent/agent.types";
import { IdentifierShortDetails } from "../../../../../core/agent/services/identifier.types";
import { i18n } from "../../../../../i18n";
import { getNextRoute } from "../../../../../routes/nextRoute";
import { DataProps } from "../../../../../routes/nextRoute/nextRoute.types";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import {
  getConnectionsCache,
  getOpenConnectionId,
  removeConnectionCache,
  setOpenConnectionDetail,
} from "../../../../../store/reducers/connectionsCache";
import { getIdentifiersCache } from "../../../../../store/reducers/identifiersCache";
import {
  getCurrentOperation,
  getStateCache,
  setCurrentOperation,
  setToastMsg,
  showConnections as updateShowConnections,
} from "../../../../../store/reducers/stateCache";
import { Alert } from "../../../../components/Alert";
import { CardsPlaceholder } from "../../../../components/CardsPlaceholder";
import { TabsRoutePath } from "../../../../components/navigation/TabsMenu";
import { RemovePendingAlert } from "../../../../components/RemovePendingAlert";
import { ShareConnection } from "../../../../components/ShareConnection";
import { ShareType } from "../../../../components/ShareConnection/ShareConnection.types";
import {
  OperationType,
  RequestType,
  ToastMsgType,
} from "../../../../globals/types";
import { useSwipeBack } from "../../../../hooks/swipeBackHook";
import { AlphabeticList } from "./components/AlphabeticList";
import { AlphabetSelector } from "./components/AlphabetSelector";
import { ConnectionsOptionModal } from "./components/ConnectionsOptionModal";
import { IdentifierSelectorModal } from "./components/IdentifierSelectorModal/IdentifierSelectorModal";
import "./Connections.scss";
import {
  ConnectionsComponentProps,
  ConnectionsOptionRef,
  MappedConnections,
} from "./Connections.types";
import { useOnlineStatusEffect } from "../../../../hooks";
import { showError } from "../../../../utils/error";
import { ScrollablePageLayout } from "../../../../components/layout/ScrollablePageLayout";
import { PageHeader } from "../../../../components/PageHeader";
import { ConnectionDetails } from "../../../ConnectionDetails";

const Connections = forwardRef<ConnectionsOptionRef, ConnectionsComponentProps>(
  ({ showConnections, setShowConnections }, ref) => {
    const pageId = "connections";
    const history = useHistory();
    const dispatch = useAppDispatch();
    const stateCache = useAppSelector(getStateCache);
    const currentOperation = useAppSelector(getCurrentOperation);
    const connectionsCache = useAppSelector(getConnectionsCache);
    const identifierCache = useAppSelector(getIdentifiersCache);
    const [connectionShortDetails, setConnectionShortDetails] = useState<
      ConnectionShortDetails | undefined
    >(undefined);
    const availableIdentifiers = identifierCache.filter(
      (item) => !item.isPending
    );
    const [mappedConnections, setMappedConnections] = useState<
      MappedConnections[]
    >([]);
    const [connectModalIsOpen, setConnectModalIsOpen] = useState(false);
    const [openIdentifierSelector, setOpenIdentifierSelector] = useState(false);
    const [selectedIdentifier, setSelectedIdentifier] =
      useState<IdentifierShortDetails | null>(null);
    const [showPlaceholder, setShowPlaceholder] = useState(
      Object.keys(connectionsCache)?.length === 0
    );
    const [openIdentifierMissingAlert, setOpenIdentifierMissingAlert] =
      useState<boolean>(false);
    const [deletePendingItem, setDeletePendingItem] =
      useState<ConnectionShortDetails | null>(null);
    const [openDeletePendingAlert, setOpenDeletePendingAlert] = useState(false);
    const userName = stateCache.authentication.userName;
    const [oobi, setOobi] = useState("");

    const fetchOobi = useCallback(async () => {
      try {
        if (!selectedIdentifier?.id) return;

        const oobiValue = await Agent.agent.connections.getOobi(
          `${selectedIdentifier.id}`,
          userName
        );
        if (oobiValue) {
          setOobi(oobiValue);
        }
      } catch (e) {
        showError("Unable to fetch connection oobi", e, dispatch);
      }
    }, [selectedIdentifier?.id, userName, dispatch]);

    useOnlineStatusEffect(fetchOobi);

    useEffect(() => {
      setShowPlaceholder(Object.keys(connectionsCache).length === 0);
    }, [connectionsCache]);

    useEffect(() => {
      if (currentOperation === OperationType.BACK_TO_SHARE_CONNECTION) {
        setShowConnections(true);
        dispatch(setCurrentOperation(OperationType.IDLE));
      }
    }, [currentOperation, dispatch, setShowConnections]);

    const handleDone = () => {
      setShowConnections(false);
      dispatch(updateShowConnections(false));
    };

    const AdditionalButtons = () => {
      return (
        <IonButton
          shape="round"
          className="add-button"
          data-testid="add-connection-button"
          onClick={handleConnectModal}
        >
          <IonIcon
            slot="icon-only"
            icon={addOutline}
            color="primary"
          />
        </IonButton>
      );
    };

    const handleNavToCreateKeri = () => {
      setOpenIdentifierMissingAlert(false);
      history.location.pathname === TabsRoutePath.IDENTIFIERS &&
        dispatch(
          setCurrentOperation(
            OperationType.CREATE_IDENTIFIER_SHARE_CONNECTION_FROM_IDENTIFIERS
          )
        );
      history.location.pathname === TabsRoutePath.CREDENTIALS &&
        dispatch(
          setCurrentOperation(
            OperationType.CREATE_IDENTIFIER_SHARE_CONNECTION_FROM_CREDENTIALS
          )
        ) &&
        history.push(TabsRoutePath.IDENTIFIERS);
    };

    const handleProvideQr = () => {
      availableIdentifiers.length
        ? setOpenIdentifierSelector(true)
        : setOpenIdentifierMissingAlert(true);
    };

    const handleConnectModal = () => {
      setConnectModalIsOpen(true);
    };

    useImperativeHandle(ref, () => ({
      handleConnectModalButton: handleConnectModal,
    }));

    const handleCloseAlert = () => {
      setOpenIdentifierMissingAlert(false);
    };

    const handleShowConnectionDetails = (item: ConnectionShortDetails) => {
      if (item.status === ConnectionStatus.PENDING) {
        setDeletePendingItem(item);
        setOpenDeletePendingAlert(true);
        return;
      }

      setConnectionShortDetails(item);
    };

    useEffect(() => {
      const connections = Object.values(connectionsCache);
      if (connections.length) {
        const sortedConnections = [...connections].sort(function (a, b) {
          const textA = a.label.toUpperCase();
          const textB = b.label.toUpperCase();
          return textA < textB ? -1 : textA > textB ? 1 : 0;
        });

        const mapConnections = ((m, a) => (
          a.forEach((s) => {
            const a = m.get(s.label[0]) || [];
            m.set(s.label[0], (a.push(s), a));
          }),
          m
        ))(new Map(), sortedConnections);

        const mapToArray = Array.from(mapConnections, ([key, value]) => ({
          key,
          value,
        }));
        setMappedConnections(mapToArray);
      }
    }, [connectionsCache]);

    const backHardwareConfig = useMemo(
      () => ({
        prevent: !showConnections,
      }),
      [showConnections]
    );

    const getConnectionsTab = useCallback(() => {
      return document.getElementById(pageId);
    }, []);

    const canStart = useCallback(() => {
      return showConnections;
    }, [showConnections]);

    useSwipeBack(getConnectionsTab, canStart, () => setShowConnections(false));

    const deletePendingCheckProps = useMemo(
      () => ({
        title: i18n.t("connections.tab.detelepending.title"),
        description: i18n.t("connections.tab.detelepending.description"),
        button: i18n.t("connections.tab.detelepending.button"),
      }),
      []
    );

    const deleteConnection = async () => {
      if (!deletePendingItem) return;

      try {
        setDeletePendingItem(null);
        await Agent.agent.connections.deleteStaleLocalConnectionById(
          deletePendingItem.id
        );
        dispatch(setToastMsg(ToastMsgType.CONNECTION_DELETED));
        dispatch(removeConnectionCache(deletePendingItem.id));
      } catch (error) {
        showError(
          "Unable to delete connection",
          error,
          dispatch,
          ToastMsgType.DELETE_CONNECTION_FAIL
        );
      }
      dispatch(setCurrentOperation(OperationType.IDLE));
    };

    return connectionShortDetails ? (
      <ConnectionDetails
        connectionShortDetails={connectionShortDetails}
        setConnectionShortDetails={setConnectionShortDetails}
      />
    ) : (
      <>
        <ScrollablePageLayout
          pageId={pageId}
          activeStatus={true}
          header={
            <PageHeader
              hardwareBackButtonConfig={backHardwareConfig}
              backButton={true}
              onBack={handleDone}
              title={`${i18n.t("connections.tab.title")}`}
              additionalButtons={<AdditionalButtons />}
            />
          }
        >
          {showPlaceholder ? (
            <CardsPlaceholder
              buttonLabel={i18n.t("connections.tab.create")}
              buttonAction={handleConnectModal}
              testId={pageId}
            />
          ) : (
            <div className="connections-center">
              <IonContent className="connections-container">
                <IonGrid>
                  <IonRow>
                    <IonCol size="12">
                      {mappedConnections.map((alphabeticGroup, index) => {
                        return (
                          <IonItemGroup
                            className="connections-list"
                            key={index}
                          >
                            <IonItemDivider id={alphabeticGroup.key}>
                              <IonLabel>{alphabeticGroup.key}</IonLabel>
                            </IonItemDivider>
                            <AlphabeticList
                              items={Array.from(alphabeticGroup.value)}
                              handleShowConnectionDetails={
                                handleShowConnectionDetails
                              }
                            />
                          </IonItemGroup>
                        );
                      })}
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonContent>
              <AlphabetSelector />
            </div>
          )}
        </ScrollablePageLayout>
        <ConnectionsOptionModal
          type={RequestType.CONNECTION}
          connectModalIsOpen={connectModalIsOpen}
          setConnectModalIsOpen={setConnectModalIsOpen}
          handleProvideQr={handleProvideQr}
        />
        <IdentifierSelectorModal
          open={openIdentifierSelector}
          setOpen={setOpenIdentifierSelector}
          onSubmit={setSelectedIdentifier}
        />
        <ShareConnection
          isOpen={!!selectedIdentifier}
          setIsOpen={() => setSelectedIdentifier(null)}
          oobi={oobi}
          shareType={ShareType.Connection}
        />
        <Alert
          isOpen={openIdentifierMissingAlert}
          setIsOpen={setOpenIdentifierMissingAlert}
          dataTestId="alert-create-keri"
          headerText={i18n.t("connections.tab.alert.message")}
          confirmButtonText={`${i18n.t("connections.tab.alert.confirm")}`}
          cancelButtonText={`${i18n.t("connections.tab.alert.cancel")}`}
          actionConfirm={handleNavToCreateKeri}
          actionCancel={handleCloseAlert}
          actionDismiss={handleCloseAlert}
        />
        <RemovePendingAlert
          pageId={pageId}
          openFirstCheck={openDeletePendingAlert}
          firstCheckProps={deletePendingCheckProps}
          onClose={() => setOpenDeletePendingAlert(false)}
          secondCheckTitle={`${i18n.t(
            "connections.tab.detelepending.secondchecktitle"
          )}`}
          onDeletePendingItem={deleteConnection}
        />
      </>
    );
  }
);

export { Connections };
