import { IonSpinner } from "@ionic/react";
import { useCallback, useEffect, useState } from "react";
import { Agent } from "../../../core/agent/agent";
import { MiscRecordId } from "../../../core/agent/agent.types";
import { BasicRecord } from "../../../core/agent/records";
import { KeyStoreKeys, SecureStorage } from "../../../core/storage";
import { RoutePath } from "../../../routes";
import { getNextRoute } from "../../../routes/nextRoute";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getProfiles,
  updateCurrentProfile,
} from "../../../store/reducers/profileCache";
import { getSeedPhraseCache } from "../../../store/reducers/seedPhraseCache";
import {
  getStateCache,
  setIsSetupProfile,
  setRecoveryCompleteNoInterruption,
  setSeedPhraseVerified,
  setSsiAgentIsSet,
} from "../../../store/reducers/stateCache";
import { updateReduxState } from "../../../store/utils";
import { ToastMsgType } from "../../globals/types";
import { useAppIonRouter } from "../../hooks";
import { showError } from "../../utils/error";
import "./CreateSSIAgent.scss";
import { CurrentPage, SSIError } from "./CreateSSIAgent.types";
import { AdvancedSetting, removeLastSlash } from "./components/AdvancedSetting";
import { Connect } from "./components/Connect";
import { SSIScan } from "./components/SSIScan";

const SSI_URLS_EMPTY = "SSI url is empty";
const SEED_PHRASE_EMPTY = "Invalid seed phrase";

