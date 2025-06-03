import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import Eng_trans from "../../../../locales/en/en.json";
import { store } from "../../../../store";
import { CardDetailsAttribute } from "./CardDetailsAttribute";

describe("CardDetailsAttribute", () => {
  test("Render nested value", async () => {
    const { getAllByTestId, getByText } = render(
      <Provider store={store}>
        <CardDetailsAttribute
          attributeKey={""}
          attributeValue={{
            a: {
              d: "EJ3HSnEqtSm3WiucWkeBbKspmEAIjf2N6wr5EKOcQ9Vl",
              i: "EJWgO4hwKxNMxu2aUpmGFMozKt9Eq2Jz8n-xXR7CYtY_",
              dt: "2024-01-22T16:03:44.643000+00:00",
              LEI: "5493001KJTIIGC8Y1R17",
            },
            s: {
              title: "Qualified vLEI Issuer Credential",
              description:
                "A vLEI Credential issued by GLEIF to Qualified vLEI Issuers which allows the Qualified vLEI Issuers to issue, verify and revoke Legal Entity vLEI Credentials and Legal Entity Official Organizational Role vLEI Credentials",
              version: "1.0.0",
            },
          }}
        />
      </Provider>
    );

    expect(getAllByTestId("nested-attributes").length).toBe(3);
    expect(
      getByText(
        Eng_trans.tabs.credentials.details.attributes.issuee.concat(":")
      )
    ).toBeVisible();
    expect(
      getByText(
        Eng_trans.tabs.credentials.details.attributes.issuancedate.concat(":")
      )
    ).toBeVisible();
    expect(
      getByText(Eng_trans.tabs.credentials.details.status.label)
    ).toBeVisible();
    expect(
      getByText("EJ3HSnEqtSm3WiucWkeBbKspmEAIjf2N6wr5EKOcQ9Vl")
    ).toBeVisible();
    expect(
      getByText("EJWgO4hwKxNMxu2aUpmGFMozKt9Eq2Jz8n-xXR7CYtY_")
    ).toBeVisible();
    expect(getByText("5493001KJTIIGC8Y1R17")).toBeVisible();
    expect(getByText("Qualified vLEI Issuer Credential")).toBeVisible();
    expect(
      getByText(
        "A vLEI Credential issued by GLEIF to Qualified vLEI Issuers which allows the Qualified vLEI Issuers to issue, verify and revoke Legal Entity vLEI Credentials and Legal Entity Official Organizational Role vLEI Credentials"
      )
    ).toBeVisible();
    expect(getByText("description:")).toBeVisible();
  });

  test("Ignore key", async () => {
    const { queryAllByTestId } = render(
      <Provider store={store}>
        <CardDetailsAttribute
          attributeKey={"dt"}
          attributeValue={{
            a: {
              d: "EJ3HSnEqtSm3WiucWkeBbKspmEAIjf2N6wr5EKOcQ9Vl",
              i: "EJWgO4hwKxNMxu2aUpmGFMozKt9Eq2Jz8n-xXR7CYtY_",
              dt: "2024-01-22T16:03:44.643000+00:00",
              LEI: "5493001KJTIIGC8Y1R17",
            },
            s: {
              title: "Qualified vLEI Issuer Credential",
              description:
                "A vLEI Credential issued by GLEIF to Qualified vLEI Issuers which allows the Qualified vLEI Issuers to issue, verify and revoke Legal Entity vLEI Credentials and Legal Entity Official Organizational Role vLEI Credentials",
              version: "1.0.0",
            },
          }}
          ignoreKeys={["dt"]}
        />
      </Provider>
    );

    expect(queryAllByTestId("nested-attributes").length).toBe(0);
  });
});
