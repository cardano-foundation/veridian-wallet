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
import { ComponentType, useEffect } from "react";
import { Redirect, Route } from "react-router";
import { useHistory, useLocation } from "react-router-dom";
import { getCurrentRoute , setCurrentRoute } from "../../../../store/reducers/stateCache";
import { i18n } from "../../../../i18n";
import { TabsRoutePath } from "../../../../routes/paths";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { getNotificationsCache } from "../../../../store/reducers/profileCache";
import { Connections } from "../../../pages/Connections";
import { Credentials } from "../../../pages/Credentials";
import { Notifications } from "../../../pages/Notifications";
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
  const history = useHistory();
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(getNotificationsCache);
  const currentRoute = useAppSelector(getCurrentRoute);
  const notificationsCounter = notifications.filter(
    (notification) => !notification.read
  ).length;

  const handleTabClick = (tabPath: string) => {
    dispatch(setCurrentRoute({ path: tabPath }));
  };

  // Listen to Redux state changes for navigation (used by notifications)
  useEffect(() => {
    if (currentRoute && currentRoute.path !== location.pathname) {
      history.push(currentRoute.path);
    }
  }, [currentRoute, location.pathname, history]);

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
