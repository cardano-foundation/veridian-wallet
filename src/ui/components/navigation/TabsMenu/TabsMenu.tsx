import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from "@ionic/react";
import {
  idCard,
  idCardOutline,
  notifications,
  notificationsOutline,
  peopleCircle,
  peopleCircleOutline,
} from "ionicons/icons";
import { ComponentType } from "react";
import { Redirect, Route } from "react-router";
import { useLocation } from "react-router-dom";
import { i18n } from "../../../../i18n";
import { TabsRoutePath } from "../../../../routes/paths";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { BubbleCounter } from "../../BubbleCounter";
import { getNotificationsCache } from "../../../../store/reducers/profileCache";
import { setCurrentRoute } from "../../../../store/reducers/stateCache";
import { Connections } from "../../../pages/Connections";
import { Credentials } from "../../../pages/Credentials";
import { Notifications } from "../../../pages/Notifications";
import { ProfileStateModal } from "../../../pages/Credentials/components/ProfileStateModal";
import "./TabsMenu.scss";

const tabsRoutes = [
  {
    label: i18n.t("tabsmenu.label.creds"),
    path: TabsRoutePath.CREDENTIALS,
    component: Credentials,
    icon: [idCard, idCardOutline],
  },
  {
    label: i18n.t("tabsmenu.label.connections"),
    path: TabsRoutePath.CONNECTIONS,
    component: Connections,
    icon: [peopleCircle, peopleCircleOutline],
  },
  {
    label: i18n.t("tabsmenu.label.notifications"),
    path: TabsRoutePath.NOTIFICATIONS,
    component: Notifications,
    icon: [notifications, notificationsOutline],
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
                <IonIcon
                  icon={
                    tab.path === location.pathname ? tab.icon[0] : tab.icon[1]
                  }
                />
                {tab.label === i18n.t("tabsmenu.label.notifications") &&
                  tab.path !== location.pathname && (
                    <BubbleCounter counter={notificationsCounter} />
                  )}
              </div>
              <IonLabel>{tab.label}</IonLabel>
            </IonTabButton>
          );
        })}
      </IonTabBar>
      <ProfileStateModal />
    </IonTabs>
  );
};

export { TabsMenu, TabsRoutePath, tabsRoutes };
