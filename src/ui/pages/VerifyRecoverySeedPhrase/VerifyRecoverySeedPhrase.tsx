import { useRef } from "react";
import { i18n } from "../../../i18n";
import { RoutePath } from "../../../routes";
import { getNextRoute } from "../../../routes/nextRoute";
import { DataProps } from "../../../routes/nextRoute/nextRoute.types";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { getStateCache } from "../../../store/reducers/stateCache";
import { updateReduxState } from "../../../store/utils";
import { PageHeader } from "../../components/PageHeader";
import {
  RecoverySeedPhraseModule,
  RecoverySeedPhraseModuleRef,
} from "../../components/RecoverySeedPhraseModule";
import { ScrollablePageLayout } from "../../components/layout/ScrollablePageLayout";
import { useAppIonRouter } from "../../hooks";
import "./VerifyRecoverySeedPhrase.scss";

const VerifyRecoverySeedPhrase = () => {
  const pageId = "verify-recovery-seed-phrase";
  const dispatch = useAppDispatch();
  const stateCache = useAppSelector(getStateCache);
  const ionRouter = useAppIonRouter();

  const ref = useRef<RecoverySeedPhraseModuleRef>(null);

  const handleNavigate = () => {
    const data: DataProps = {
      store: { stateCache },
    };

    const { nextPath, updateRedux } = getNextRoute(
      RoutePath.VERIFY_RECOVERY_SEED_PHRASE,
      data
    );

    ref.current?.clearState();
    updateReduxState(nextPath.pathname, data, dispatch, updateRedux);

    ionRouter.push(nextPath.pathname);
  };

  return (
    <ScrollablePageLayout
      pageId={pageId}
      header={
        <PageHeader
          progressBar={true}
          progressBarValue={0.75}
          progressBarBuffer={1}
        />
      }
    >
      <RecoverySeedPhraseModule
        title={`${i18n.t("verifyrecoveryseedphrase.title")}`}
        description={`${i18n.t("verifyrecoveryseedphrase.paragraph.top")}`}
        ref={ref}
        testId={pageId}
        onVerifySuccess={handleNavigate}
        displaySwitchModeButton
      />
    </ScrollablePageLayout>
  );
};

export { VerifyRecoverySeedPhrase };
