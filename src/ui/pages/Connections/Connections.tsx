import { IonButton, IonIcon, useIonViewWillEnter } from "@ionic/react";
import { useCallback, useEffect, useState } from "react";
import { Agent } from "../../../core/agent/agent";
import {
  ConnectionShortDetails,
  ConnectionStatus,
} from "../../../core/agent/agent.types";
import { i18n } from "../../../i18n";
import { TabsRoutePath } from "../../../routes/paths";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getConnectionsCache,
  getOpenConnectionId,
  removeConnectionCache,
  setOpenConnectionId,
} from "../../../store/reducers/connectionsCache";
import {
  setCurrentOperation,
  setCurrentRoute,
  setToastMsg,
} from "../../../store/reducers/stateCache";
import ScanIconWhite from "../../assets/images/scan-icon-white.svg";
import ScanIcon from "../../assets/images/scan-icon.svg";
import { Avatar } from "../../components/Avatar";
import { CardsPlaceholder } from "../../components/CardsPlaceholder";
import { TabLayout } from "../../components/layout/TabLayout";
import { RemovePendingAlert } from "../../components/RemovePendingAlert";
import { ShareProfile } from "../../components/ShareProfile";
import { OperationType, ToastMsgType } from "../../globals/types";
import { useOnlineStatusEffect } from "../../hooks";
import { showError } from "../../utils/error";
import { combineClassNames } from "../../utils/style";
import { ConnectionDetails } from "../ConnectionDetails";
import { Profiles } from "../Profiles";
import { ConnectionsBody } from "./components/ConnectionsBody";
import { SearchInput } from "./components/SearchInput";
import "./Connections.scss";
import { MappedConnections } from "./Connections.types";
import { getCurrentProfile } from "../../../store/reducers/profileCache";

const Connections = () => {
  const pageId = "connections-tab";
  const dispatch = useAppDispatch();
  const connectionsCache = useAppSelector(getConnectionsCache);
  const openDetailId = useAppSelector(getOpenConnectionId);
  const [connectionShortDetails, setConnectionShortDetails] = useState<
    ConnectionShortDetails | undefined
  >(undefined);
  const [mappedConnections, setMappedConnections] = useState<
    MappedConnections[]
  >([]);
  const [openShareCurrentProfile, setOpenShareCurrentProfile] = useState(false);
  const [openProfiles, setOpenProfiles] = useState(false);
  const [deletePendingItem, setDeletePendingItem] =
    useState<ConnectionShortDetails | null>(null);
  const [openDeletePendingAlert, setOpenDeletePendingAlert] = useState(false);
  const [oobi, setOobi] = useState("");
  const [hideHeader, setHideHeader] = useState(false);
  const [search, setSearch] = useState("");
  const currentProfile = useAppSelector(getCurrentProfile);

  const showPlaceholder = Object.keys(connectionsCache).length === 0;

  useIonViewWillEnter(() => {
    dispatch(setCurrentRoute({ path: TabsRoutePath.CONNECTIONS }));
  });

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
      if (!currentProfile?.identity.id) return;

      const oobiValue = await Agent.agent.connections.getOobi(
        `${currentProfile.identity.id}`,
        currentProfile?.identity.displayName || ""
      );
      if (oobiValue) {
        setOobi(oobiValue);
      }
    } catch (e) {
      showError("Unable to fetch connection oobi", e, dispatch);
    }
  }, [
    currentProfile?.identity.id,
    currentProfile?.identity.displayName,
    dispatch,
  ]);

  useOnlineStatusEffect(fetchOobi);

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

  const handleConnectModal = () => {
    setOpenShareCurrentProfile(true);
  };

  const handleAvatarClick = () => {
    setOpenProfiles(true);
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
          id={currentProfile?.identity.id || ""}
          handleAvatarClick={handleAvatarClick}
        />
      </>
    );
  };

  const classes = combineClassNames({
    "hide-header": hideHeader,
  });

  const handleCloseConnectionModal = () => {
    setConnectionShortDetails(undefined);
  };

  return connectionShortDetails ? (
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
            />
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
      <ShareProfile
        isOpen={openShareCurrentProfile}
        setIsOpen={setOpenShareCurrentProfile}
        oobi={oobi}
      />
      <Profiles
        isOpen={openProfiles}
        setIsOpen={setOpenProfiles}
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
