import {
  IonButton,
  IonGrid,
  IonIcon,
  IonRow,
  useIonViewWillEnter,
} from "@ionic/react";
import {
  linkOutline,
  peopleOutline,
  personCircleOutline,
  settingsOutline,
} from "ionicons/icons";
import { useEffect, useMemo, useState } from "react";
import { ConfigurationService } from "../../../core/configuration";
import { OptionalFeature } from "../../../core/configuration/configurationService.types";
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
      case SubMenuKey.Connections: {
        dispatch(showConnections(true));
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
      itemKey: SubMenuKey.Connections,
      icon: peopleOutline,
      label: `${i18n.t("tabs.menu.tab.items.connections.title")}`,
    },
    {
      itemKey: SubMenuKey.ConnectWallet,
      icon: linkOutline,
      label: `${i18n.t("tabs.menu.tab.items.connectwallet.title")}`,
      subLabel: `${i18n.t("tabs.menu.tab.items.connectwallet.sublabel")}`,
      hidden: ConfigurationService.env.features.cut.includes(
        OptionalFeature.ConnectWallet
      ),
    },
  ];

  useEffect(() => {
    if (showWalletConnect) {
      showSelectedOption(SubMenuKey.ConnectWallet);
      dispatch(showConnectWallet(false));
    }
  }, [dispatch, showWalletConnect]);

  const showSelectedOption = (key: SubMenuKey) => {
    if ([SubMenuKey.Connections].includes(key)) {
      handleOpenUrl(key);
    }
    if (!subMenuItems.has(key)) return;
    setShowSubMenu(true);
    setSelectedOption(key);
  };

  const closeSetting = () => setShowSubMenu(false);
  const subMenuItems = SubMenuItems(showSelectedOption, closeSetting);

  const selectSubmenu =
    selectedOption !== undefined
      ? subMenuItems.get(selectedOption) || emptySubMenu
      : emptySubMenu;

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
            {menuItems
              .filter((item) => !item.hidden)
              .map((menuItem) => (
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
