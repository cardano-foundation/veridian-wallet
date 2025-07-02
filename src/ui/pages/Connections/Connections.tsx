import { IonButton, IonIcon } from "@ionic/react";
import { useCallback, useEffect, useState } from "react";
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
  removeConnectionCache,
  setOpenConnectionId,
} from "../../../store/reducers/connectionsCache";
import { getIdentifiersCache } from "../../../store/reducers/identifiersCache";
import {
  getAuthentication,
  getStateCache,
  setCurrentOperation,
  setToastMsg,
} from "../../../store/reducers/stateCache";
import ScanIconWhite from "../../assets/images/scan-icon-white.svg";
import ScanIcon from "../../assets/images/scan-icon.svg";
import { Alert } from "../../components/Alert";
import { Avatar } from "../../components/Avatar";
import { CardsPlaceholder } from "../../components/CardsPlaceholder";
import { CreateIdentifier } from "../../components/CreateIdentifier";
import { IdentifierSelectorModal } from "../../components/IdentifierSelectorModal";
import { TabLayout } from "../../components/layout/TabLayout";
import { RemovePendingAlert } from "../../components/RemovePendingAlert";
import { ShareConnection } from "../../components/ShareConnection";
import { ShareType } from "../../components/ShareConnection/ShareConnection.types";
import { OperationType, RequestType, ToastMsgType } from "../../globals/types";
import { useOnlineStatusEffect } from "../../hooks";
import { showError } from "../../utils/error";
import { combineClassNames } from "../../utils/style";
import { ConnectionDetails } from "../ConnectionDetails";
import { ConnectionsBody } from "./components/ConnectionsBody";
import { ConnectionsOptionModal } from "./components/ConnectionsOptionModal";
import { SearchInput } from "./components/SearchInput";
import "./Connections.scss";
import { MappedConnections } from "./Connections.types";

const Connections = () => {
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
  const auth = useAppSelector(getAuthentication);

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
  }, [connectionsCache, dispatch, openDetailId]);

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

  const getConnectionShortDetails = async (connectionId: string) => {
    const shortDetails =
      await Agent.agent.connections.getConnectionShortDetailById(connectionId);
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

  const deletePendingCheckProps = {
    title: i18n.t("tabs.connections.tab.deletepending.title"),
    description: i18n.t("tabs.connections.tab.deletepending.description"),
    button: i18n.t("tabs.connections.tab.deletepending.button"),
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

  const AdditionalButtons = () => {
    return (
      <>
        <IonButton
          shape="round"
          className="add-button"
          data-testid="add-connection-button"
          onClick={handleConnectModal}
        >
          <IonIcon
            slot="icon-only"
            icon={ScanIcon}
            color="primary"
          />
        </IonButton>
        <Avatar
          id={auth.defaultProfile}
          handleAvatarClick={handleAvatarClick}
        />
      </>
    );
  };

  const handleAvatarClick = () => {
    // TODO: Add Handle avatar click once this page will be refactored.
    //history.push(RoutePath.PROFILES);
  };

  const classes = combineClassNames({
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
      <TabLayout
        pageId={pageId}
        customClass={classes}
        title={`${i18n.t("tabs.connections.tab.title")}`}
        additionalButtons={<AdditionalButtons />}
        header
        headerCustomContent={
          !showPlaceholder && (
            <div className="search-input-row">
              <SearchInput
                onInputChange={setSearch}
                value={search}
                onFocus={setHideHeader}
              />
            </div>
          )
        }
        placeholder={
          showPlaceholder && (
            <CardsPlaceholder
              buttonLabel={`${i18n.t("tabs.connections.tab.create")}`}
              buttonAction={handleConnectModal}
              testId={pageId}
              buttonIcon={ScanIconWhite}
            >
              <span className="placeholder-spacer" />
            </CardsPlaceholder>
          )
        }
      >
        <ConnectionsBody
          onSearchFocus={setHideHeader}
          mappedConnections={mappedConnections}
          handleShowConnectionDetails={handleShowConnectionDetails}
          search={search}
          setSearch={setSearch}
        />
      </TabLayout>
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
        headerText={i18n.t("tabs.connections.tab.alert.message")}
        confirmButtonText={`${i18n.t("tabs.connections.tab.alert.confirm")}`}
        cancelButtonText={`${i18n.t("tabs.connections.tab.alert.cancel")}`}
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
          "tabs.connections.tab.deletepending.secondchecktitle"
        )}`}
        onDeletePendingItem={deleteConnection}
      />
    </>
  );
};

export { Connections };
