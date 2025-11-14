const bootAndConnectMock = jest.fn();
const recoverKeriaAgentMock = jest.fn(() => Promise.resolve());
const basicStorageDeleteMock = jest.fn(() => Promise.resolve());
const createOrUpdateBasicRecordMock = jest.fn(() => Promise.resolve());
const browserMock = jest.fn();
const checkPermisson = jest.fn(() =>
  Promise.resolve({
    camera: "granted",
  })
);
const requestPermission = jest.fn();
const startScan = jest.fn();
const stopScan = jest.fn();
const discoverConnectUrlMock = jest.fn();

import {
  BarcodeFormat,
  BarcodesScannedEvent,
  BarcodeValueType,
} from "@capacitor-mlkit/barcode-scanning";
import { IonButton, IonIcon, IonInput, IonLabel } from "@ionic/react";
import { IonReactMemoryRouter } from "@ionic/react-router";
import {
  fireEvent,
  render,
  RenderResult,
  waitFor,
} from "@testing-library/react";
import { createMemoryHistory } from "history";
import { act } from "react";
import { Provider } from "react-redux";
import { Route } from "react-router-dom";
import { Agent } from "../../../core/agent/agent";
import { MiscRecordId } from "../../../core/agent/agent.types";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { RoutePath } from "../../../routes";
import { TabsRoutePath } from "../../../routes/paths";
import { setToastMsg } from "../../../store/reducers/stateCache";
import { CustomInputProps } from "../../components/CustomInput/CustomInput.types";
import { ToastMsgType } from "../../globals/types";
import { makeTestStore } from "../../utils/makeTestStore";
import { Credentials } from "../Credentials";
import { ProfileSetup } from "../ProfileSetup";
import { CreateSSIAgent } from "./CreateSSIAgent";

const bootUrl =
  "https://dev.keria-boot.cf-keripy.metadata.dev.cf-deployments.org";
const connectUrl =
  "https://dev.keria.cf-keripy.metadata.dev.cf-deployments.org";

const barcodes = [
  {
    displayValue: bootUrl,
    format: BarcodeFormat.QrCode,
    rawValue: bootUrl,
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

const isNativePlatformMock = jest.fn(() => true);
jest.mock("@capacitor/core", () => {
  return {
    ...jest.requireActual("@capacitor/core"),
    Capacitor: {
      isNativePlatform: () => isNativePlatformMock(),
    },
  };
});

jest.mock("../../../core/agent/agent", () => ({
  ...jest.requireActual("../../../core/agent/agent"),
  Agent: {
    ...jest.requireActual("../../../core/agent/agent").Agent,
    agent: {
      bootAndConnect: bootAndConnectMock,
      recoverKeriaAgent: recoverKeriaAgentMock,
      discoverConnectUrl: discoverConnectUrlMock,
      basicStorage: {
        deleteById: basicStorageDeleteMock,
        createOrUpdateBasicRecord: createOrUpdateBasicRecordMock,
      },
    },
  },
}));

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  isPlatform: () => true,
  getPlatforms: () => getPlatformMock(),
  IonModal: ({ children, ...props }: any) => {
    const testId = props["data-testid"];
    return props.isOpen ? <div data-testid={testId}>{children}</div> : null;
  },
}));

jest.mock("@capacitor/browser", () => ({
  ...jest.requireActual("@capacitor/browser"),
  Browser: {
    open: browserMock,
  },
}));

jest.mock("../../components/CustomInput", () => ({
  CustomInput: (props: CustomInputProps) => {
    return (
      <>
        <IonLabel
          position="stacked"
          data-testid={`${props.title?.toLowerCase().replace(" ", "-")}-title`}
        >
          {props.title}
          {props.optional && (
            <span className="custom-input-optional">(optional)</span>
          )}
        </IonLabel>
        <IonInput
          data-testid={props.dataTestId}
          onIonInput={(e) => {
            props.onChangeInput(e.detail.value as string);
          }}
          onIonFocus={() => props.onChangeFocus?.(true)}
          onIonBlur={() => props.onChangeFocus?.(false)}
          value={props.value}
        />
        {props.action && props.actionIcon && (
          <IonButton
            shape="round"
            data-testid={`${props.dataTestId}-action`}
            onClick={(e) => {
              props.action?.(e);
            }}
          >
            <IonIcon
              slot="icon-only"
              icon={props.actionIcon}
              color="primary"
            />
          </IonButton>
        )}
      </>
    );
  },
}));

