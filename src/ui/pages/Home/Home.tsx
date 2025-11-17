import { useState } from "react";
import { personAdd, refresh } from "ionicons/icons";
import { i18n } from "../../../i18n";
import { useAppSelector } from "../../../store/hooks";
import { getCurrentProfile } from "../../../store/reducers/profileCache";
import { Avatar } from "../../components/Avatar";
import { TabLayout } from "../../components/layout/TabLayout";
import { Profiles } from "../Profiles";
import { Tile } from "../../components/Tile";
import ScanIcon from "../../assets/images/scan-icon.svg";
import CardanoLogo from "../../assets/images/cardano-logo.svg";
import "./Home.scss";
import { ScanToLogin } from "./components/ScanToLogin";

const Home = () => {
  const pageId = "home-tab";
  const currentProfile = useAppSelector(getCurrentProfile);
  const [openProfiles, setOpenProfiles] = useState(false);
  const [openScanToLogin, setOpenScanToLogin] = useState(false);

  const handleAvatarClick = () => {
    setOpenProfiles(true);
  };

  const handleScanToLoginClick = () => {
    setOpenScanToLogin(true);
  };

  const AdditionalButtons = () => {
    return (
      <Avatar
        id={currentProfile?.identity.id || ""}
        handleAvatarClick={handleAvatarClick}
      />
    );
  };

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
          />
          <div className="home-tab-split-section">
            <Tile
              icon={personAdd}
              chevron={true}
              title={i18n.t("tabs.home.tab.tiles.connections.title")}
              text={i18n.t("tabs.home.tab.tiles.connections.text")}
            />
            <Tile
              icon={refresh}
              chevron={true}
              title={i18n.t("tabs.home.tab.tiles.rotate.title")}
              text={i18n.t("tabs.home.tab.tiles.rotate.text")}
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
    </>
  );
};
export { Home };
