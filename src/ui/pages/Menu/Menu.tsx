import { Browser } from "@capacitor/browser";
import {
  IonButton,
  IonGrid,
  IonIcon,
  IonRow,
  useIonViewWillEnter,
} from "@ionic/react";
import {
  chatbubbleOutline,
  linkOutline,
  peopleOutline,
  personCircleOutline,
  settingsOutline,
  walletOutline,
} from "ionicons/icons";
import { useEffect, useMemo, useState } from "react";
import { i18n } from "../../../i18n";
import { TabsRoutePath } from "../../../routes/paths";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  setCurrentRoute,
  showConnections,
} from "../../../store/reducers/stateCache";
import {
  getShowConnectWallet,
  showConnectWallet,
} from "../../../store/reducers/walletConnectionsCache";
import { TabLayout } from "../../components/layout/TabLayout";
import { CHAT_LINK, CRYPTO_LINK } from "../../globals/constants";
import MenuItem from "./components/MenuItem";
import { SubMenu } from "./components/SubMenu";
import { emptySubMenu, SubMenuItems } from "./components/SubMenuItems";
import "./Menu.scss";
import { MenuItemProps, SubMenuKey } from "./Menu.types";

const Menu = () => {
  const pageId = "menu-tab";
  const dispatch = useAppDispatch();
  const showWalletConnect = useAppSelector(getShowConnectWallet);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [selectedOption, setSelectedOption] = useState<
    SubMenuKey | undefined
  >();

  useIonViewWillEnter(() => {
    dispatch(setCurrentRoute({ path: TabsRoutePath.MENU }));
  });

  const backHardwareConfig = useMemo(
    () => ({
      prevent: !showSubMenu,
    }),
    [showSubMenu]
  );

  const handleOpenUrl = (key: SubMenuKey) => {
    switch (key) {
    case SubMenuKey.Crypto: {
      Browser.open({ url: CRYPTO_LINK });
      break;
    }
    case SubMenuKey.Connections: {
      dispatch(showConnections(true));
      break;
    }
    case SubMenuKey.Chat: {
      Browser.open({ url: CHAT_LINK });
      break;
    }
    default:
      return;
    }
  };

  const menuItems: Omit<MenuItemProps, "onClick">[] = [
    {
      itemKey: SubMenuKey.Profile,
      icon: personCircleOutline,
      label: `${i18n.t("tabs.menu.tab.items.profile.title")}`,
    },
    {
      itemKey: SubMenuKey.Crypto,
      icon: walletOutline,
      label: `${i18n.t("tabs.menu.tab.items.crypto.title")}`,
      subLabel: `${i18n.t("tabs.menu.tab.items.crypto.sublabel")}`,
    },
    {
      itemKey: SubMenuKey.Connections,
      icon: peopleOutline,
      label: `${i18n.t("tabs.menu.tab.items.connections.title")}`,
    },
    {
      itemKey: SubMenuKey.ConnectWallet,
      icon: linkOutline,
      label: `${i18n.t("tabs.menu.tab.items.connectwallet.title")}`,
      subLabel: `${i18n.t("tabs.menu.tab.items.connectwallet.sublabel")}`,
    },
    {
      itemKey: SubMenuKey.Chat,
      icon: chatbubbleOutline,
      label: `${i18n.t("tabs.menu.tab.items.chat.title")}`,
      subLabel: `${i18n.t("tabs.menu.tab.items.chat.sublabel")}`,
    },
  ];

  useEffect(() => {
    if (showWalletConnect) {
      showSelectedOption(SubMenuKey.ConnectWallet);
      dispatch(showConnectWallet(false));
    }
  }, [dispatch, showWalletConnect]);

  const showSelectedOption = (key: SubMenuKey) => {
    if (
      [SubMenuKey.Crypto, SubMenuKey.Connections, SubMenuKey.Chat].includes(key)
    ) {
      handleOpenUrl(key);
    }
    if (!subMenuItems.has(key)) return;
    setShowSubMenu(true);
    setSelectedOption(key);
  };

  const subMenuItems = SubMenuItems(showSelectedOption);

  const selectSubmenu = useMemo(() => {
    // NOTE: emptySubMenu is returned for unavailable selected options to not break the animation
    // by keeping the SubMenu component in the DOM
    return selectedOption !== undefined
      ? subMenuItems.get(selectedOption) || emptySubMenu
      : emptySubMenu;
  }, [selectedOption, subMenuItems]);

  const AdditionalButtons = () => {
    return (
      <IonButton
        shape="round"
        className="settings-button"
        data-testid="settings-button"
        onClick={() => showSelectedOption(SubMenuKey.Settings)}
      >
        <IonIcon
          slot="icon-only"
          icon={settingsOutline}
          color="primary"
        />
      </IonButton>
    );
  };

  return (
    <>
      <TabLayout
        pageId={pageId}
        hardwareBackButtonConfig={backHardwareConfig}
        header={true}
        title={`${i18n.t("tabs.menu.tab.header")}`}
        additionalButtons={<AdditionalButtons />}
      >
        <IonGrid>
          <IonRow>
            {menuItems.map((menuItem) => (
              <MenuItem
                key={menuItem.itemKey}
                itemKey={menuItem.itemKey}
                icon={menuItem.icon}
                label={`${i18n.t(menuItem.label)}`}
                subLabel={menuItem.subLabel}
                onClick={() => showSelectedOption(menuItem.itemKey)}
              />
            ))}
          </IonRow>
        </IonGrid>
      </TabLayout>
      <SubMenu
        showSubMenu={showSubMenu}
        setShowSubMenu={setShowSubMenu}
        nestedMenu={selectSubmenu.nestedMenu}
        closeButtonLabel={selectSubmenu.closeButtonLabel}
        closeButtonAction={selectSubmenu.closeButtonAction}
        title={`${i18n.t(selectSubmenu.title)}`}
        additionalButtons={selectSubmenu.additionalButtons}
        actionButton={selectSubmenu.actionButton}
        actionButtonAction={selectSubmenu.actionButtonAction}
        actionButtonLabel={selectSubmenu.actionButtonLabel}
        pageId={selectSubmenu.pageId}
        switchView={showSelectedOption}
        renderAsModal={selectSubmenu.renderAsModal}
      >
        <selectSubmenu.Component />
      </SubMenu>
    </>
  );
};

export { Menu };
