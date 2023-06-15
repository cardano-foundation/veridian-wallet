import React, { useEffect, useState } from "react";
import { IonReactRouter } from "@ionic/react-router";
import { IonRouterOutlet } from "@ionic/react";
import { Redirect, Route, RouteProps, useLocation } from "react-router-dom";
import { Onboarding } from "../ui/pages/Onboarding";
import { GenerateSeedPhrase } from "../ui/pages/GenerateSeedPhrase";
import { SetPasscode } from "../ui/pages/SetPasscode";
import { PasscodeLogin } from "../ui/pages/PasscodeLogin";
import { VerifySeedPhrase } from "../ui/pages/VerifySeedPhrase";
import { CreatePassword } from "../ui/pages/CreatePassword";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  getAuthentication,
  getRoutes,
  getState,
  setCurrentRoute,
} from "../store/reducers/stateCache";
import { getNextRoute } from "./nextRoute";
import {TabsMenu, TabsRoutePath} from "../ui/components/navigation/TabsMenu";
import { RoutePath } from "./paths";
import {CardDetails} from "../ui/pages/CardDetails";
import {Dids} from "../ui/pages/Dids";
import {Creds} from "../ui/pages/Creds";
import {Scan} from "../ui/pages/Scan";
import {Crypto} from "../ui/pages/Crypto";
import {Chat} from "../ui/pages/Chat";
const AuthenticatedRoute: React.FC<RouteProps> = (props) => {
  const authentication = useAppSelector(getAuthentication);
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    authentication.loggedIn
  );

  useEffect(() => {
    setIsAuthenticated(authentication.loggedIn);
  }, [authentication.loggedIn]);

  return isAuthenticated ? (
    <Route
      {...props}
      component={props.component}
    />
  ) : (
    <Redirect
      from={location.pathname}
      to={{
        pathname: authentication.passcodeIsSet
          ? RoutePath.PASSCODE_LOGIN
          : RoutePath.ONBOARDING,
      }}
    />
  );
};

const Routes = () => {
  const storeState = useAppSelector(getState);
  const dispatch = useAppDispatch();
  const routes = useAppSelector(getRoutes);
  const { nextPath } = getNextRoute(RoutePath.ROOT, {
    store: storeState,
  });

  useEffect(() => {
    if (!routes.length) dispatch(setCurrentRoute({ path: nextPath.pathname }));
  });

  return (
    <IonReactRouter>
      <IonRouterOutlet animated={false}>
        <Route
          path={RoutePath.PASSCODE_LOGIN}
          component={PasscodeLogin}
          exact
        />

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

        {/* Private Routes */}
        <AuthenticatedRoute
          path={RoutePath.GENERATE_SEED_PHRASE}
          component={GenerateSeedPhrase}
        />
        <AuthenticatedRoute
          path={RoutePath.VERIFY_SEED_PHRASE}
          exact
          component={VerifySeedPhrase}
        />
        <AuthenticatedRoute
          path={RoutePath.TABS_MENU}
          exact
          component={TabsMenu}
        />
        <AuthenticatedRoute
          path={RoutePath.CREATE_PASSWORD}
          exact
          component={CreatePassword}
        />
        <AuthenticatedRoute
          path={TabsRoutePath.DIDS}
          exact
          render={() => <TabsMenu tab={Dids} path={TabsRoutePath.DIDS}/>}
        />
        <AuthenticatedRoute
          path={TabsRoutePath.CREDS}
          exact
          render={() => <TabsMenu tab={Creds} path={TabsRoutePath.CREDS}/>}
        />
        <AuthenticatedRoute
          path={TabsRoutePath.SCAN}
          exact
          render={() => <TabsMenu tab={Scan} path={TabsRoutePath.SCAN}/>}
        />
        <AuthenticatedRoute
          path={TabsRoutePath.CRYPTO}
          exact
          render={() => <TabsMenu tab={Crypto} path={TabsRoutePath.CRYPTO}/>}
        />
        <AuthenticatedRoute
          path={TabsRoutePath.CHAT}
          exact
          render={() => <TabsMenu tab={Chat} path={TabsRoutePath.CHAT}/>}
        />

        <AuthenticatedRoute
          path="/tabs/dids/:id"
          component={CardDetails}
          exact
        />
        <AuthenticatedRoute
          path="/tabs/creds/:id"
          component={CardDetails}
          exact
        />


        <Redirect
          exact
          from="/"
          to={nextPath}
        />

      </IonRouterOutlet>
    </IonReactRouter>
  );
};

export { Routes, RoutePath };
