import { AnyAction, Store } from "@reduxjs/toolkit";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { act } from "react";
import { GenericError } from "./GenericError";
import TRANSLATIONS from "../../../locales/en/en.json";
import { showGenericError } from "../../../store/reducers/stateCache";
import { makeTestStore } from "../../utils/makeTestStore";
import { loggingConfig } from "../../../utils/logger/LoggingConfig";
import { logSyncService } from "../../../core/services/LogSyncService";

jest.mock("../../../utils/logger/LoggingConfig", () => ({
  loggingConfig: {
    remoteEnabled: false,
  },
}));

jest.mock("../../../core/services/LogSyncService", () => ({
  logSyncService: {
    syncLogs: jest.fn(),
  },
}));

const dispatchMock = jest.fn();

describe("GenericError component", () => {
  let mockedStore: Store<unknown, AnyAction>;

  beforeEach(() => {
    jest.resetAllMocks();
    const initialState = {
      stateCache: {
        showGenericError: true,
      },
    };
    mockedStore = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    // Reset loggingConfig.remoteEnabled for each test
    (loggingConfig as any).remoteEnabled = false;
  });

  afterEach(() => {
    // Clean up ion-alert elements from the body
    document.body.querySelectorAll("ion-alert").forEach(alert => {
      alert.remove();
    });
  });

  test("renders with default message and single button when remote logging is disabled", async () => {
    const { getByText, queryByText } = render(
      <Provider store={mockedStore}>
        <GenericError />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText(TRANSLATIONS.genericerror.text)).toBeInTheDocument();
      expect(getByText(TRANSLATIONS.genericerror.button)).toBeInTheDocument();
      expect(queryByText(TRANSLATIONS.genericerror.sharelogsbutton)).not.toBeInTheDocument();
      expect(queryByText(TRANSLATIONS.genericerror.dismissbutton)).not.toBeInTheDocument();
    });

    act(() => {
      fireEvent.click(getByText(TRANSLATIONS.genericerror.button));
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(showGenericError(false));
    });
  });

  test("renders with logs message and Share information button when remote logging is enabled", async () => {
    (loggingConfig as any).remoteEnabled = true;

    const { getByText } = render(
      <Provider store={mockedStore}>
        <GenericError />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText(TRANSLATIONS.genericerror.logstext)).toBeInTheDocument();
      expect(getByText(TRANSLATIONS.genericerror.sharelogsbutton)).toBeInTheDocument();
      expect(getByText(TRANSLATIONS.genericerror.dismissbutton)).toBeInTheDocument();
    });

    // Test clicking the Share information button
    act(() => {
      fireEvent.click(getByText(TRANSLATIONS.genericerror.sharelogsbutton));
    });

    await waitFor(() => {
      expect(logSyncService.syncLogs).toHaveBeenCalledTimes(1);
      expect(dispatchMock).toBeCalledWith(showGenericError(false));
    });
  });

  test("renders with logs message and Dismiss button when remote logging is enabled", async () => {
    (loggingConfig as any).remoteEnabled = true;

    const { getByText } = render(
      <Provider store={mockedStore}>
        <GenericError />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText(TRANSLATIONS.genericerror.logstext)).toBeInTheDocument();
      expect(getByText(TRANSLATIONS.genericerror.sharelogsbutton)).toBeInTheDocument();
      expect(getByText(TRANSLATIONS.genericerror.dismissbutton)).toBeInTheDocument();
    });

    // Test clicking the Dismiss button
    act(() => {
      fireEvent.click(getByText(TRANSLATIONS.genericerror.dismissbutton));
    });

    await waitFor(() => {
      expect(logSyncService.syncLogs).not.toHaveBeenCalled();
      expect(dispatchMock).toBeCalledWith(showGenericError(false));
    });
  });
});
