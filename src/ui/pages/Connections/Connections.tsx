import { IonButton, IonIcon } from "@ionic/react";
import { addOutline } from "ionicons/icons";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { Agent } from "../../../core/agent/agent";
import {
  ConnectionShortDetails,
  ConnectionStatus,
  CreationStatus,
} from "../../../core/agent/agent.types";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";
import { i18n } from "../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getConnectionsCache,
  getOpenConnectionId,
  setOpenConnectionId,
  removeConnectionCache,
} from "../../../store/reducers/connectionsCache";
import { getIdentifiersCache } from "../../../store/reducers/identifiersCache";
import {
  getStateCache,
  setCurrentOperation,
  setToastMsg,
  showConnections as updateShowConnections,
} from "../../../store/reducers/stateCache";
import { Alert } from "../../components/Alert";
import { CardsPlaceholder } from "../../components/CardsPlaceholder";
import { RemovePendingAlert } from "../../components/RemovePendingAlert";
import { ShareConnection } from "../../components/ShareConnection";
import { ShareType } from "../../components/ShareConnection/ShareConnection.types";
import { OperationType, RequestType, ToastMsgType } from "../../globals/types";
import { useOnlineStatusEffect } from "../../hooks";
import { useSwipeBack } from "../../hooks/swipeBackHook";
import { showError } from "../../utils/error";
import { ConnectionsBody } from "./components/ConnectionsBody";
import { ConnectionsOptionModal } from "./components/ConnectionsOptionModal";
import { IdentifierSelectorModal } from "../../components/IdentifierSelectorModal";
import "./Connections.scss";
import {
  ConnectionsComponentProps,
  ConnectionsOptionRef,
  MappedConnections,
} from "./Connections.types";
import { combineClassNames } from "../../utils/style";
import { ScrollablePageLayout } from "../../components/layout/ScrollablePageLayout";
import { PageHeader } from "../../components/PageHeader";
import { ConnectionDetails } from "../ConnectionDetails";
import { CreateIdentifier } from "../../components/CreateIdentifier";
import { SearchInput } from "./components/SearchInput";

