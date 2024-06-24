import { useRef, useState } from "react";
import {
  PreferencesKeys,
  PreferencesStorage,
} from "../../../core/storage/preferences/preferencesStorage";
import { i18n } from "../../../i18n";
import { RoutePath } from "../../../routes";
import { getNextRoute } from "../../../routes/nextRoute";
import { DataProps } from "../../../routes/nextRoute/nextRoute.types";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { getStateCache } from "../../../store/reducers/stateCache";
import { updateReduxState } from "../../../store/utils";
import { CreatePasscodeModule } from "../../components/CreatePasscodeModule";
import { CreatePasscodeModuleRef } from "../../components/CreatePasscodeModule/CreatePasscodeModule.types";
import { PageHeader } from "../../components/PageHeader";
import { ResponsivePageLayout } from "../../components/layout/ResponsivePageLayout";
import { useAppIonRouter } from "../../hooks";
import "./SetPasscode.scss";

const SetPasscode = () => {
  const pageId = "set-passcode";
  const ionRouter = useAppIonRouter();
  const dispatch = useAppDispatch();
  const stateCache = useAppSelector(getStateCache);
  const [passCodeValue, setPassCodeValue] = useState({
    passcode: "",
    originalPasscode: "",
  });

  const ref = useRef<CreatePasscodeModuleRef>(null);

  const handlePassAuth = async () => {
    const data: DataProps = {
      store: { stateCache },
    };
    const { nextPath, updateRedux } = getNextRoute(
      RoutePath.SET_PASSCODE,
      data
    );
    updateReduxState(nextPath.pathname, data, dispatch, updateRedux);
    ionRouter.push(nextPath.pathname, "forward", "push");
    ref.current?.clearState();

    await PreferencesStorage.set(PreferencesKeys.APP_ALREADY_INIT, {
      initialized: true,
    });
  };

  const isOnReenterPasscodeStep =
    passCodeValue.originalPasscode.length > 0 &&
    passCodeValue.passcode.length < 6;

  const title =
    passCodeValue.originalPasscode !== ""
      ? i18n.t("setpasscode.reenterpasscode.title")
      : i18n.t("setpasscode.enterpasscode.title");

  return (
    <ResponsivePageLayout
      pageId={pageId}
      header={
        <PageHeader
          backButton={true}
          onBack={isOnReenterPasscodeStep ? ref.current?.clearState : undefined}
          beforeBack={ref.current?.clearState}
          currentPath={RoutePath.SET_PASSCODE}
          progressBar={true}
          progressBarValue={0.25}
          progressBarBuffer={1}
        />
      }
    >
      <CreatePasscodeModule
        title={title}
        description={`${i18n.t("setpasscode.enterpasscode.description")}`}
        ref={ref}
        testId={pageId}
        onCreateSuccess={handlePassAuth}
        onPasscodeChange={(passcode, originalPasscode) => {
          setPassCodeValue({
            passcode,
            originalPasscode,
          });
        }}
      />
    </ResponsivePageLayout>
  );
};

export { SetPasscode };
