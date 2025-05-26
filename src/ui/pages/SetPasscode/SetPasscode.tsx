import { useRef, useState } from "react";
import { i18n } from "../../../i18n";
import { RoutePath } from "../../../routes";
import { getNextRoute } from "../../../routes/nextRoute";
import { DataProps } from "../../../routes/nextRoute/nextRoute.types";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getStateCache,
  showGenericError,
} from "../../../store/reducers/stateCache";
import { updateReduxState } from "../../../store/utils";
import { CreatePasscodeModule } from "../../components/CreatePasscodeModule";
import { CreatePasscodeModuleRef } from "../../components/CreatePasscodeModule/CreatePasscodeModule.types";
import { PageHeader } from "../../components/PageHeader";
import { ResponsivePageLayout } from "../../components/layout/ResponsivePageLayout";
import { useAppIonRouter } from "../../hooks";
import "./SetPasscode.scss";
import { getBackRoute } from "../../../routes/backRoute";
import { Agent } from "../../../core/agent/agent";
import { MiscRecordId } from "../../../core/agent/agent.types";

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
    await Agent.agent.basicStorage
      .save({
        id: MiscRecordId.APP_ALREADY_INIT,
        content: {
          initialized: true,
        },
      })
      .catch((e) => {
        dispatch(showGenericError(true));
        throw e;
      });
    ionRouter.push(nextPath.pathname, "forward", "push");
  };

  const isOnReenterPasscodeStep =
    passCodeValue.originalPasscode.length > 0 &&
    passCodeValue.passcode.length <= 6;

  const title =
    passCodeValue.originalPasscode !== ""
      ? i18n.t("setpasscode.reenterpasscode")
      : i18n.t("setpasscode.enterpasscode");

  const closeButtonLabel = !isOnReenterPasscodeStep
    ? i18n.t("setpasscode.cancelbtn")
    : i18n.t("setpasscode.backbtn");

  const handleClose = () => {
    if (isOnReenterPasscodeStep) {
      ref.current?.clearState();
      return;
    }

    const { backPath, updateRedux } = getBackRoute(RoutePath.SET_PASSCODE, {
      store: { stateCache },
    });

    updateReduxState(
      backPath.pathname,
      { store: { stateCache } },
      dispatch,
      updateRedux
    );

    ionRouter.push(backPath.pathname, "back", "pop");
  };

  const description = stateCache.authentication.recoveryWalletProgress
    ? i18n.t("setpasscode.recoverydescription")
    : i18n.t("setpasscode.description");

  return (
    <ResponsivePageLayout
      pageId={pageId}
      header={
        <PageHeader
          closeButton
          closeButtonAction={handleClose}
          closeButtonLabel={closeButtonLabel}
          currentPath={RoutePath.SET_PASSCODE}
          progressBar={true}
          progressBarValue={0.2}
          progressBarBuffer={1}
        />
      }
    >
      <CreatePasscodeModule
        title={title}
        description={description}
        ref={ref}
        testId={pageId}
        onCreateSuccess={handlePassAuth}
        onPasscodeChange={(passcode, originalPasscode) => {
          setPassCodeValue({
            passcode,
            originalPasscode,
          });
        }}
        changePasscodeMode
      />
    </ResponsivePageLayout>
  );
};

export { SetPasscode };
