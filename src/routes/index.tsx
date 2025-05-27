import { IonRouterOutlet } from "@ionic/react";
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
import { IdentifierDetails } from "../ui/pages/IdentifierDetails";
import { NotificationDetails } from "../ui/pages/NotificationDetails";
import { Onboarding } from "../ui/pages/Onboarding";
import { SetPasscode } from "../ui/pages/SetPasscode";
import { SetupBiometrics } from "../ui/pages/SetupBiometrics/SetupBiometrics";
import { VerifyRecoverySeedPhrase } from "../ui/pages/VerifyRecoverySeedPhrase";
import { VerifySeedPhrase } from "../ui/pages/VerifySeedPhrase";
import { getNextRoute } from "./nextRoute";
import { RoutePath, TabsRoutePath } from "./paths";

const Routes = () => {
  const stateCache = useAppSelector(getStateCache);
  const dispatch = useAppDispatch();
  const routes = useAppSelector(getRoutes);

  const { nextPath } = getNextRoute(RoutePath.ROOT, {
    store: { stateCache },
  });

  useEffect(() => {
    if (!routes.length) dispatch(setCurrentRoute({ path: nextPath.pathname }));
  }, [routes, nextPath.pathname, dispatch]);

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
        path={TabsRoutePath.IDENTIFIER_DETAILS}
        component={IdentifierDetails}
        exact
      />
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
      <Redirect
        exact
        from="/"
        to={nextPath}
      />
    </IonRouterOutlet>
  );
};

export { RoutePath, Routes };
