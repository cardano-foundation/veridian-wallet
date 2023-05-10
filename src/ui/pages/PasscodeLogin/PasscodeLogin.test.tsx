import { MemoryRouter, Route } from "react-router-dom";
import { fireEvent, render } from "@testing-library/react";
import { Provider } from "react-redux";
import { PasscodeLogin } from "./PasscodeLogin";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { PASSCODE_LOGIN_ROUTE, SET_PASSCODE_ROUTE } from "../../../routes";
import { SetPasscode } from "../SetPasscode";
import { store } from "../../../store";

describe("Passcode Login Page", () => {
  test("Renders Passcode Login page with title and description", () => {
    const { getByText } = render(
      <Provider store={store}>
        <PasscodeLogin />
      </Provider>
    );
    expect(
      getByText(EN_TRANSLATIONS["passcodelogin.title"])
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS["passcodelogin.description"])
    ).toBeInTheDocument();
  });

  test("The user can add and remove digits from the passcode", () => {
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <PasscodeLogin />
      </Provider>
    );
    fireEvent.click(getByText(/1/));
    const circleElement = getByTestId("circle-0");
    expect(circleElement.classList).toContain("circle-fill");
    const backspaceButton = getByTestId("setpasscode-backspace-button");
    fireEvent.click(backspaceButton);
    expect(circleElement.classList).not.toContain("circle-fill");
  });

  test("If no seed phrase was stored and I click on I forgot my passcode, I can start over", async () => {
    const { getByText, findByText } = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[PASSCODE_LOGIN_ROUTE]}>
          <Route
            path={PASSCODE_LOGIN_ROUTE}
            component={PasscodeLogin}
          />
          <Route
            path={SET_PASSCODE_ROUTE}
            component={SetPasscode}
          />
        </MemoryRouter>
      </Provider>
    );
    fireEvent.click(getByText(/1/));
    fireEvent.click(getByText(/2/));
    fireEvent.click(getByText(/3/));
    fireEvent.click(getByText(/4/));
    fireEvent.click(getByText(/5/));
    fireEvent.click(getByText(/6/));
    expect(
      await findByText(EN_TRANSLATIONS["passcodelogin.error"])
    ).toBeVisible();
    fireEvent.click(
      getByText(EN_TRANSLATIONS["passcodelogin.forgotten.button"])
    );
    expect(
      await findByText(EN_TRANSLATIONS["passcodelogin.alert.text.restart"])
    ).toBeVisible();
    fireEvent.click(
      getByText(EN_TRANSLATIONS["passcodelogin.alert.button.restart"])
    );
    expect(
      await findByText(EN_TRANSLATIONS["setpasscode.enterpasscode.title"])
    ).toBeVisible();
  });

  // TODO: There is not passcode set yet, we dont know what is the next page bc this is dynamic.
  /*test("should log in user on correct passcode and redirect to generate seed phrase page", async () => {


    jest.mock("./PasscodeLogin", () => {
      const originalModule = jest.requireActual("./PasscodeLogin");
      return {
        ...originalModule,
        verifyPasscode: jest.fn(() => true),
      };
    });

    const { getByText, findByText } = render(
        <Provider store={store}>
          <MemoryRouter initialEntries={[PASSCODE_LOGIN_ROUTE, GENERATE_SEED_PHRASE_ROUTE]}>
            <Route
                path={PASSCODE_LOGIN_ROUTE}
                component={PasscodeLogin}
            />
            <Route
                path={GENERATE_SEED_PHRASE_ROUTE}
                component={GenerateSeedPhrase}
            />
          </MemoryRouter>
        </Provider>
    );

    fireEvent.click(getByText(/1/));
    fireEvent.click(getByText(/1/));
    fireEvent.click(getByText(/1/));
    fireEvent.click(getByText(/1/));
    fireEvent.click(getByText(/1/));
    fireEvent.click(getByText(/1/));


    expect(
        await findByText(EN_TRANSLATIONS["generateseedphrase.title"])
    ).toBeVisible();


  });*/
});
