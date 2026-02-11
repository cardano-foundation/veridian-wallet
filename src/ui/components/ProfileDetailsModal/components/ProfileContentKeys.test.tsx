import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { identifierFix } from "../../../__fixtures__/identifierFix";
import { profileCacheFixData } from "../../../__fixtures__/storeDataFix";
import { makeTestStore } from "../../../utils/makeTestStore";
import { ProfileContent } from "./ProfileContent";
import { CreationStatus } from "../../../../core/agent/agent.types";

describe("ProfileContent Signing Keys", () => {
  const mockSetCardData = jest.fn();
  const mockOnRotateKey = jest.fn();
  const mockOnAfterScan = jest.fn();

  const renderComponent = (cardData: any) => {
    const store = makeTestStore({
      profilesCache: profileCacheFixData,
    });

    return render(
      <Provider store={store}>
        <ProfileContent
          cardData={cardData}
          oobi="test-oobi"
          setCardData={mockSetCardData}
          onRotateKey={mockOnRotateKey}
          onAfterScan={mockOnAfterScan}
        />
      </Provider>
    );
  };

  it("should show ONLY the user's signing key in a group profile", () => {
    const groupCardData = {
      ...identifierFix[0],
      creationStatus: CreationStatus.COMPLETE,
      groupMemberPre: "MEMBER_AID_1",
      members: ["MEMBER_AID_0", "MEMBER_AID_1", "MEMBER_AID_2"],
      k: ["KEY_0", "KEY_1", "KEY_2"],
    };

    renderComponent(groupCardData);

    // Should find only one signing key text value (KEY_1)
    const keyItem = screen.getByTestId("signing-key-text-value");
    expect(keyItem).toHaveTextContent("KEY_1".substring(0, 5));

    // Should NOT find other keys via data-testid patterns from previous versions
    expect(
      screen.queryByTestId("signing-key-0-text-value")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("signing-key-1-text-value")
    ).not.toBeInTheDocument();
  });

  it("should show ONLY the first signing key in an individual profile", () => {
    const individualCardData = {
      ...identifierFix[0],
      creationStatus: CreationStatus.COMPLETE,
      groupMemberPre: undefined,
      members: undefined,
      k: ["KEY_0", "KEY_1"],
    };

    renderComponent(individualCardData);

    // Should find only one signing key (the first one)
    const keyItem = screen.getByTestId("signing-key-text-value");
    expect(keyItem).toHaveTextContent("KEY_0".substring(0, 5));

    // Check that we don't have multiple keys
    const allKeyValues = screen.getAllByTestId("signing-key-text-value");
    expect(allKeyValues).toHaveLength(1);
  });
});
