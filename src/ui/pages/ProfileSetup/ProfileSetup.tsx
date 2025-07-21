import { useState } from "react";
import { Agent } from "../../../core/agent/agent";
import { MiscRecordId } from "../../../core/agent/agent.types";
import { IdentifierService } from "../../../core/agent/services";
import { CreateIdentifierInputs } from "../../../core/agent/services/identifier.types";
import { i18n } from "../../../i18n";
import { RoutePath } from "../../../routes";
import { getNextRoute } from "../../../routes/nextRoute";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getIndividualFirstCreateSetting,
  setIndividualFirstCreate,
} from "../../../store/reducers/identifiersCache";
import {
  getStateCache,
  showNoWitnessAlert
} from "../../../store/reducers/stateCache";
import { updateReduxState } from "../../../store/utils";
import { ResponsivePageLayout } from "../../components/layout/ResponsivePageLayout";
import { PageFooter } from "../../components/PageFooter";
import { PageHeader } from "../../components/PageHeader";
import { Spinner } from "../../components/Spinner";
import { SpinnerConverage } from "../../components/Spinner/Spinner.type";
import { useAppIonRouter } from "../../hooks";
import { useProfile } from "../../hooks/useProfile";
import { showError } from "../../utils/error";
import { nameChecker } from "../../utils/nameChecker";
import { SetupProfile } from "./components/SetupProfile";
import { ProfileType, SetupProfileType } from "./components/SetupProfileType";
import { Welcome } from "./components/Welcome";
import "./ProfileSetup.scss";
import { ProfileSetupProps, SetupProfileStep } from "./ProfileSetup.types";

export const ProfileSetup = ({ onClose }: ProfileSetupProps) => {
  const pageId = "profile-setup";
  const stateCache = useAppSelector(getStateCache);
  const individualFirstCreate = useAppSelector(getIndividualFirstCreateSetting);
  const dispatch = useAppDispatch();
  const { updateDefaultProfile, defaultProfile } = useProfile();
  const [step, setStep] = useState(SetupProfileStep.SetupType);
  const [profileType, setProfileType] = useState(ProfileType.Individual);
  const [userName, setUserName] = useState("");
  const [isLoading, setLoading] = useState(false);
  const ionRouter = useAppIonRouter();

  const isModal = !!onClose;

  const title = i18n.t(`setupprofile.${step}.title`);
  const back = [SetupProfileStep.SetupProfile].includes(step)
    ? i18n.t("setupprofile.button.back")
    : isModal && defaultProfile
      ? i18n.t("setupprofile.button.cancel")
      : undefined;

  const getButtonText = () => {
    switch (step) {
      case SetupProfileStep.FinishSetup:
        return i18n.t("setupprofile.button.started");
      default:
        return i18n.t("setupprofile.button.confirm");
    }
  };

  const handleBack = () => {
    if (step === SetupProfileStep.SetupProfile) {
      setStep(SetupProfileStep.SetupType);
      return;
    }

    onClose?.(true);
  };

  const createIdentifier = async () => {
    const error = nameChecker.getError(userName);

    if (error) return;

    const metadata: CreateIdentifierInputs = {
      displayName: userName,
      theme: 0,
    };

    try {
      setLoading(true);

      // Create the identifier
      const { identifier } = await Agent.agent.identifiers.createIdentifier(
        metadata
      );

      if (individualFirstCreate) {
        await Agent.agent.basicStorage
          .deleteById(MiscRecordId.INDIVIDUAL_FIRST_CREATE)
          .then(() => dispatch(setIndividualFirstCreate(false)));
      }

      await updateDefaultProfile(identifier);

      if (isModal) {
        onClose();
        navToCredetials();
        return;
      }

      await Agent.agent.basicStorage.deleteById(MiscRecordId.IS_SETUP_PROFILE);
      setStep(SetupProfileStep.FinishSetup);
    } catch (e) {
      const errorMessage = (e as Error).message;

      if (
        errorMessage.includes(
          IdentifierService.INSUFFICIENT_WITNESSES_AVAILABLE
        ) ||
        errorMessage.includes(
          IdentifierService.MISCONFIGURED_AGENT_CONFIGURATION
        )
      ) {
        dispatch(showNoWitnessAlert(true));
        return;
      }

      showError("Unable to create identifier", e, dispatch);
    } finally {
      setLoading(false);
    }
  };

  const navToCredetials = () => {
    const { nextPath, updateRedux } = getNextRoute(RoutePath.PROFILE_SETUP, {
      store: { stateCache },
      state: {
        isSetupProfile: false,
      },
    });

    updateReduxState(
      nextPath.pathname,
      {
        store: { stateCache },
      },
      dispatch,
      updateRedux
    );
    ionRouter.push(nextPath.pathname);
  };

  const handleChangeStep = () => {
    if (step === SetupProfileStep.SetupProfile) {
      createIdentifier();
      return;
    }

    if (step === SetupProfileStep.FinishSetup) {
      navToCredetials();
      return;
    }

    setStep(SetupProfileStep.SetupProfile);
  };

  const renderContent = () => {
    switch (step) {
      case SetupProfileStep.SetupProfile:
        return (
          <SetupProfile
            userName={userName}
            onChangeUserName={setUserName}
          />
        );
      case SetupProfileStep.FinishSetup:
        return <Welcome userName={userName} />;
      case SetupProfileStep.SetupType:
      default:
        return (
          <SetupProfileType
            profileType={profileType}
            onChangeProfile={setProfileType}
          />
        );
    }
  };

  return (
    <ResponsivePageLayout
      pageId={pageId}
      customClass={step}
      header={
        step !== SetupProfileStep.FinishSetup ? (
          <PageHeader
            closeButton={!!back}
            closeButtonLabel={back}
            closeButtonAction={handleBack}
            title={title}
          />
        ) : undefined
      }
    >
      {renderContent()}
      <PageFooter
        primaryButtonText={getButtonText()}
        primaryButtonAction={handleChangeStep}
        primaryButtonDisabled={
          (SetupProfileStep.SetupProfile === step && !userName) || isLoading
        }
        pageId={pageId}
      />
      <Spinner
        show={isLoading}
        coverage={SpinnerConverage.Screen}
      />
    </ResponsivePageLayout>
  );
};
