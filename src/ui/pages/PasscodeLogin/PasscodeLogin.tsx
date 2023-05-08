import { useEffect, useState } from "react";
import { IonButton, IonCol, IonGrid, IonRow } from "@ionic/react";
import {useHistory, useLocation} from "react-router-dom";
import { Argon2VerifyOptions, verify } from "argon2-browser";
import { i18n } from "../../../i18n";
import { PageLayout } from "../../components/layout/PageLayout";
import { ErrorMessage } from "../../components/ErrorMessage";
import {
  GENERATE_SEED_PHRASE_ROUTE,
  ONBOARDING_ROUTE,
  ROUTES,
  SET_PASSCODE_ROUTE,
} from "../../../routes";
import { PasscodeModule } from "../../components/PasscodeModule";
import Alert from "../../components/Alert/Alert";
import { SecureStorage } from "../../../core/storage/secureStorage";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getAuthentication,
  getCurrentRoute,
  getState,
  setAuthentication, setCurrentRoute,
} from "../../../store/reducers/StateCache";
import { getNextRoute } from "../../../routes/Rules";

const PasscodeLogin = ({}) => {
  const history = useHistory();
  const dispatch = useAppDispatch();

  const storeState = useAppSelector(getState);
  const authentication = useAppSelector(getAuthentication);
  const prevPath = useAppSelector(getCurrentRoute);
  const [passcode, setPasscode] = useState("");
  const seedPhrase = localStorage.getItem("seedPhrase");
  const [isOpen, setIsOpen] = useState(false);
  const [passcodeIncorrect, setPasscodeIncorrect] = useState(false);
  const headerText =
    seedPhrase !== null
      ? i18n.t("passcodelogin.alert.text.verify")
      : i18n.t("passcodelogin.alert.text.restart");
  const confirmButtonText =
    seedPhrase !== null
      ? i18n.t("passcodelogin.alert.button.verify")
      : i18n.t("passcodelogin.alert.button.restart");
  const cancelButtonText = i18n.t("passcodelogin.alert.button.cancel");

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const handlePinChange = (digit: number) => {
    if (passcode.length < 6) {
      setPasscode(passcode + digit);
      if (passcode.length === 5) {
        try {
          verifyPasscode(passcode + digit)
            .then((verified) => {
              if (verified) {
                const { nextPath, updateRedux } = getNextRoute(
                  ROUTES.PASSCODE_LOGIN_ROUTE,
                  storeState
                );
                if (nextPath.canNavigate) {
                  dispatch(updateRedux());
                  dispatch(setCurrentRoute({ path: nextPath.pathname }))
                  history.push(nextPath.pathname);
                  delay(500).then(() => setPasscode(""));
                }
              } else {
                setPasscodeIncorrect(true);
              }
            })
            .catch((e) => e.code === -35 && setPasscodeIncorrect(true));
        } catch (e) {
          setPasscodeIncorrect(true);
        }
      }
    }
  };

  const handleRemove = () => {
    if (passcode.length >= 1) {
      setPasscode(passcode.substring(0, passcode.length - 1));
    }
  };

  const handleForgotten = () => {
    seedPhrase !== null
      ? // TODO: Go to Verify your Seed Phrase
        history.push("/verifyseedphrase")
      : resetPasscode();
  };

  const verifyPasscode = async (pass: string) => {
    try {
      const storedPass = await SecureStorage.get("app-login-passcode");

      if (!storedPass) return false;
      await verify({
        encoded: storedPass,
        pass: pass,
      } as Argon2VerifyOptions);
      return true;
    } catch (e) {
      return false;
    }
  };
  const resetPasscode = () => {
    SecureStorage.delete("app-login-passcode");
    history.push(SET_PASSCODE_ROUTE);
  };

  useEffect(() => {}, []);

  return (
    <PageLayout
      backButton={false}
      backButtonPath={"/"}
      contentClasses=""
      progressBar={false}
      progressBarValue={0}
      progressBarBuffer={1}
    >
      <PasscodeModule
        title={i18n.t("passcodelogin.title")}
        description={i18n.t("passcodelogin.description")}
        error={
          passcode.length === 6 &&
          passcodeIncorrect && (
            <ErrorMessage message={i18n.t("passcodelogin.error")} />
          )
        }
        passcode={passcode}
        handlePinChange={handlePinChange}
        handleRemove={handleRemove}
      />
      <IonGrid>
        <IonRow>
          <IonCol className="continue-col">
            <IonButton
              shape="round"
              expand="block"
              fill="outline"
              className="secondary-button"
              onClick={() => setIsOpen(true)}
            >
              {i18n.t("passcodelogin.forgotten.button")}
            </IonButton>
          </IonCol>
        </IonRow>
      </IonGrid>
      <Alert
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        headerText={headerText}
        confirmButtonText={confirmButtonText}
        cancelButtonText={cancelButtonText}
        actionConfirm={handleForgotten}
      />
    </PageLayout>
  );
};

export { PasscodeLogin };
