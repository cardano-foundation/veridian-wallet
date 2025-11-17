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

const Home = () => {
  const pageId = "home-tab";
  const currentProfile = useAppSelector(getCurrentProfile);
  const [openProfiles, setOpenProfiles] = useState(false);

  const handleAvatarClick = () => {
    setOpenProfiles(true);
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
            className="home-tab-scan-tile"
            title="Scan to login"
            text="Sign in to apps, games, social media, banking, and other services"
          />
          <Tile
            icon={CardanoLogo}
            title="Cardano Connect"
            text="Use your Veridian wallet to access Cardano applications online"
          />
          <div className="home-tab-split-section">
            <Tile
              icon={personAdd}
              title="Add connection"
              text="Establish a new connection"
            />
            <Tile
              icon={refresh}
              title="Rotate key"
              text="Boost security by rotating your key"
            />
          </div>
        </div>
      </TabLayout>
      <Profiles
        isOpen={openProfiles}
        setIsOpen={setOpenProfiles}
      />
    </>
  );
};
export { Home };