const CreateSSIAgent = () => {
  const seedPhraseCache = useAppSelector(getSeedPhraseCache);
  const stateCache = useAppSelector(getStateCache);
  const identifiers = useAppSelector(getProfiles);

  const ionRouter = useAppIonRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [errors, setError] = useState<SSIError>({
    hasMismatchError: false,
    unknownError: false,
    isInvalidBootUrl: false,
    isInvalidConnectUrl: false,
    failedDiscoveryConnectUrl: false,
    connectURlNotFound: false,
    networkIssue: false,
  });
  const [currentPage, setCurrentPage] = useState(CurrentPage.Connect);

  const isRecoveryMode = stateCache.authentication.recoveryWalletProgress;
  const isOnline = stateCache.isOnline;

  const setSSIError = (values: Partial<SSIError>) => {
    setError((errors) => ({
      ...errors,
      ...values,
    }));
  };

  const handleScanError = (error: Error) => {
    const errorMessage = error.message;

    if (
      [
        Agent.CONNECT_URL_NOT_FOUND,
        Agent.KERIA_BOOT_FAILED,
        Agent.KERIA_BOOTED_ALREADY_BUT_CANNOT_CONNECT,
      ].some((message) => errorMessage.includes(message))
    ) {
      showError(errorMessage, error, dispatch, ToastMsgType.URL_ERROR);
      return;
    }

    if (
      [
        Agent.KERIA_BOOT_FAILED_BAD_NETWORK,
        Agent.KERIA_CONNECT_FAILED_BAD_NETWORK,
        Agent.CONNECT_URL_DISCOVERY_BAD_NETWORK,
      ].some((message) => errorMessage.includes(message))
    ) {
      showError(errorMessage, error, dispatch, ToastMsgType.NETWORK_ERROR);
      return;
    }

    showError(
      "Unable to boot or connect keria",
      error,
      dispatch,
      ToastMsgType.UNKNOWN_ERROR
    );
  };

  const handleError = (error: Error) => {
    const errorMessage = error.message;

    if (Agent.KERIA_BOOT_FAILED === errorMessage) {
      setSSIError({
        isInvalidBootUrl: true,
      });
      return;
    }

    if (Agent.KERIA_BOOTED_ALREADY_BUT_CANNOT_CONNECT === errorMessage) {
      setSSIError({
        isInvalidConnectUrl: true,
      });
      return;
    }

    if (Agent.KERIA_NOT_BOOTED === errorMessage) {
      showError(
        errorMessage,
        error,
        dispatch,
        ToastMsgType.CONNECT_URL_MISMATCH
      );
      setSSIError({
        hasMismatchError: true,
      });
      return;
    }

    if (
      [
        Agent.KERIA_BOOT_FAILED_BAD_NETWORK,
        Agent.KERIA_CONNECT_FAILED_BAD_NETWORK,
      ].includes(errorMessage)
    ) {
      showError(errorMessage, error, dispatch, ToastMsgType.NETWORK_ERROR);
      setSSIError({
        networkIssue: true,
      });
      return;
    }

    showError(
      "Unable to boot or connect keria",
      error,
      dispatch,
      ToastMsgType.UNKNOWN_ERROR
    );
  };

  const updateIsSetupProfile = useCallback(
    async (mustSetupProfile: boolean) => {
      try {
        if (mustSetupProfile) {
          await Agent.agent.basicStorage.createOrUpdateBasicRecord(
            new BasicRecord({
              id: MiscRecordId.IS_SETUP_PROFILE,
              content: {
                value: mustSetupProfile,
              },
            })
          );
        } else {
          const oldestProfile = Object.values(identifiers).reduce(
            (prev, curr) => {
              return new Date(curr.identity.createdAtUTC) <
                new Date(prev.identity.createdAtUTC)
                ? curr
                : prev;
            }
          );

          if (oldestProfile) {
            Agent.agent.basicStorage
              .createOrUpdateBasicRecord(
                new BasicRecord({
                  id: MiscRecordId.DEFAULT_PROFILE,
                  content: { defaultProfile: oldestProfile.identity.id },
                })
              )
              .then(() => {
                dispatch(updateCurrentProfile(oldestProfile.identity.id));
              })
              .catch((e) => {
                showError("Cannot set default profile", e);
              });
          }
        }

        dispatch(setIsSetupProfile(mustSetupProfile));
      } catch (e) {
        showError("Unable to set first app launch", e);
      }
    },
    [dispatch, identifiers]
  );

  const getConnectUrl = async (bootUrl: string) => {
    try {
      return await Agent.agent.discoverConnectUrl(bootUrl);
    } catch (e) {
      const message = (e as Error).message;

      if (
        message.startsWith(Agent.CONNECT_URL_DISCOVERY_FAILED) ||
        message.startsWith(Agent.CONNECT_URL_NOT_FOUND)
      ) {
        return bootUrl;
      }

      throw e;
    }
  };

  const handlePostRecovery = async () => {
    await Agent.agent.markSeedPhraseAsVerified();
    dispatch(setSeedPhraseVerified(true));
    dispatch(setRecoveryCompleteNoInterruption());
  };

  const recoverAndLoadDb = async () => {
    const recoveryStatus = await Agent.agent.basicStorage.findById(
      MiscRecordId.CLOUD_RECOVERY_STATUS
    );

    const isSyncing = recoveryStatus?.content?.syncing;

    if (isSyncing) {
      setCurrentPage(CurrentPage.Connect);
      dispatch(setSsiAgentIsSet(true));
    }

    await Agent.agent.connect(Agent.DEFAULT_RECONNECT_INTERVAL, false);

    if (isSyncing) {
      try {
        await Agent.agent.syncWithKeria();
        await handlePostRecovery();
      } catch (e) {
        const errorMessage = (e as Error).message;

        if (errorMessage === Agent.SYNC_DATA_NETWORK_ERROR) {
          await recoverAndLoadDb();
          return;
        }

        throw e;
      }
    }
  };

  const handleRecoveryWallet = async (bootUrl: string) => {
    setLoading(true);
    try {
      if (!bootUrl) {
        throw new Error(SSI_URLS_EMPTY);
      }

      if (!seedPhraseCache.seedPhrase) {
        throw new Error(SEED_PHRASE_EMPTY);
      }

      const validBootUrl = removeLastSlash(bootUrl.trim());

      const connectUrl = await getConnectUrl(validBootUrl);

      await Agent.agent.recoverKeriaAgent(
        seedPhraseCache.seedPhrase.split(" "),
        connectUrl
      );

      await handlePostRecovery();
      // Note: We need to wait load data from db before go to next page
    } catch (e) {
      const errorMessage = (e as Error).message;

      if (
        [SSI_URLS_EMPTY, SEED_PHRASE_EMPTY, Agent.INVALID_MNEMONIC].includes(
          errorMessage
        )
      ) {
        return;
      }

      if (Agent.SYNC_DATA_NETWORK_ERROR === errorMessage) {
        await recoverAndLoadDb();
        return;
      }

      if (currentPage === CurrentPage.Scan) {
        handleScanError(e as Error);
        return;
      }

      handleError(e as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function handAfterRecoveryWallet() {
      const shouldSetupProfile = Object.values(identifiers).length === 0;

      await updateIsSetupProfile(shouldSetupProfile);

      const { nextPath, updateRedux } = getNextRoute(RoutePath.SSI_AGENT, {
        store: { stateCache },
        state: {
          shouldSetupProfile,
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

      await Agent.agent.basicStorage
        .deleteById(MiscRecordId.APP_RECOVERY_WALLET)
        .catch((e) => showError("Unable to detele recovery key", e));

      ionRouter.push(nextPath.pathname, "forward", "push");
    }

    // Note: If user is recovering their wallet and old data has been loaded
    if (isRecoveryMode && isOnline) {
      handAfterRecoveryWallet();
    }
  }, [
    dispatch,
    stateCache,
    updateIsSetupProfile,
    isRecoveryMode,
    isOnline,
    identifiers,
    ionRouter,
  ]);

  const handleCreateSSI = async (bootUrl: string, connectUrl?: string) => {
    setLoading(true);
    try {
      const validBootUrl = removeLastSlash(bootUrl.trim());

      const existBran = await SecureStorage.keyExists(
        KeyStoreKeys.SIGNIFY_BRAN
      );

      if (!existBran) {
        const seedPhraseStore = await Agent.agent.getBranAndMnemonic();
        await SecureStorage.set(
          KeyStoreKeys.SIGNIFY_BRAN,
          seedPhraseStore.bran
        );
      }

      if (connectUrl) {
        const validconnectUrl = removeLastSlash(connectUrl.trim());

        await Agent.agent.bootAndConnect({
          bootUrl: validBootUrl,
          url: validconnectUrl,
        });
      } else {
        await Agent.agent.bootAndConnect(validBootUrl);
      }

      await updateIsSetupProfile(true);

      const { nextPath, updateRedux } = getNextRoute(RoutePath.SSI_AGENT, {
        store: { stateCache },
        state: {
          shouldSetupProfile: true,
        },
      });

      updateReduxState(
        nextPath.pathname,
        {
          store: { stateCache },
          state: {
            shouldSetupProfile: true,
          },
        },
        dispatch,
        updateRedux
      );

      ionRouter.push(nextPath.pathname, "forward", "push");
    } catch (e) {
      if (currentPage === CurrentPage.Scan) {
        handleScanError(e as Error);
        return;
      }

      handleError(e as Error);
    } finally {
      setLoading(false);
    }
  };

  const handleSSI = async (mainUrl?: string, connectUrl?: string) => {
    if (stateCache.authentication.recoveryWalletProgress) {
      if (currentPage == CurrentPage.Scan && mainUrl) {
        return await handleRecoveryWallet(mainUrl);
      }

      if (!connectUrl) return;
      return await handleRecoveryWallet(connectUrl);
    } else {
      if (!mainUrl) return;
      return await handleCreateSSI(mainUrl, connectUrl);
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case CurrentPage.Scan:
        return (
          <SSIScan
            setCurrentPage={setCurrentPage}
            onScanFinish={handleSSI}
            isLoading={loading}
            isRecovery={stateCache.authentication.recoveryWalletProgress}
          />
        );
      case CurrentPage.AdvancedSetting:
        return (
          <AdvancedSetting
            onSubmitForm={handleSSI}
            setCurrentPage={setCurrentPage}
            errors={errors}
            setErrors={setSSIError}
          />
        );
      default:
        return <Connect onConnect={() => setCurrentPage(CurrentPage.Scan)} />;
    }
  };

  return (
    <>
      {renderContent()}
      {loading && (
        <div
          className="ssi-spinner-container max-zindex"
          data-testid="ssi-spinner-container"
        >
          <IonSpinner name="circular" />
        </div>
      )}
    </>
  );
};

export { CreateSSIAgent };
