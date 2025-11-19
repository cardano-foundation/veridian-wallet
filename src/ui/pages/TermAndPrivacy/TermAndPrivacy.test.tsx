import { fireEvent, render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import ENG_trans from "../../../locales/en/en.json";
import { makeTestStore } from "../../utils/makeTestStore";
import { TermAndPrivacy } from "./TermAndPrivacy";

const MockTitle = "Terms of use";

describe("Terms and conditions screen", () => {
  test("Render", async () => {
    const dispatchMock = jest.fn();
    const storeMocked = {
      ...makeTestStore(),
      dispatch: dispatchMock,
    };

    const { getByTestId, getByText } = render(
      <MemoryRouter>
        <Provider store={storeMocked}>
          <TermAndPrivacy />
        </Provider>
      </MemoryRouter>
    );

    expect(getByTestId("term-n-privacy-content-page")).toBeVisible();
    expect(getByText(ENG_trans.termandprivacy.button)).toBeVisible();
    expect(getByText(ENG_trans.termandprivacy.tabs.privacy)).toBeVisible();
    expect(getByText(ENG_trans.termandprivacy.tabs.terms)).toBeVisible();

    fireEvent.click(getByText(ENG_trans.termandprivacy.button));

    expect(dispatchMock).toBeCalled();
  });
});
