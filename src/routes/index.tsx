import { IonRouterOutlet, useIonRouter } from "@ionic/react";
import { useEffect } from "react";
import { Redirect, Route } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  getRoutes,
  getStateCache,
  setCurrentRoute,
} from "../store/reducers/stateCache";
import { TabsMenu, tabsRoutes } from "../ui/components/navigation/TabsMenu";
import { CreatePassword } from "../ui/pages/CreatePassword";
import { CreateSSIAgent } from "../ui/pages/CreateSSIAgent";
import { CredentialDetails } from "../ui/pages/CredentialDetails";
import { GenerateSeedPhrase } from "../ui/pages/GenerateSeedPhrase";
import { NotificationDetails } from "../ui/pages/NotificationDetails";
import { Onboarding } from "../ui/pages/Onboarding";
import { ProfileSetup } from "../ui/pages/ProfileSetup/ProfileSetup";
import { SetPasscode } from "../ui/pages/SetPasscode";
import { SetupBiometrics } from "../ui/pages/SetupBiometrics/SetupBiometrics";
import { SetupGroupProfile } from "../ui/pages/SetupGroupProfile";
import { VerifyRecoverySeedPhrase } from "../ui/pages/VerifyRecoverySeedPhrase";
import { VerifySeedPhrase } from "../ui/pages/VerifySeedPhrase";
import { getNextRoute } from "./nextRoute";
import { RoutePath, TabsRoutePath } from "./paths";
import { getCurrentProfile } from "../store/reducers/profileCache";

const Routes = () => {
  const stateCache = useAppSelector(getStateCache);
  const currentProfile = useAppSelector(getCurrentProfile);
  const dispatch = useAppDispatch();
  const routes = useAppSelector(getRoutes);
  const ionRouter = useIonRouter();

  const { nextPath } = getNextRoute(RoutePath.ROOT, {
    store: { stateCache, currentProfile },
  });

  useEffect(() => {
    if (!routes.length) dispatch(setCurrentRoute({ path: nextPath.pathname }));
  }, [routes, nextPath.pathname, dispatch]);

  useEffect(() => {
    const handleNotificationNavigation = (event: CustomEvent) => {
      const { path } = event.detail;
      ionRouter.push(path);
    };

    window.addEventListener(
      "notificationNavigation",
      handleNotificationNavigation as EventListener
    );

    return () => {
      window.removeEventListener(
        "notificationNavigation",
        handleNotificationNavigation as EventListener
      );
    };
  }, [ionRouter]);

  return (
    <IonRouterOutlet animated={false}>
      <Route
        path={RoutePath.SET_PASSCODE}
        component={SetPasscode}
        exact
      />
      <Route
        path={RoutePath.ONBOARDING}
        component={Onboarding}
        exact
      />
      <Route
        path={RoutePath.GENERATE_SEED_PHRASE}
        component={GenerateSeedPhrase}
        exact
      />
      <Route
        path={RoutePath.VERIFY_SEED_PHRASE}
        component={VerifySeedPhrase}
        exact
      />
      <Route
        path={RoutePath.TABS_MENU}
        component={TabsMenu}
        exact
      />
      <Route
        path={RoutePath.CREATE_PASSWORD}
        component={CreatePassword}
        exact
      />
      <Route
        path={RoutePath.VERIFY_RECOVERY_SEED_PHRASE}
        component={VerifyRecoverySeedPhrase}
        exact
      />
      <Route
        path={RoutePath.SSI_AGENT}
        component={CreateSSIAgent}
        exact
      />
      <Route
        path={RoutePath.GROUP_PROFILE_SETUP}
        component={SetupGroupProfile}
        exact
      />
      {tabsRoutes.map((tab, index: number) => {
        return (
          <Route
            key={index}
            path={tab.path}
            exact
            render={() => (
              <TabsMenu
                tab={tab.component}
                path={tab.path}
              />
            )}
          />
        );
      })}
      <Route
        path={RoutePath.SETUP_BIOMETRICS}
        component={SetupBiometrics}
        exact
      />
      <Route
        path={TabsRoutePath.CREDENTIAL_DETAILS}
        component={CredentialDetails}
        exact
      />
      <Route
        path={TabsRoutePath.NOTIFICATION_DETAILS}
        component={NotificationDetails}
        exact
      />
      <Route
        path={RoutePath.PROFILE_SETUP}
        component={ProfileSetup}
        exact
      />
      <Redirect
        exact
        from="/"
        to={nextPath}
      />
    </IonRouterOutlet>
  );
};

export { RoutePath, Routes };
