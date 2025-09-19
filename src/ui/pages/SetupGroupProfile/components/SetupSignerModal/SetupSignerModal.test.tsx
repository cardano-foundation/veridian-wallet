import { fireEvent, render, waitFor } from "@testing-library/react";
import { forwardRef, useImperativeHandle } from "react";
import { Provider } from "react-redux";
import EN_TRANSLATIONS from "../../../../../locales/en/en.json";
import { makeTestStore } from "../../../../utils/makeTestStore";
import { SetupSignerModal } from "./SetupSignerModal";

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
  IonInput: forwardRef((props: any, ref: any) => {
    const { onIonBlur, onIonFocus, onIonInput, value } = props;
    const testId = props["data-testid"];

    useImperativeHandle(ref, () => ({
      setFocus: jest.fn(),
    }));

    return (
      <input
        ref={ref}
        value={value}
        data-testid={testId}
        onBlur={onIonBlur}
        onFocus={onIonFocus}
        onChange={onIonInput}
      />
    );
  }),
}));

describe("Setup signer modal", () => {
  test("Render modal", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={makeTestStore()}>
        <SetupSignerModal
          connectionsLength={2}
          isOpen
          setOpen={jest.fn}
          onSubmit={jest.fn}
          currentValue={{
            recoverySigners: 0,
            requiredSigners: 0,
          }}
        />
      </Provider>
    );

    expect(
      getByText(EN_TRANSLATIONS.setupgroupprofile.initgroup.setsigner.title)
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.setupgroupprofile.initgroup.setsigner.button.back
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.setupgroupprofile.initgroup.setsigner.button.confirm
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.setupgroupprofile.initgroup.setsigner.recoverysigners
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.setupgroupprofile.initgroup.setsigner
          .recoverysignershelptext
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.setupgroupprofile.initgroup.setsigner.requiredsigners
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.setupgroupprofile.initgroup.setsigner
          .requiredsignershelptext
      )
    ).toBeVisible();

    expect(getByTestId("threshold-recoverySigners")).toBeVisible();
    expect(getByTestId("threshold-requiredSigners")).toBeVisible();
    expect(
      getByTestId("recoverySigners-increase-threshold-button")
    ).toBeVisible();
    expect(
      getByTestId("requiredSigners-increase-threshold-button")
    ).toBeVisible();
    expect(
      getByTestId("recoverySigners-decrease-threshold-button")
    ).toBeVisible();
    expect(
      getByTestId("requiredSigners-decrease-threshold-button")
    ).toBeVisible();
  });

  test("Validate and submit modal", async () => {
    const submit = jest.fn();
    const { getByText, getByTestId, queryByText } = render(
      <Provider store={makeTestStore()}>
        <SetupSignerModal
          connectionsLength={2}
          isOpen
          setOpen={jest.fn}
          onSubmit={submit}
          currentValue={{
            recoverySigners: 0,
            requiredSigners: 0,
          }}
        />
      </Provider>
    );

    fireEvent.change(getByTestId("threshold-recoverySigners"), {
      target: { value: "3" },
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.setupgroupprofile.initgroup.setsigner.error.max
        )
      ).toBeVisible();
      expect(
        getByTestId("primary-button-setup-signer-modal").hasAttribute(
          "disabled"
        )
      ).toBe(true);
    });

    fireEvent.change(getByTestId("threshold-recoverySigners"), {
      target: { value: "0" },
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.setupgroupprofile.initgroup.setsigner.error.min
        )
      ).toBeVisible();
      expect(
        getByTestId("primary-button-setup-signer-modal").hasAttribute(
          "disabled"
        )
      ).toBe(true);
    });

    fireEvent.change(getByTestId("threshold-recoverySigners"), {
      target: { value: "1" },
    });

    await waitFor(() => {
      expect(
        queryByText(
          EN_TRANSLATIONS.setupgroupprofile.initgroup.setsigner.error.max
        )
      ).toBeNull();
      expect(
        queryByText(
          EN_TRANSLATIONS.setupgroupprofile.initgroup.setsigner.error.min
        )
      ).toBeNull();
    });

    fireEvent.change(getByTestId("threshold-requiredSigners"), {
      target: { value: "3" },
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.setupgroupprofile.initgroup.setsigner.error.max
        )
      ).toBeVisible();
      expect(
        getByTestId("primary-button-setup-signer-modal").hasAttribute(
          "disabled"
        )
      ).toBe(true);
    });

    fireEvent.change(getByTestId("threshold-requiredSigners"), {
      target: { value: "0" },
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.setupgroupprofile.initgroup.setsigner.error.min
        )
      ).toBeVisible();
      expect(
        getByTestId("primary-button-setup-signer-modal").hasAttribute(
          "disabled"
        )
      ).toBe(true);
    });

    fireEvent.change(getByTestId("threshold-requiredSigners"), {
      target: { value: "1" },
    });
    await waitFor(() => {
      expect(
        queryByText(
          EN_TRANSLATIONS.setupgroupprofile.initgroup.setsigner.error.max
        )
      ).toBeNull();
      expect(
        queryByText(
          EN_TRANSLATIONS.setupgroupprofile.initgroup.setsigner.error.min
        )
      ).toBeNull();
    });

    fireEvent.click(getByTestId("primary-button-setup-signer-modal"));

    expect(submit).toBeCalledWith({
      recoverySigners: 1,
      requiredSigners: 1,
    });

    fireEvent.click(getByTestId("requiredSigners-increase-threshold-button"));
    await waitFor(() => {
      expect(
        (getByTestId("threshold-requiredSigners") as HTMLInputElement).value
      ).toBe("2");
    });

    fireEvent.click(getByTestId("requiredSigners-increase-threshold-button"));
    await waitFor(() => {
      expect(
        (getByTestId("threshold-requiredSigners") as HTMLInputElement).value
      ).toBe("2");
    });

    fireEvent.click(getByTestId("requiredSigners-decrease-threshold-button"));
    await waitFor(() => {
      expect(
        (getByTestId("threshold-requiredSigners") as HTMLInputElement).value
      ).toBe("1");
    });

    fireEvent.click(getByTestId("requiredSigners-decrease-threshold-button"));
    await waitFor(() => {
      expect(
        (getByTestId("threshold-requiredSigners") as HTMLInputElement).value
      ).toBe("1");
    });

    fireEvent.click(getByTestId("recoverySigners-increase-threshold-button"));
    await waitFor(() => {
      expect(
        (getByTestId("threshold-recoverySigners") as HTMLInputElement).value
      ).toBe("2");
    });

    fireEvent.click(getByTestId("recoverySigners-decrease-threshold-button"));
    await waitFor(() => {
      expect(
        (getByTestId("threshold-recoverySigners") as HTMLInputElement).value
      ).toBe("1");
    });
  });
});
