import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import EN_TRANSLATIONS from "../../../../locales/en/en.json";
import { credsFixAcdc } from "../../../__fixtures__/credsFix";
import { CredentialContent } from "./CredentialContent";
import { store } from "../../../../store";

describe("Creds content", () => {
  test("Render ACDC cedential content", () => {
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <CredentialContent
          cardData={{
            ...credsFixAcdc[0],
            credentialType: credsFixAcdc[0].s.title,
            issuanceDate: credsFixAcdc[0].a.dt,
          }}
        />
      </Provider>
    );
    expect(getByTestId("card-details-credential-type")).toBeVisible();
    expect(getByText(EN_TRANSLATIONS.credentials.details.title)).toBeVisible();
    expect(getByText("Qualified vLEI Issuer Credential")).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.credentials.details.description)
    ).toBeVisible();
    expect(getByText(EN_TRANSLATIONS.credentials.details.id)).toBeVisible();
    expect(
      getByText("EKfweht5lOkjaguB5dz42BMkfejhBFIF9-ghumzCJ6nv")
    ).toBeVisible();
    expect(
      getByText(
        "A vLEI Credential issued by GLEIF to Qualified vLEI Issuers which allows the Qualified vLEI Issuers to issue, verify and revoke Legal Entity vLEI Credentials and Legal Entity Official Organizational Role vLEI Credentials"
      )
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.credentials.details.attributes.label)
    ).toBeVisible();
    expect(
      getByText("EJWgO4hwKxNMxu2aUpmGFMozKt9Eq2Jz8n-xXR7CYtY_")
    ).toBeVisible();
    expect(getByText("22/01/2024 - 16:03:44")).toBeVisible();
    expect(getByText("5493001KJTIIGC8Y1R17")).toBeVisible();
    expect(getByText("1.0.0")).toBeVisible();
    expect(
      getByText("EGvs2tol4NEtRvYFQDwzRJNnxZgAiGbM4iHB3h4gpRN5")
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.credentials.details.status.label)
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.credentials.details.status.label + ":")
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.credentials.details.status.timestamp + ":")
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.credentials.details.status.issued)
    ).toBeVisible();
    expect(getByText("22/01/2024 - 16:05:44")).toBeVisible();
  });
});