const Connections = forwardRef<ConnectionsOptionRef, ConnectionsComponentProps>(
  ({ showConnections, setShowConnections }, ref) => {
    const pageId = "connections";
    const dispatch = useAppDispatch();
    const stateCache = useAppSelector(getStateCache);
    const connectionsCache = useAppSelector(getConnectionsCache);
    const identifierCache = useAppSelector(getIdentifiersCache);
    const openDetailId = useAppSelector(getOpenConnectionId);
    const [connectionShortDetails, setConnectionShortDetails] = useState<
      ConnectionShortDetails | undefined
    >(undefined);
    const availableIdentifiers = Object.values(identifierCache)
      .filter((item) => item.creationStatus === CreationStatus.COMPLETE)
      .filter((item) => !item.groupMetadata?.groupId);
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
    const [createIdentifierModalIsOpen, setCreateIdentifierModalIsOpen] =
      useState(false);
    const [deletePendingItem, setDeletePendingItem] =
      useState<ConnectionShortDetails | null>(null);
    const [openDeletePendingAlert, setOpenDeletePendingAlert] = useState(false);
    const userName = stateCache.authentication.userName;
    const [oobi, setOobi] = useState("");
    const [hideHeader, setHideHeader] = useState(false);
    const [openConnectionlModal, setOpenConnectionlModal] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
      setShowPlaceholder(Object.keys(connectionsCache).length === 0);
    }, [connectionsCache]);

    useEffect(() => {
      const fetchConnectionDetails = async () => {
        if (openDetailId === undefined) return;
        const connection = connectionsCache[openDetailId];
        dispatch(setOpenConnectionId(undefined));
        if (
          !connection ||
          connection.status === ConnectionStatus.PENDING ||
          connection.status === ConnectionStatus.FAILED
        ) {
          return;
        } else {
          await getConnectionShortDetails(openDetailId);
        }
      };

      fetchConnectionDetails();
    }, [openDetailId]);

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

    const getConnectionShortDetails = async (connectionId: string) => {
      const shortDetails =
        await Agent.agent.connections.getConnectionShortDetailById(
          connectionId
        );
      setConnectionShortDetails(shortDetails);
    };

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

    const handleCreateIdentifier = () => {
      setOpenIdentifierMissingAlert(false);
      setCreateIdentifierModalIsOpen(true);
    };

    const handleCloseCreateIdentifier = () => {
      setCreateIdentifierModalIsOpen(false);
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
      if (
        item.status === ConnectionStatus.PENDING ||
        item.status === ConnectionStatus.FAILED
      ) {
        setDeletePendingItem(item);
        setOpenDeletePendingAlert(true);
        return;
      }

      setConnectionShortDetails(item);
      setOpenConnectionlModal(true);
    };

    const getConnectionsTab = useCallback(() => {
      return document.getElementById(pageId);
    }, []);

    const canStart = useCallback(() => {
      return showConnections;
    }, [showConnections]);

    useSwipeBack(getConnectionsTab, canStart, () => setShowConnections(false));

    const deletePendingCheckProps = {
      title: i18n.t("connections.page.deletepending.title"),
      description: i18n.t("connections.page.deletepending.description"),
      button: i18n.t("connections.page.deletepending.button"),
    };

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

    const classes = combineClassNames({
      show: showConnections,
      hide: !showConnections,
      "hide-header": hideHeader,
    });

    const handleCloseConnectionModal = () => {
      setConnectionShortDetails(undefined);
      setOpenConnectionlModal(false);
    };

    return connectionShortDetails && openConnectionlModal ? (
      <ConnectionDetails
        connectionShortDetails={connectionShortDetails}
        handleCloseConnectionModal={handleCloseConnectionModal}
      />
    ) : (
      <>
        <ScrollablePageLayout
          pageId={pageId}
          activeStatus={true}
          customClass={classes}
          header={
            <div className="connections-header-area">
              <PageHeader
                hardwareBackButtonConfig={backHardwareConfig}
                backButton={true}
                onBack={handleDone}
                title={`${i18n.t("connections.page.title")}`}
                additionalButtons={<AdditionalButtons />}
              />
              {!showPlaceholder && (
                <div className="search-input-row">
                  <SearchInput
                    onInputChange={setSearch}
                    value={search}
                    onFocus={setHideHeader}
                  />
                </div>
              )}
            </div>
          }
        >
          {showPlaceholder ? (
            <CardsPlaceholder
              buttonLabel={`${i18n.t("connections.page.create")}`}
              buttonAction={handleConnectModal}
              testId={pageId}
            >
              <span className="placeholder-spacer" />
            </CardsPlaceholder>
          ) : (
            <ConnectionsBody
              onSearchFocus={setHideHeader}
              mappedConnections={mappedConnections}
              handleShowConnectionDetails={handleShowConnectionDetails}
              search={search}
              setSearch={setSearch}
            />
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
        <CreateIdentifier
          modalIsOpen={createIdentifierModalIsOpen}
          setModalIsOpen={handleCloseCreateIdentifier}
        />
        <Alert
          isOpen={openIdentifierMissingAlert}
          setIsOpen={setOpenIdentifierMissingAlert}
          dataTestId="alert-create-keri"
          headerText={i18n.t("connections.page.alert.message")}
          confirmButtonText={`${i18n.t("connections.page.alert.confirm")}`}
          cancelButtonText={`${i18n.t("connections.page.alert.cancel")}`}
          actionConfirm={handleCreateIdentifier}
          actionCancel={handleCloseAlert}
          actionDismiss={handleCloseAlert}
        />
        <RemovePendingAlert
          pageId={pageId}
          openFirstCheck={openDeletePendingAlert}
          firstCheckProps={deletePendingCheckProps}
          onClose={() => setOpenDeletePendingAlert(false)}
          secondCheckTitle={`${i18n.t(
            "connections.page.deletepending.secondchecktitle"
          )}`}
          onDeletePendingItem={deleteConnection}
        />
      </>
    );
  }
);

export { Connections };
