import { IonButton, IonIcon } from "@ionic/react";
import { addOutline } from "ionicons/icons";
import { useMemo, useRef, useState } from "react";
import { i18n } from "../../../../i18n";
import { SubMenuData, SubMenuKey } from "../Menu.types";
import { ConnectWallet, ConnectWalletOptionRef } from "./ConnectWallet";
import { Profile } from "./Profile";
import { ProfileOptionRef } from "./Profile/Profile.types";

const emptySubMenu = {
  Component: () => <></>,
  title: "",
  closeButtonLabel: undefined,
  closeButtonAction: undefined,
  additionalButtons: <></>,
  actionButton: false,
  actionButtonAction: undefined,
  actionButtonLabel: undefined,
  pageId: "empty",
  nestedMenu: false,
  renderAsModal: false,
};

const SubMenuItems = () => {
  const profileRef = useRef<ProfileOptionRef>(null);
  const connectWalletRef = useRef<ConnectWalletOptionRef>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const toggleEditProfile = () => {
    setIsEditingProfile((prev) => {
      const newState = !prev;
      return newState;
    });
  };

  const saveChanges = () => {
    profileRef.current?.saveChanges();
    toggleEditProfile();
  };

  const menuMapData: [SubMenuKey, SubMenuData][] = [
    [
      SubMenuKey.Profile,
      {
        Component: () => (
          <Profile
            ref={profileRef}
            isEditing={isEditingProfile}
          />
        ),
        closeButtonLabel: isEditingProfile
          ? `${i18n.t("tabs.menu.tab.items.profile.actioncancel")}`
          : undefined,
        closeButtonAction: isEditingProfile ? toggleEditProfile : undefined,
        title: isEditingProfile
          ? "tabs.menu.tab.items.profile.tabedit"
          : "tabs.menu.tab.items.profile.tabheader",
        pageId: isEditingProfile ? "edit-profile" : "view-profile",
        additionalButtons: <></>,
        nestedMenu: false,
        actionButton: true,
        actionButtonAction: isEditingProfile ? saveChanges : toggleEditProfile,
        actionButtonLabel: isEditingProfile
          ? `${i18n.t("tabs.menu.tab.items.profile.actionconfirm")}`
          : `${i18n.t("tabs.menu.tab.items.profile.actionedit")}`,
        renderAsModal: false,
      },
    ],
    [
      SubMenuKey.ConnectWallet,
      {
        Component: () => <ConnectWallet ref={connectWalletRef} />,
        title: "tabs.menu.tab.items.connectwallet.tabheader",
        pageId: "connect-wallet",
        nestedMenu: false,
        additionalButtons: (
          <IonButton
            shape="round"
            className="connect-wallet-button"
            data-testid="menu-add-connection-button"
            onClick={() => connectWalletRef.current?.openConnectWallet()}
          >
            <IonIcon
              slot="icon-only"
              icon={addOutline}
              color="primary"
            />
          </IonButton>
        ),
        renderAsModal: false,
      },
    ],
  ];

  const subMenuMapData: [SubMenuKey, SubMenuData][] = [...menuMapData];

  return useMemo(() => new Map(subMenuMapData), [isEditingProfile]);
};

export { emptySubMenu, SubMenuItems };
