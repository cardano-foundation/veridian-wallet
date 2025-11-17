import { useCallback, useState } from "react";
import { personAdd, refresh } from "ionicons/icons";
import { i18n } from "../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { getCurrentProfile } from "../../../store/reducers/profileCache";
import { Avatar } from "../../components/Avatar";
import { TabLayout } from "../../components/layout/TabLayout";
import { Profiles } from "../Profiles";
import { Tile } from "../../components/Tile";
import ScanIcon from "../../assets/images/scan-icon.svg";
import CardanoLogo from "../../assets/images/cardano-logo.svg";
import "./Home.scss";
import { ScanToLogin } from "./components/ScanToLogin";
import { ConnectdApp } from "../../components/ConnectdApp";
import { RotateKeyModal } from "../../components/ProfileDetailsModal/components/RotateKeyModal";
import { Agent } from "../../../core/agent/agent";
import { IdentifierDetails } from "../../../core/agent/services/identifier.types";
import { showError } from "../../utils/error";
import { ShareProfile } from "../../components/ShareProfile";
import { useOnlineStatusEffect } from "../../hooks";

const Home = () => {
  const pageId = "home-tab";
  const dispatch = useAppDispatch();
  const currentProfile = useAppSelector(getCurrentProfile);
  const [profile, setProfile] = useState<IdentifierDetails | undefined>();
  const [openProfiles, setOpenProfiles] = useState(false);
  const [openScanToLogin, setOpenScanToLogin] = useState(false);
  const [connectdApp, setConnectdApp] = useState(false);
  const [openShareCurrentProfile, setOpenShareCurrentProfile] = useState(false);
  const [oobi, setOobi] = useState("");
  const [openRotateKeyModal, setOpenRotateKeyModal] = useState(false);

  const handleAvatarClick = () => {
    setOpenProfiles(true);
  };

  const handleScanToLoginClick = () => {
    setOpenScanToLogin(true);
  };

  const handleShowDappClick = () => {
    setConnectdApp(true);
  };

  const handleShareCurrentProfileClick = () => {
    setOpenShareCurrentProfile(true);
  };

  const handleRotateKeyClick = () => {
    setOpenRotateKeyModal(true);
  };

  const AdditionalButtons = () => {
    return (
      <Avatar
        id={currentProfile?.identity.id || ""}
        handleAvatarClick={handleAvatarClick}
      />
    );
  };

  const fetchOobi = useCallback(async () => {
    try {
      if (!currentProfile?.identity.id) return;

      const oobiValue = await Agent.agent.connections.getOobi(
        `${currentProfile.identity.id}`,
        { alias: currentProfile?.identity.displayName || "" }
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

  const getDetails = useCallback(async () => {
    if (!currentProfile) return;

    try {
      const cardDetailsResult = await Agent.agent.identifiers.getIdentifier(
        currentProfile.identity.id
      );
      setProfile(cardDetailsResult);
    } catch (error) {
      showError("Unable to get identifier details", error);
    }
  }, [currentProfile]);

  return (
    <>
      <TabLayout
        pageId={pageId}
        header={true}
        title={`${i18n.t("tabs.home.tab.title", {
          name: currentProfile?.identity.displayName || "",
        })}`}
        additionalButtons={<AdditionalButtons />}
      >
        <div className="home-tab-content">
          <Tile
            icon={ScanIcon}
            badge={`${i18n.t("tabs.home.tab.tiles.scan.badge")}`}
            title={i18n.t("tabs.home.tab.tiles.scan.title")}
            text={i18n.t("tabs.home.tab.tiles.scan.text")}
            className="home-tab-scan-tile"
            handleTileClick={handleScanToLoginClick}
          />
          <Tile
            icon={CardanoLogo}
            chevron={true}
            title={i18n.t("tabs.home.tab.tiles.dapps.title")}
            text={i18n.t("tabs.home.tab.tiles.dapps.text")}
            handleTileClick={handleShowDappClick}
          />
          <div className="home-tab-split-section">
            <Tile
              icon={personAdd}
              chevron={true}
              title={i18n.t("tabs.home.tab.tiles.connections.title")}
              text={i18n.t("tabs.home.tab.tiles.connections.text")}
              handleTileClick={handleShareCurrentProfileClick}
            />
            <Tile
              icon={refresh}
              chevron={true}
              title={i18n.t("tabs.home.tab.tiles.rotate.title")}
              text={i18n.t("tabs.home.tab.tiles.rotate.text")}
              handleTileClick={handleRotateKeyClick}
            />
          </div>
        </div>
      </TabLayout>
      <Profiles
        isOpen={openProfiles}
        setIsOpen={setOpenProfiles}
      />
      <ScanToLogin
        isOpen={openScanToLogin}
        setIsOpen={setOpenScanToLogin}
      />
      <ConnectdApp
        isOpen={connectdApp}
        setIsOpen={setConnectdApp}
      />
      <ShareProfile
        isOpen={openShareCurrentProfile}
        setIsOpen={setOpenShareCurrentProfile}
        oobi={oobi}
      />
      <RotateKeyModal
        identifierId={currentProfile?.identity.id || ""}
        onReloadData={getDetails}
        signingKey={profile?.k[0] || ""}
        isOpen={openRotateKeyModal}
        onClose={() => setOpenRotateKeyModal(false)}
      />
    </>
  );
};
export { Home };
