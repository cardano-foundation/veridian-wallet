import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { Agent } from "../../../core/agent/agent";
import { MiscRecordId } from "../../../core/agent/agent.types";
import { BasicRecord } from "../../../core/agent/records";
import { i18n } from "../../../i18n";
import { RoutePath } from "../../../routes";
import { getNextRoute } from "../../../routes/nextRoute";
import { DataProps } from "../../../routes/nextRoute/nextRoute.types";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { getStateCache } from "../../../store/reducers/stateCache";
import { updateReduxState } from "../../../store/utils";
import { Intro } from "../../components/Intro";
import { PageFooter } from "../../components/PageFooter";
import { ResponsivePageLayout } from "../../components/layout/ResponsivePageLayout";
import { useExitAppWithDoubleTap } from "../../hooks/exitAppWithDoubleTapHook";
import "./Onboarding.scss";

const Onboarding = () => {
  const pageId = "onboarding";
  const history = useHistory();
  const dispatch = useAppDispatch();
  const stateCache = useAppSelector(getStateCache);
  const [hiddenPage, setHiddenPage] = useState(false);
  useExitAppWithDoubleTap(hiddenPage);

  useEffect(() => {
    setHiddenPage(history?.location?.pathname !== RoutePath.ONBOARDING);
  }, [hiddenPage, history?.location?.pathname]);

  const handleNavigation = (isRecoveryMode: boolean) => {
    const data: DataProps = {
      store: { stateCache },
      state: {
        recoveryWalletProgress: isRecoveryMode,
      },
    };
    const { nextPath, updateRedux } = getNextRoute(RoutePath.ONBOARDING, data);
    updateReduxState(nextPath.pathname, data, dispatch, updateRedux);

    if (isRecoveryMode) {
      Agent.agent.basicStorage.createOrUpdateBasicRecord(
        new BasicRecord({
          id: MiscRecordId.APP_RECOVERY_WALLET,
          content: {
            value: String(isRecoveryMode),
          },
        })
      );
    }

    history.push({
      pathname: nextPath.pathname,
      state: data.state,
    });
  };

  if (hiddenPage) return null;

  return (
    <ResponsivePageLayout pageId={pageId}>
      <Intro />
      <PageFooter
        pageId={pageId}
        primaryButtonText={`${i18n.t("onboarding.getstarted.button.label")}`}
        primaryButtonAction={() => handleNavigation(false)}
        tertiaryButtonText={`${i18n.t(
          "onboarding.alreadywallet.button.label"
        )}`}
        tertiaryButtonAction={() => handleNavigation(true)}
      />
    </ResponsivePageLayout>
  );
};

export { Onboarding };
