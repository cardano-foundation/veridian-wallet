import { useState } from "react";
import { i18n } from "../../../i18n";
import { useAppSelector } from "../../../store/hooks";
import { getCurrentProfile } from "../../../store/reducers/profileCache";
import { Avatar } from "../../components/Avatar";
import { TabLayout } from "../../components/layout/TabLayout";
import { Profiles } from "../Profiles";

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
        Home
      </TabLayout>
      <Profiles
        isOpen={openProfiles}
        setIsOpen={setOpenProfiles}
      />
    </>
  );
};
export { Home };
