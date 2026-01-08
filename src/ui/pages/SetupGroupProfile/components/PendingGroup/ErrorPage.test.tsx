const checkPermisson = jest.fn(() =>
  Promise.resolve({
    camera: "granted",
  })
);
const requestPermission = jest.fn();
const startScan = jest.fn();
const stopScan = jest.fn();
const getPlatformMock = jest.fn(() => ["mobile"]);

import {
  BarcodeFormat,
  BarcodesScannedEvent,
  BarcodeValueType,
} from "@capacitor-mlkit/barcode-scanning";
import { BiometryType } from "@capgo/capacitor-native-biometric";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import {
  CreationStatus,
  OobiType,
} from "../../../../../core/agent/agent.types";
import EN_TRANSLATIONS from "../../../../../locales/en/en.json";
import { TabsRoutePath } from "../../../../../routes/paths";
import { setToastMsg } from "../../../../../store/reducers/stateCache";
import {
  connectionsFix,
  multisignConnection,
  multisignConnections,
} from "../../../../__fixtures__/connectionsFix";
import { filteredIdentifierFix } from "../../../../__fixtures__/filteredIdentifierFix";
import { notificationsFix } from "../../../../__fixtures__/notificationsFix";
import { profileCacheFixData } from "../../../../__fixtures__/storeDataFix";
import { ToastMsgType } from "../../../../globals/types";
import { makeTestStore } from "../../../../utils/makeTestStore";
import { ErrorPage } from "./ErrorPage";

const mockGetMultisigConnection = jest.fn(() =>
  Promise.resolve([connectionsFix[3]])
);

jest.mock("../../../../hooks/useBiometricsHook", () => ({
  useBiometricAuth: jest.fn(() => ({
    biometricsIsEnabled: false,
    biometricInfo: {
      isAvailable: false,
      hasCredentials: false,
      biometryType: BiometryType.FINGERPRINT,
    },
    handleBiometricAuth: jest.fn(() => Promise.resolve(false)),
    setBiometricsIsEnabled: jest.fn(),
  })),
}));

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  isPlatform: () => true,
  getPlatforms: () => getPlatformMock(),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

jest.mock("@capacitor/core", () => {
  return {
    ...jest.requireActual("@capacitor/core"),
    Capacitor: {
      isNativePlatform: () => jest.fn(() => true),
    },
  };
});

const connectByOobiUrlMock = jest.fn((...arg: unknown[]) => ({
  connection: multisignConnection,
  type: OobiType.NORMAL,
}));
jest.mock("../../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      identifiers: {
        getIdentifiersCache: jest.fn(),
        createIdentifier: jest.fn(() => ({
          identifier: "mock-id",
          creationStatus: CreationStatus.COMPLETE,
        })),
      },
      multiSigs: {
        getGroupSizeFromIcpExn: jest.fn(() => Promise.resolve(3)),
      },
      connections: {
        getMultisigLinkedContacts: () => mockGetMultisigConnection(),
        getOobi: jest.fn(),
        connectByOobiUrl: (...arg: unknown[]) => connectByOobiUrlMock(...arg),
      },
      basicStorage: {
        findById: jest.fn(),
      },
    },
  },
}));

const groupId = "549eb79f-856c-4bb7-8dd5-d5eed865906a";
const barcodes = [
  {
    displayValue: `http://dev.keria.cf-keripy.metadata.dev.cf-deployments.org/oobi/string1/agent/string2?groupId=${groupId}`,
    format: BarcodeFormat.QrCode,
    rawValue: `http://dev.keria.cf-keripy.metadata.dev.cf-deployments.org/oobi/string1/agent/string2?groupId=${groupId}`,
    valueType: BarcodeValueType.Url,
  },
];

const addListener = jest.fn(
  (eventName: string, listenerFunc: (result: BarcodesScannedEvent) => void) => {
    setTimeout(() => {
      listenerFunc({
        barcodes,
      });
    }, 100);

    return {
      remove: jest.fn(),
    };
  }
);
jest.mock("@capacitor-mlkit/barcode-scanning", () => {
  return {
    ...jest.requireActual("@capacitor-mlkit/barcode-scanning"),
    BarcodeScanner: {
      checkPermissions: () => checkPermisson(),
      requestPermissions: () => requestPermission(),
      addListener: (
        eventName: string,
        listenerFunc: (result: BarcodesScannedEvent) => void
      ) => addListener(eventName, listenerFunc),
      startScan: () => startScan(),
      stopScan: () => stopScan(),
      removeAllListeners: jest.fn(),
    },
  };
});

