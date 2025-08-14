import { useEffect, useRef, useState } from "react";
import { Salter } from "signify-ts";
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
} from "../../../store/reducers/profileCache";
import {
  getStateCache,
  showNoWitnessAlert,
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
import { GroupSetup } from "./components/GroupSetup";
import { SetupProfile } from "./components/SetupProfile";
import { ProfileType, SetupProfileType } from "./components/SetupProfileType";
import { Welcome } from "./components/Welcome";
import "./ProfileSetup.scss";
import { ProfileSetupProps, SetupProfileStep } from "./ProfileSetup.types";
import { Scan } from "../../components/Scan";
import { ScanRef } from "../../components/Scan/Scan.types";
import { useScanHandle } from "../../components/Scan/hook/useScanHandle";
import { useCameraDirection } from "../../components/Scan/hook/useCameraDirection";
import { repeatOutline } from "ionicons/icons";
import { BasicRecord } from "../../../core/agent/records";

export const ProfileSetup = ({ onClose }: ProfileSetupProps) => {
  const pageId = "profile-setup";
  const stateCache = useAppSelector(getStateCache);
  const individualFirstCreate = useAppSelector(getIndividualFirstCreateSetting);
  const dispatch = useAppDispatch();
  const { updateDefaultProfile, defaultProfile } = useProfile();
  const [step, setStep] = useState(SetupProfileStep.SetupType);
  const [profileType, setProfileType] = useState(ProfileType.Individual);
  const [userName, setUserName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const ionRouter = useAppIonRouter();
  const cacheIdentifier = useRef("");
  const scanRef = useRef<ScanRef>(null);
  const { resolveGroupConnection } = useScanHandle();
  const { cameraDirection, changeCameraDirection, supportMultiCamera } =
    useCameraDirection();
  const [enableCameraDirection, setEnableCameraDirection] = useState(false);

  const isModal = !!onClose;

  const title = i18n.t(`setupprofile.${step}.title`);
  const back = stateCache.isPendingJoinGroup
    ? undefined // Disable back button if pending join group
    : [
        SetupProfileStep.SetupProfile,
        SetupProfileStep.GroupSetupStart,
      ].includes(step)
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
    if (
      step === SetupProfileStep.GroupSetupStart ||
      (step === SetupProfileStep.SetupProfile &&
        profileType !== ProfileType.Group)
    ) {
      setStep(SetupProfileStep.SetupType);
      return;
    }

    if (step === SetupProfileStep.SetupProfile) {
      setStep(SetupProfileStep.GroupSetupStart);
      return;
    }

    onClose?.(true);
  };

  const createIdentifier = async () => {
    const error = nameChecker.getError(userName);

    if (error) return;

    const isGroup = profileType === ProfileType.Group;
    const metadata: CreateIdentifierInputs = {
      displayName: isGroup ? groupName : userName,
      theme: 0,
    };

    if (isGroup) {
      const groupMetadata = {
        groupId: new Salter({}).qb64,
        groupInitiator: true,
        groupCreated: false,
        userName: userName,
      };
      metadata.groupMetadata = groupMetadata;
    }

    try {
      setLoading(true);

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
        navToCredentials(identifier);
        return;
      }

      await Agent.agent.basicStorage.deleteById(MiscRecordId.IS_SETUP_PROFILE);
      cacheIdentifier.current = identifier;
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

  const navToCredentials = (id?: string) => {
    const { nextPath, updateRedux } = getNextRoute(RoutePath.PROFILE_SETUP, {
      store: { stateCache },
      state: {
        isSetupProfile: false,
        isGroup: profileType === ProfileType.Group,
        id,
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

  const handleOpenScan = () => {
    setIsScanOpen(true);
  };

  const handleCloseScan = () => {
    setIsScanOpen(false);
  };

  const handleChangeStep = () => {
    if (step === SetupProfileStep.SetupProfile) {
      createIdentifier();
      return;
    }

    if (step === SetupProfileStep.FinishSetup) {
      navToCredentials(cacheIdentifier.current);
      return;
    }

    if (
      profileType === ProfileType.Group &&
      step === SetupProfileStep.SetupType
    ) {
      setStep(SetupProfileStep.GroupSetupStart);
      return;
    }

    setStep(SetupProfileStep.SetupProfile);
  };

  const handleScanFinish = async (content: string) => {
    try {
      const url = new URL(content);
      const scanGroupId = url.searchParams.get("groupId");

      if (!scanGroupId) {
        throw new Error("Group ID not found in the scanned QR code.");
      }

      const isInitiator = false;

      await resolveGroupConnection(
        content,
        scanGroupId,
        isInitiator,
        () => handleCloseScan(),
        undefined,
        (id: string) => console.warn(`Duplicate group ID detected: ${id}`)
      );

      await Agent.agent.basicStorage.createOrUpdateBasicRecord(
        new BasicRecord({
          id: MiscRecordId.PENDING_JOIN_GROUP,
          content: {
            value: true,
          },
        })
      );

      setStep(SetupProfileStep.GroupSetupConfirm);
    } catch (error) {
      console.error("Failed to resolve group connection:", error);
      showError("Unable to process the scanned QR code", error, dispatch);
    } finally {
      handleCloseScan();
    }
  };

  const handleConfirmJoinGroup = () => {
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
      case SetupProfileStep.GroupSetupStart:
        return (
          <GroupSetup
            groupName={groupName}
            onChangeGroupName={setGroupName}
            onClickEvent={handleOpenScan}
            setupProfileStep={step}
          />
        );
      case SetupProfileStep.GroupSetupConfirm:
        return (
          <GroupSetup
            groupName={groupName}
            onChangeGroupName={setGroupName}
            onClickEvent={handleConfirmJoinGroup}
            setupProfileStep={step}
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

  useEffect(() => {
    if (stateCache.isPendingJoinGroup) {
      setStep(SetupProfileStep.GroupSetupConfirm);
    }
  }, [stateCache.isPendingJoinGroup]);

  return (
    <>
      {isScanOpen ? (
        <ResponsivePageLayout
          pageId={pageId}
          customClass={"scan"}
          header={
            <PageHeader
              closeButton={!!back}
              closeButtonLabel={back}
              closeButtonAction={handleCloseScan}
              actionButton={supportMultiCamera}
              actionButtonIcon={repeatOutline}
              actionButtonAction={changeCameraDirection}
              actionButtonDisabled={!enableCameraDirection}
            />
          }
        >
          <Scan
            ref={scanRef}
            onFinishScan={handleScanFinish}
            cameraDirection={cameraDirection}
            onCheckPermissionFinish={setEnableCameraDirection}
          />
        </ResponsivePageLayout>
      ) : (
        <ResponsivePageLayout
          pageId={pageId}
          customClass={step}
          header={
            step !== SetupProfileStep.FinishSetup ? (
              <PageHeader
                closeButton={!!back}
                closeButtonLabel={back}
                closeButtonAction={handleBack}
                title={!isScanOpen ? title : undefined}
              />
            ) : undefined
          }
        >
          {renderContent()}
          <PageFooter
            primaryButtonText={getButtonText()}
            primaryButtonAction={handleChangeStep}
            primaryButtonDisabled={
              (SetupProfileStep.GroupSetupStart === step && !groupName) ||
              (SetupProfileStep.SetupProfile === step && !userName) ||
              isLoading
            }
            pageId={pageId}
          />
          <Spinner
            show={isLoading}
            coverage={SpinnerConverage.Screen}
          />
        </ResponsivePageLayout>
      )}
    </>
  );
};
