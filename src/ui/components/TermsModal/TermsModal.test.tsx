import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import { makeTestStore } from "../../utils/makeTestStore";
import { TermsModal } from "./TermsModal";

jest.mock("i18next", () => ({
  ...jest.requireActual("i18next"),
  t: jest.fn((name: string) => {
    if (name === "termsofuse")
      return {
        sections: [
          {
            title: "Term of use",
            content: [
              {
                subtitle: "Subtitle",
                text: "text",
              },
            ],
            componentId: "term",
          },
        ],
      };

    return "result";
  }),
}));

describe("Terms and conditions screen", () => {
  test("User can close the modal by clicking on the backdrop", async () => {
    const storeMocked = makeTestStore();

    const mockSetIsOpen = jest.fn();
    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <TermsModal
          name="terms-of-use"
          isOpen={true}
          setIsOpen={mockSetIsOpen}
          altIsOpen={mockSetIsOpen}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("terms-of-use-modal")).toBeVisible();
    });

    const backdrop = document.querySelector("ion-backdrop");
    act(() => {
      backdrop && fireEvent.click(backdrop);
    });

    await waitFor(() => {
      expect(backdrop).not.toBeInTheDocument();
    });
  });
});
