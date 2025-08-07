import { setToastMsg, showGenericError } from "../../store/reducers/stateCache";
import { ToastMsgType } from "../globals/types";
import { showError } from "./error";

describe("Show error", () => {
  const errorLogMock = jest.fn();
  const dispatch = jest.fn();

  beforeEach(() => {
    jest.spyOn(global.console, "error").mockImplementation(() => {
      errorLogMock();
    });
  });

  it("Show common error", () => {
    showError("class1", {}, dispatch);
    expect(errorLogMock).toBeCalled();
    expect(dispatch).toBeCalledWith(showGenericError(true));
  });

  it("Show error log and toast message", () => {
    const dispatchMock = jest.fn();
    showError("class1", {}, dispatchMock, ToastMsgType.UNKNOWN_ERROR);

    expect(errorLogMock).toBeCalled();
  });
});
