import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from "@ionic/react";
import {
  apps,
  appsOutline,
  fingerPrint,
  fingerPrintOutline,
  idCard,
  idCardOutline,
  notifications,
  notificationsOutline,
  scan,
  scanOutline,
} from "ionicons/icons";
import { ComponentType } from "react";
import { Redirect, Route } from "react-router";
import { useLocation } from "react-router-dom";
import { i18n } from "../../../../i18n";
import { TabsRoutePath } from "../../../../routes/paths";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { getNotificationsCache } from "../../../../store/reducers/notificationsCache";
import { setCurrentRoute } from "../../../../store/reducers/stateCache";
import { Credentials } from "../../../pages/Credentials";
import { Identifiers } from "../../../pages/Identifiers";
import { Menu } from "../../../pages/Menu";
import { Notifications } from "../../../pages/Notifications";
import { Scan } from "../../../pages/Scan";
import "./TabsMenu.scss";

const tabsRoutes = [
  {
    label: i18n.t("tabsmenu.label.identifiers"),
    path: TabsRoutePath.IDENTIFIERS,
    component: Identifiers,
    icon: [fingerPrint, fingerPrintOutline],
  },
  {
    label: i18n.t("tabsmenu.label.creds"),
    path: TabsRoutePath.CREDENTIALS,
    component: Credentials,
    icon: [idCard, idCardOutline],
  },
  {
    label: i18n.t("tabsmenu.label.scan"),
    path: TabsRoutePath.SCAN,
    component: Scan,
    icon: [scan, scanOutline],
  },
  {
    label: i18n.t("tabsmenu.label.notifications"),
    path: TabsRoutePath.NOTIFICATIONS,
    component: Notifications,
    icon: [notifications, notificationsOutline],
  },
  {
    label: i18n.t("tabsmenu.label.menu"),
    path: TabsRoutePath.MENU,
    component: Menu,
    icon: [apps, appsOutline],
  },
];
const TabsMenu = ({ tab, path }: { tab: ComponentType; path: string }) => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(getNotificationsCache);
  const notificationsCounter = notifications.filter(
    (notification) => !notification.read
  ).length;

  const handleTabClick = (tabPath: string) => {
    dispatch(setCurrentRoute({ path: tabPath }));
  };

  return (
    <IonTabs>
      <IonRouterOutlet animated={false}>
        <Redirect
          exact
          from={TabsRoutePath.ROOT}
          to={TabsRoutePath.CREDENTIALS}
        />
        <Route
          path={path}
          component={tab}
          exact={true}
        />
      </IonRouterOutlet>

      <IonTabBar
        slot="bottom"
        data-testid="tabs-menu"
      >
        {tabsRoutes.map((tab, index: number) => {
          return (
            <IonTabButton
              key={`${tab.label}-${index}`}
              tab={tab.label}
              href={tab.path}
              data-testid={
                "tab-button-" + tab.label.toLowerCase().replace(/\s/g, "-")
              }
              className={
                "tab-button-" + tab.label.toLowerCase().replace(/\s/g, "-")
              }
              onClick={() => {
                handleTabClick(tab.path);
              }}
            >
              <div className="border-top" />
              <div className="icon-container">
                {!!notificationsCounter && (
                  <span className="notifications-counter">
                    {notificationsCounter > 99 ? "99+" : notificationsCounter}
                  </span>
                )}
                <IonIcon
                  icon={
                    tab.path === location.pathname ? tab.icon[0] : tab.icon[1]
                  }
                />
              </div>
              <IonLabel>{tab.label}</IonLabel>
            </IonTabButton>
          );
        })}
      </IonTabBar>
    </IonTabs>
  );
};

export { TabsMenu, TabsRoutePath, tabsRoutes };