describe("SSI agent page", () => {
  const dispatchMock = jest.fn();
  const initialState = {
    stateCache: {
      routes: [],
      authentication: {
        loggedIn: true,
        time: Date.now(),
        passcodeIsSet: true,
        recoveryWalletProgress: false,
      },
    },
  };

  const storeMocked = {
    ...makeTestStore(initialState),
    dispatch: dispatchMock,
  };

  beforeEach(() => {
    discoverConnectUrlMock.mockImplementation(() =>
      Promise.resolve(connectUrl)
    );
  });

  describe("SSI connect summary", () => {
    test("Render", async () => {
      const { getByText } = render(
        <Provider store={storeMocked}>
          <CreateSSIAgent />
        </Provider>
      );

      expect(getByText(EN_TRANSLATIONS.ssiagent.connect.title)).toBeVisible();
      expect(
        getByText(EN_TRANSLATIONS.ssiagent.connect.description)
      ).toBeVisible();
      expect(
        getByText(EN_TRANSLATIONS.ssiagent.connect.seconddescription)
      ).toBeVisible();
      expect(
        getByText(EN_TRANSLATIONS.ssiagent.connect.bottomdescription)
      ).toBeVisible();
      expect(
        getByText(EN_TRANSLATIONS.ssiagent.connect.buttons.connected)
      ).toBeVisible();
      expect(
        getByText(
          EN_TRANSLATIONS.ssiagent.connect.buttons.onboardingdocumentation
        )
      ).toBeVisible();

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.connect.buttons.connected)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.advancedsetup)
        ).toBeVisible();
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.entermanual)
        ).toBeVisible();
      });
    });

    test("Open document", async () => {
      const { getByText } = render(
        <Provider store={storeMocked}>
          <CreateSSIAgent />
        </Provider>
      );

      expect(
        getByText(
          EN_TRANSLATIONS.ssiagent.connect.buttons.onboardingdocumentation
        )
      ).toBeVisible();

      fireEvent.click(
        getByText(
          EN_TRANSLATIONS.ssiagent.connect.buttons.onboardingdocumentation
        )
      );

      await waitFor(() => {
        expect(browserMock).toBeCalled();
      });
    });
  });

  describe("Scan", () => {
    test("SSI boot url with scanner", async () => {
      const barcodes = [
        {
          displayValue: bootUrl,
          format: BarcodeFormat.QrCode,
          rawValue: bootUrl,
          valueType: BarcodeValueType.Url,
        },
      ];

      addListener.mockImplementation(
        (
          eventName: string,
          listenerFunc: (result: BarcodesScannedEvent) => void
        ) => {
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

      const history = createMemoryHistory();
      const { getByText } = render(
        <IonReactMemoryRouter history={history}>
          <Provider store={storeMocked}>
            <CreateSSIAgent />
          </Provider>
        </IonReactMemoryRouter>
      );

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.connect.buttons.connected)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.advancedsetup)
        ).toBeVisible();
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.entermanual)
        ).toBeVisible();
      });

      await waitFor(() => {
        expect(bootAndConnectMock).toBeCalledWith(bootUrl);
      });
    });

    test("SSI boot url with manual modal", async () => {
      addListener.mockImplementation(
        (
          eventName: string,
          listenerFunc: (result: BarcodesScannedEvent) => void
        ) => {
          return {
            remove: jest.fn(),
          };
        }
      );

      const history = createMemoryHistory();

      const { getByText, getByTestId } = render(
        <IonReactMemoryRouter history={history}>
          <Provider store={storeMocked}>
            <CreateSSIAgent />
          </Provider>
        </IonReactMemoryRouter>
      );

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.connect.buttons.connected)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.advancedsetup)
        ).toBeVisible();
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.entermanual)
        ).toBeVisible();
      });

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.entermanual)
      );

      await waitFor(() => {
        expect(getByTestId("ssi-agent-scan-input-modal")).toBeVisible();
      });

      fireEvent(
        getByTestId("ssi-agent-scan-input"),
        new CustomEvent("ionInput", {
          detail: {
            value: bootUrl,
          },
        })
      );

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.modal.confirm)
      );

      await waitFor(() => {
        expect(bootAndConnectMock).toBeCalledWith(bootUrl);
      });
    });

    test("Show a toast error when discovery connect URL fails", async () => {
      addListener.mockImplementation(
        (
          eventName: string,
          listenerFunc: (result: BarcodesScannedEvent) => void
        ) => {
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

      bootAndConnectMock.mockImplementation(() => {
        return Promise.reject(new Error(Agent.CONNECT_URL_DISCOVERY_FAILED));
      });

      const history = createMemoryHistory();

      const { getByText } = render(
        <IonReactMemoryRouter history={history}>
          <Provider store={storeMocked}>
            <CreateSSIAgent />
          </Provider>
        </IonReactMemoryRouter>
      );

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.connect.buttons.connected)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.advancedsetup)
        ).toBeVisible();
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.entermanual)
        ).toBeVisible();
      });

      await waitFor(() => {
        expect(bootAndConnectMock).toBeCalledWith(bootUrl);
      });

      await waitFor(() => {
        expect(dispatchMock).toBeCalledWith(
          setToastMsg(ToastMsgType.CONNECT_URL_DISCOVER_ERROR)
        );
      });
    });

    test("Show a toast error when the connect url cannot be found", async () => {
      addListener.mockImplementation(
        (
          eventName: string,
          listenerFunc: (result: BarcodesScannedEvent) => void
        ) => {
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

      bootAndConnectMock.mockImplementation(() => {
        return Promise.reject(new Error(Agent.CONNECT_URL_NOT_FOUND));
      });

      const history = createMemoryHistory();

      const { getByText } = render(
        <IonReactMemoryRouter history={history}>
          <Provider store={storeMocked}>
            <CreateSSIAgent />
          </Provider>
        </IonReactMemoryRouter>
      );

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.connect.buttons.connected)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.advancedsetup)
        ).toBeVisible();
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.entermanual)
        ).toBeVisible();
      });

      await waitFor(() => {
        expect(bootAndConnectMock).toBeCalledWith(bootUrl);
      });

      await waitFor(() => {
        expect(dispatchMock).toBeCalledWith(
          setToastMsg(ToastMsgType.FIND_CONNECT_URL_ERROR)
        );
      });
    });

    test("Show a toast error when the boot url cannot be booted", async () => {
      addListener.mockImplementation(
        (
          eventName: string,
          listenerFunc: (result: BarcodesScannedEvent) => void
        ) => {
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

      bootAndConnectMock.mockImplementation(() => {
        return Promise.reject(new Error(Agent.KERIA_BOOT_FAILED));
      });

      const history = createMemoryHistory();

      const { getByText } = render(
        <IonReactMemoryRouter history={history}>
          <Provider store={storeMocked}>
            <CreateSSIAgent />
          </Provider>
        </IonReactMemoryRouter>
      );

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.connect.buttons.connected)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.advancedsetup)
        ).toBeVisible();
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.entermanual)
        ).toBeVisible();
      });

      await waitFor(() => {
        expect(bootAndConnectMock).toBeCalledWith(bootUrl);
      });

      await waitFor(() => {
        expect(dispatchMock).toBeCalledWith(
          setToastMsg(ToastMsgType.INVALID_BOOT_URL)
        );
      });
    });

    test("Show a toast error when the connect url cannot be booted", async () => {
      addListener.mockImplementation(
        (
          eventName: string,
          listenerFunc: (result: BarcodesScannedEvent) => void
        ) => {
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

      bootAndConnectMock.mockImplementation(() => {
        return Promise.reject(
          new Error(Agent.KERIA_BOOTED_ALREADY_BUT_CANNOT_CONNECT)
        );
      });

      const history = createMemoryHistory();

      const { getByText } = render(
        <IonReactMemoryRouter history={history}>
          <Provider store={storeMocked}>
            <CreateSSIAgent />
          </Provider>
        </IonReactMemoryRouter>
      );

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.connect.buttons.connected)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.advancedsetup)
        ).toBeVisible();
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.entermanual)
        ).toBeVisible();
      });

      await waitFor(() => {
        expect(bootAndConnectMock).toBeCalledWith(bootUrl);
      });

      await waitFor(() => {
        expect(dispatchMock).toBeCalledWith(
          setToastMsg(ToastMsgType.INVALID_CONNECT_URL)
        );
      });
    });

    test("Show a toast error when an unknown error is thrown.", async () => {
      addListener.mockImplementation(
        (
          eventName: string,
          listenerFunc: (result: BarcodesScannedEvent) => void
        ) => {
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

      bootAndConnectMock.mockImplementation(() => {
        return Promise.reject(
          new Error(Agent.KERIA_BOOTED_ALREADY_BUT_CANNOT_CONNECT)
        );
      });

      const history = createMemoryHistory();

      const { getByText } = render(
        <IonReactMemoryRouter history={history}>
          <Provider store={storeMocked}>
            <CreateSSIAgent />
          </Provider>
        </IonReactMemoryRouter>
      );

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.connect.buttons.connected)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.advancedsetup)
        ).toBeVisible();
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.entermanual)
        ).toBeVisible();
      });

      await waitFor(() => {
        expect(bootAndConnectMock).toBeCalledWith(bootUrl);
      });

      await waitFor(() => {
        expect(dispatchMock).toBeCalledWith(
          setToastMsg(ToastMsgType.INVALID_CONNECT_URL)
        );
      });
    });
  });

  describe("Scan: recovery", () => {
    const dispatchMock = jest.fn();
    const initialState = {
      stateCache: {
        routes: [],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          recoveryWalletProgress: true,
        },
      },
      seedPhraseCache: {
        seedPhrase: "seedphrase seedphrase",
      },
    };

    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    test("SSI boot url with scanner", async () => {
      const barcodes = [
        {
          displayValue: bootUrl,
          format: BarcodeFormat.QrCode,
          rawValue: bootUrl,
          valueType: BarcodeValueType.Url,
        },
      ];

      addListener.mockImplementation(
        (
          eventName: string,
          listenerFunc: (result: BarcodesScannedEvent) => void
        ) => {
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

      discoverConnectUrlMock.mockImplementation(() =>
        Promise.resolve(connectUrl)
      );

      const history = createMemoryHistory();
      const { getByText, queryByText } = render(
        <IonReactMemoryRouter history={history}>
          <Provider store={storeMocked}>
            <CreateSSIAgent />
          </Provider>
        </IonReactMemoryRouter>
      );

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.connect.buttons.connected)
      );

      await waitFor(() => {
        expect(
          queryByText(
            EN_TRANSLATIONS.ssiagent.scanssi.scan.button.advancedsetup
          )
        ).toBe(null);
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.entermanual)
        ).toBeVisible;
      });

      await waitFor(() => {
        expect(recoverKeriaAgentMock).toBeCalledWith(
          initialState.seedPhraseCache.seedPhrase.split(" "),
          connectUrl
        );
      });
    });

    test("SSI boot url with manual modal", async () => {
      addListener.mockImplementation(
        (
          eventName: string,
          listenerFunc: (result: BarcodesScannedEvent) => void
        ) => {
          return {
            remove: jest.fn(),
          };
        }
      );

      discoverConnectUrlMock.mockImplementation(() =>
        Promise.resolve(connectUrl)
      );

      const history = createMemoryHistory();
      const { getByText, getByTestId } = render(
        <IonReactMemoryRouter history={history}>
          <Provider store={storeMocked}>
            <CreateSSIAgent />
          </Provider>
        </IonReactMemoryRouter>
      );

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.connect.buttons.connected)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.entermanual)
        ).toBeVisible();
      });

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.entermanual)
      );

      await waitFor(() => {
        expect(getByTestId("ssi-agent-scan-input-modal")).toBeVisible();
      });

      fireEvent(
        getByTestId("ssi-agent-scan-input"),
        new CustomEvent("ionInput", {
          detail: {
            value: bootUrl,
          },
        })
      );

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.modal.confirm)
      );

      await waitFor(() => {
        expect(recoverKeriaAgentMock).toBeCalledWith(
          initialState.seedPhraseCache.seedPhrase.split(" "),
          connectUrl
        );
      });
    });

    test("recovery with input url when failed to search connect url", async () => {
      addListener.mockImplementation(
        (
          eventName: string,
          listenerFunc: (result: BarcodesScannedEvent) => void
        ) => {
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

      discoverConnectUrlMock.mockImplementation(() => {
        return Promise.reject(new Error(Agent.CONNECT_URL_DISCOVERY_FAILED));
      });

      const history = createMemoryHistory();

      const { getByText } = render(
        <IonReactMemoryRouter history={history}>
          <Provider store={storeMocked}>
            <CreateSSIAgent />
          </Provider>
        </IonReactMemoryRouter>
      );

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.connect.buttons.connected)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.entermanual)
        ).toBeVisible();
      });

      await waitFor(() => {
        expect(recoverKeriaAgentMock).toBeCalledWith(
          initialState.seedPhraseCache.seedPhrase.split(" "),
          bootUrl
        );
      });
    });

    test("Show a toast error when the input url isn't boot and connect url", async () => {
      addListener.mockImplementation(
        (
          eventName: string,
          listenerFunc: (result: BarcodesScannedEvent) => void
        ) => {
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

      discoverConnectUrlMock.mockImplementation(() => {
        return Promise.reject(new Error("error"));
      });

      const history = createMemoryHistory();

      const { getByText } = render(
        <IonReactMemoryRouter history={history}>
          <Provider store={storeMocked}>
            <CreateSSIAgent />
          </Provider>
        </IonReactMemoryRouter>
      );

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.connect.buttons.connected)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.entermanual)
        ).toBeVisible();
      });

      await waitFor(() => {
        expect(dispatchMock).toBeCalledWith(
          setToastMsg(ToastMsgType.INVALID_CONNECT_URL)
        );
      });
    });
  });

  describe("Advanced settings", () => {
    async function inputValue(
      getByTestId: RenderResult["getByTestId"],
      bootUrl?: string,
      connect?: string
    ) {
      if (bootUrl) {
        act(() => {
          fireEvent(
            getByTestId("boot-url-input"),
            new CustomEvent("ionInput", {
              detail: {
                value: bootUrl,
              },
            })
          );
        });

        await waitFor(() => {
          expect(
            (getByTestId("boot-url-input") as HTMLInputElement).value
          ).toBe(bootUrl);
        });
      }

      if (connectUrl) {
        act(() => {
          fireEvent(
            getByTestId("connect-url-input"),
            new CustomEvent("ionInput", {
              detail: {
                value: connect,
              },
            })
          );
        });

        await waitFor(() => {
          expect(
            (getByTestId("connect-url-input") as HTMLInputElement).value
          ).toBe(connect);
        });
      }
    }

    test("Render", async () => {
      addListener.mockImplementation(
        (
          eventName: string,
          listenerFunc: (result: BarcodesScannedEvent) => void
        ) => {
          return {
            remove: jest.fn(),
          };
        }
      );

      const history = createMemoryHistory();

      const { getByText, getByTestId } = render(
        <IonReactMemoryRouter history={history}>
          <Provider store={storeMocked}>
            <CreateSSIAgent />
          </Provider>
        </IonReactMemoryRouter>
      );

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.connect.buttons.connected)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.advancedsetup)
        ).toBeVisible();
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.entermanual)
        ).toBeVisible();
      });

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.advancedsetup)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.advancedsetup.title)
        ).toBeVisible();
      });

      expect(
        getByText(
          EN_TRANSLATIONS.ssiagent.advancedsetup.description.connectboot
        )
      ).toBeVisible();

      expect(
        getByText(EN_TRANSLATIONS.ssiagent.advancedsetup.input.boot.label)
      ).toBeVisible();

      expect(
        getByText(EN_TRANSLATIONS.ssiagent.advancedsetup.input.connect.label)
      ).toBeVisible();

      expect(
        getByText(EN_TRANSLATIONS.ssiagent.advancedsetup.buttons.connect)
      ).toBeVisible();
    });

    test("Show an error when the input contains invalid url", async () => {
      addListener.mockImplementation(
        (
          eventName: string,
          listenerFunc: (result: BarcodesScannedEvent) => void
        ) => {
          return {
            remove: jest.fn(),
          };
        }
      );

      const history = createMemoryHistory();

      const { getByText, getByTestId, getAllByText } = render(
        <IonReactMemoryRouter history={history}>
          <Provider store={storeMocked}>
            <CreateSSIAgent />
          </Provider>
        </IonReactMemoryRouter>
      );

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.connect.buttons.connected)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.advancedsetup)
        ).toBeVisible();
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.entermanual)
        ).toBeVisible();
      });

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.advancedsetup)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.advancedsetup.title)
        ).toBeVisible();
      });

      expect(
        getByText(EN_TRANSLATIONS.ssiagent.advancedsetup.input.boot.label)
      ).toBeVisible();

      expect(
        getByText(EN_TRANSLATIONS.ssiagent.advancedsetup.input.connect.label)
      ).toBeVisible();

      act(() => {
        fireEvent(
          getByTestId("boot-url-input"),
          new CustomEvent("ionInput", { detail: { value: "11111" } })
        );
      });

      await waitFor(() => {
        expect((getByTestId("boot-url-input") as HTMLInputElement).value).toBe(
          "11111"
        );
      });

      act(() => {
        fireEvent(getByTestId("boot-url-input"), new CustomEvent("ionFocus"));
      });

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.error.invalidbooturl)
        ).toBeVisible();
      });

      act(() => {
        fireEvent(
          getByTestId("boot-url-input"),
          new CustomEvent("ionInput", { detail: { value: "" } })
        );
      });

      await waitFor(() => {
        expect((getByTestId("boot-url-input") as HTMLInputElement).value).toBe(
          ""
        );
      });

      act(() => {
        fireEvent(
          getByTestId("connect-url-input"),
          new CustomEvent("ionInput", { detail: { value: "11111" } })
        );
      });

      await waitFor(() => {
        expect(
          (getByTestId("connect-url-input") as HTMLInputElement).value
        ).toBe("11111");
      });

      act(() => {
        fireEvent(
          getByTestId("connect-url-input"),
          new CustomEvent("ionFocus")
        );
      });

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.error.invalidconnecturl)
        ).toBeVisible();
      });

      act(() => {
        fireEvent(
          getByTestId("boot-url-input"),
          new CustomEvent("ionInput", { detail: { value: "11111" } })
        );
      });

      await waitFor(() => {
        expect((getByTestId("boot-url-input") as HTMLInputElement).value).toBe(
          "11111"
        );
      });

      act(() => {
        fireEvent(
          getByTestId("connect-url-input"),
          new CustomEvent("ionInput", { detail: { value: "11111" } })
        );
      });

      await waitFor(() => {
        expect(
          (getByTestId("connect-url-input") as HTMLInputElement).value
        ).toBe("11111");
      });

      act(() => {
        fireEvent(getByTestId("boot-url-input"), new CustomEvent("ionFocus"));
        fireEvent(
          getByTestId("connect-url-input"),
          new CustomEvent("ionFocus")
        );
      });

      await waitFor(() => {
        expect(
          getAllByText(EN_TRANSLATIONS.ssiagent.error.invalidurl).length
        ).toBe(2);
      });
    });

    test("Show an error when the boot url is invalid", async () => {
      addListener.mockImplementation(
        (
          eventName: string,
          listenerFunc: (result: BarcodesScannedEvent) => void
        ) => {
          return {
            remove: jest.fn(),
          };
        }
      );

      bootAndConnectMock.mockImplementation(() =>
        Promise.reject(new Error(Agent.KERIA_BOOT_FAILED))
      );

      const history = createMemoryHistory();

      const { getByText, getByTestId } = render(
        <IonReactMemoryRouter history={history}>
          <Provider store={storeMocked}>
            <CreateSSIAgent />
          </Provider>
        </IonReactMemoryRouter>
      );

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.connect.buttons.connected)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.advancedsetup)
        ).toBeVisible();
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.entermanual)
        ).toBeVisible();
      });

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.advancedsetup)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.advancedsetup.title)
        ).toBeVisible();
      });

      expect(
        getByText(EN_TRANSLATIONS.ssiagent.advancedsetup.input.boot.label)
      ).toBeVisible();

      expect(
        getByText(EN_TRANSLATIONS.ssiagent.advancedsetup.input.connect.label)
      ).toBeVisible();

      await inputValue(
        getByTestId,
        "https://dev.keria-boot.cf-keripy.metadata.dev.cf-deployments.org",
        "https://dev.keria.cf-keripy.metadata.dev.cf-deployments.org"
      );

      act(() => {
        fireEvent.click(getByTestId("primary-button-create-ssi-agent"));
      });

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.error.invalidbooturl)
        ).toBeVisible();
      });
    });

    test("Show an error when the connect url is invalid", async () => {
      addListener.mockImplementation(
        (
          eventName: string,
          listenerFunc: (result: BarcodesScannedEvent) => void
        ) => {
          return {
            remove: jest.fn(),
          };
        }
      );

      bootAndConnectMock.mockImplementation(() =>
        Promise.reject(new Error(Agent.KERIA_BOOTED_ALREADY_BUT_CANNOT_CONNECT))
      );

      const history = createMemoryHistory();

      const { getByText, getByTestId } = render(
        <IonReactMemoryRouter history={history}>
          <Provider store={storeMocked}>
            <CreateSSIAgent />
          </Provider>
        </IonReactMemoryRouter>
      );

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.connect.buttons.connected)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.advancedsetup)
        ).toBeVisible();
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.entermanual)
        ).toBeVisible();
      });

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.advancedsetup)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.advancedsetup.title)
        ).toBeVisible();
      });

      expect(
        getByText(EN_TRANSLATIONS.ssiagent.advancedsetup.input.boot.label)
      ).toBeVisible();

      expect(
        getByText(EN_TRANSLATIONS.ssiagent.advancedsetup.input.connect.label)
      ).toBeVisible();

      await inputValue(
        getByTestId,
        "https://dev.keria-boot.cf-keripy.metadata.dev.cf-deployments.org",
        "https://dev.keria.cf-keripy.metadata.dev.cf-deployments.org"
      );

      act(() => {
        fireEvent.click(getByTestId("primary-button-create-ssi-agent"));
      });

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.error.invalidconnecturl)
        ).toBeVisible();
      });
    });

    test("Show an error when mismatch url", async () => {
      addListener.mockImplementation(
        (
          eventName: string,
          listenerFunc: (result: BarcodesScannedEvent) => void
        ) => {
          return {
            remove: jest.fn(),
          };
        }
      );

      bootAndConnectMock.mockImplementation(() =>
        Promise.reject(new Error(Agent.KERIA_NOT_BOOTED))
      );

      const history = createMemoryHistory();

      const { getByText, getByTestId } = render(
        <IonReactMemoryRouter history={history}>
          <Provider store={storeMocked}>
            <CreateSSIAgent />
          </Provider>
        </IonReactMemoryRouter>
      );

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.connect.buttons.connected)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.advancedsetup)
        ).toBeVisible();
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.entermanual)
        ).toBeVisible();
      });

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.advancedsetup)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.advancedsetup.title)
        ).toBeVisible();
      });

      expect(
        getByText(EN_TRANSLATIONS.ssiagent.advancedsetup.input.boot.label)
      ).toBeVisible();

      expect(
        getByText(EN_TRANSLATIONS.ssiagent.advancedsetup.input.connect.label)
      ).toBeVisible();

      await inputValue(
        getByTestId,
        "https://dev.keria-boot.cf-keripy.metadata.dev.cf-deployments.org",
        "https://dev.keria.cf-keripy.metadata.dev.cf-deployments.org"
      );

      act(() => {
        fireEvent.click(getByTestId("primary-button-create-ssi-agent"));
      });

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.error.mismatchconnecturl)
        ).toBeVisible();
      });
    });

    test("Network error", async () => {
      addListener.mockImplementation(
        (
          eventName: string,
          listenerFunc: (result: BarcodesScannedEvent) => void
        ) => {
          return {
            remove: jest.fn(),
          };
        }
      );

      bootAndConnectMock.mockImplementation(() =>
        Promise.reject(new Error(Agent.KERIA_BOOT_FAILED_BAD_NETWORK))
      );

      discoverConnectUrlMock.mockClear();

      const history = createMemoryHistory();

      const { getByText, getByTestId } = render(
        <IonReactMemoryRouter history={history}>
          <Provider store={storeMocked}>
            <CreateSSIAgent />
          </Provider>
        </IonReactMemoryRouter>
      );

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.connect.buttons.connected)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.advancedsetup)
        ).toBeVisible();
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.entermanual)
        ).toBeVisible();
      });

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.advancedsetup)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.advancedsetup.title)
        ).toBeVisible();
      });

      expect(
        getByText(EN_TRANSLATIONS.ssiagent.advancedsetup.input.boot.label)
      ).toBeVisible();

      expect(
        getByText(EN_TRANSLATIONS.ssiagent.advancedsetup.input.connect.label)
      ).toBeVisible();

      await inputValue(
        getByTestId,
        "https://dev.keria-boot.cf-keripy.metadata.dev.cf-deployments.org",
        "https://dev.keria.cf-keripy.metadata.dev.cf-deployments.org"
      );

      act(() => {
        fireEvent.click(getByTestId("primary-button-create-ssi-agent"));
      });

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.error.unknownissue)
        ).toBeVisible();
      });
    });

    test("Connect success", async () => {
      addListener.mockImplementation(
        (
          eventName: string,
          listenerFunc: (result: BarcodesScannedEvent) => void
        ) => {
          return {
            remove: jest.fn(),
          };
        }
      );

      const history = createMemoryHistory();
      history.push(RoutePath.SSI_AGENT);

      bootAndConnectMock.mockImplementation(() => Promise.resolve());

      const { getByText, getByTestId, queryByText } = render(
        <IonReactMemoryRouter history={history}>
          <Provider store={storeMocked}>
            <Route
              component={CreateSSIAgent}
              path={RoutePath.SSI_AGENT}
            />
            <Route
              component={ProfileSetup}
              path={RoutePath.PROFILE_SETUP}
            />
            <Route
              component={Credentials}
              path={TabsRoutePath.CREDENTIALS}
            />
          </Provider>
        </IonReactMemoryRouter>
      );

      await waitFor(() => {
        expect(getByText(EN_TRANSLATIONS.ssiagent.connect.title)).toBeVisible();
      });

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.connect.buttons.connected)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.advancedsetup)
        ).toBeVisible();
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.entermanual)
        ).toBeVisible();
      });

      fireEvent.click(
        getByText(EN_TRANSLATIONS.ssiagent.scanssi.scan.button.advancedsetup)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.ssiagent.advancedsetup.title)
        ).toBeVisible();
      });

      expect(
        getByText(EN_TRANSLATIONS.ssiagent.advancedsetup.input.boot.label)
      ).toBeVisible();

      expect(
        getByText(EN_TRANSLATIONS.ssiagent.advancedsetup.input.connect.label)
      ).toBeVisible();

      await inputValue(
        getByTestId,
        "https://dev.keria-boot.cf-keripy.metadata.dev.cf-deployments.org",
        "https://dev.keria.cf-keripy.metadata.dev.cf-deployments.org"
      );

      act(() => {
        fireEvent.click(getByTestId("primary-button-create-ssi-agent"));
      });

      await waitFor(() => {
        expect(bootAndConnectMock).toBeCalledWith({
          bootUrl:
            "https://dev.keria-boot.cf-keripy.metadata.dev.cf-deployments.org",
          url: "https://dev.keria.cf-keripy.metadata.dev.cf-deployments.org",
        });
      });

      await waitFor(() => {
        expect(getByTestId("ssi-spinner-container")).toBeVisible();
      });

      await waitFor(() => {
        expect(createOrUpdateBasicRecordMock).toBeCalledWith(
          expect.objectContaining({
            id: MiscRecordId.IS_SETUP_PROFILE,
            content: { value: true },
          })
        );
      });

      await expect(() => {
        expect(
          getByText(EN_TRANSLATIONS.setupprofile.profiletype.title)
        ).toBeVisible();

        expect(
          queryByText(EN_TRANSLATIONS.tabs.credentials.tab.title)
        ).toBeNull();
      });
    });
  });
});
