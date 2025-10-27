import { setToastMsg, showGenericError } from "../../store/reducers/stateCache";
import { ToastMsgType } from "../globals/types";
import { showError } from "./error";
import { logger } from "../../utils/logger/Logger";

jest.mock("../../utils/logger/Logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe("Show error", () => {
  const dispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Show common error", () => {
    showError("class1", {}, dispatch);
    expect(logger.error).toBeCalled();
    expect(dispatch).toBeCalledWith(showGenericError(true));
  });

  it("Show error log and toast message", () => {
    const dispatchMock = jest.fn();
    showError("class1", {}, dispatchMock, ToastMsgType.UNKNOWN_ERROR);

    expect(logger.error).toBeCalled();
    expect(dispatchMock).toBeCalledWith(setToastMsg(ToastMsgType.UNKNOWN_ERROR));
  });
});
