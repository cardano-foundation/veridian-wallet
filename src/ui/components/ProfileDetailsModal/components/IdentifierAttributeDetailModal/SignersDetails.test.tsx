import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import ENG_TRANS from "../../../../../locales/en/en.json";
import { identifierFix } from "../../../../__fixtures__/identifierFix";
import { SignersDetails } from "./SignersDetails";
import { makeTestStore } from "../../../../utils/makeTestStore";

describe("ProfileContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Render when threshold greater than 1", () => {
    const { getByText } = render(
      <Provider store={makeTestStore()}>
        <SignersDetails
          data={identifierFix[0]}
          setViewType={jest.fn()}
        />
      </Provider>
    );

    expect(
      getByText(
        ENG_TRANS.profiledetails.group.signingkeysthreshold.members.replace(
          "{{member}}",
          String(identifierFix[0].kt)
        )
      )
    );

    expect(
      getByText(
        ENG_TRANS.profiledetails.group.rotationthreshold.members.replace(
          "{{member}}",
          String(identifierFix[0].nt)
        )
      )
    );
  });

  it("Render when threshold equal 1", () => {
    const { getAllByText } = render(
      <Provider store={makeTestStore()}>
        <SignersDetails
          data={{
            ...identifierFix[0],
            nt: "1",
            kt: "1",
          }}
          setViewType={jest.fn()}
        />
      </Provider>
    );

    expect(
      getAllByText(
        ENG_TRANS.profiledetails.group.signingkeysthreshold.member.replace(
          "{{member}}",
          "1"
        )
      ).length
    ).toBe(2);
  });
});