const dispatchMock = jest.fn();

const initialState = {
  stateCache: {
    routes: [TabsRoutePath.NOTIFICATIONS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
    },
    queueIncomingRequest: {
      isProcessing: false,
      queues: [],
      isPaused: false,
    },
  },
  profilesCache: {
    ...profileCacheFixData,
  },
};

const pendingGroupId = filteredIdentifierFix[6].id;
const profile = {
  ...profileCacheFixData.profiles[pendingGroupId],
  multisigConnections: [multisignConnections[0]],
};

describe("Multisign error feedback", () => {
  test("Render", async () => {
    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByText } = render(
      <Provider store={storeMocked}>
        <ErrorPage
          pageId="feedback"
          activeStatus
          notificationDetails={notificationsFix[4]}
          onFinishSetup={jest.fn()}
          profile={profileCacheFixData.profiles[filteredIdentifierFix[0].id]}
          oobi="mockoobi"
          handleLeaveGroup={jest.fn()}
        />
      </Provider>
    );

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.identifier.errorpage
          .alerttext
      )
    ).toBeVisible();

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.identifier.errorpage
          .groupmember
      )
    ).toBeVisible();

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.identifier.errorpage
          .instructions.title
      )
    ).toBeVisible();

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.identifier.errorpage
          .instructions.detailtext
      )
    ).toBeVisible();

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.identifier.errorpage
          .instructions.stepone
      )
    ).toBeVisible();

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.identifier.errorpage
          .instructions.steptwo
      )
    ).toBeVisible();

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.identifier.errorpage
          .instructions.steptwo
      )
    ).toBeVisible();

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.identifier.errorpage.help
          .title
      )
    ).toBeVisible();

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.identifier.errorpage.help.detailtext.replace(
          "<0>{{emailAddress}}</0>",
          ""
        )
      )
    ).toBeVisible();

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.identifier.errorpage.help
          .emailaddress
      )
    ).toBeVisible();

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.identifier.errorpage
          .addmember
      )
    ).toBeVisible();

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.identifier.errorpage
          .addmember
      )
    ).toBeVisible();
  });

  test("Scan", async () => {
    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByText } = render(
      <Provider store={storeMocked}>
        <ErrorPage
          pageId="feedback"
          activeStatus
          notificationDetails={notificationsFix[4]}
          onFinishSetup={jest.fn()}
          profile={profile}
          oobi="mockoobi"
          handleLeaveGroup={jest.fn()}
        />
      </Provider>
    );

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.identifier.errorpage
          .addmember
      )
    ).toBeVisible();

    fireEvent.click(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.identifier.errorpage
          .addmember
      )
    );

    await waitFor(() => {
      expect(connectByOobiUrlMock).toBeCalled();
      expect(dispatchMock).toBeCalledWith(
        setToastMsg(ToastMsgType.NEW_MULTI_SIGN_MEMBER)
      );
    });
  });

  test("Show continue setup screen", async () => {
    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };
    const finishSetup = jest.fn();

    const pendingGroupId = filteredIdentifierFix[6].id;
    const profile = {
      ...profileCacheFixData.profiles[pendingGroupId],
      multisigConnections: [...multisignConnections],
    };

    const { getByText } = render(
      <Provider store={storeMocked}>
        <ErrorPage
          pageId="feedback"
          activeStatus
          notificationDetails={notificationsFix[4]}
          onFinishSetup={finishSetup}
          profile={profile}
          oobi="mockoobi"
          handleLeaveGroup={jest.fn()}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.identifier.errorpage.member.replace(
            "{{member}}",
            "3"
          )
        )
      ).toBeVisible();
    });

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.identifier.errorpage
          .continuesetup
      )
    ).toBeVisible();

    fireEvent.click(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.identifier.errorpage
          .continuesetup
      )
    );

    await waitFor(() => {
      expect(finishSetup).toBeCalled();
    });
  });
});
