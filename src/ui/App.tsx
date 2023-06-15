import { setupIonicReact, IonApp } from "@ionic/react";
import { Routes } from "../routes";
import "./styles/ionic.scss";
import "./style.scss";
import { AppWrapper } from "./components/AppWrapper";
import {Routes2} from "../routes/routes2";

setupIonicReact();

const App = () => {
  return (
    <IonApp>
      <AppWrapper>
        <Routes />
      </AppWrapper>
    </IonApp>
  );
};

export { App };
