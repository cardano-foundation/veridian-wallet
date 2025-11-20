import { render } from "@testing-library/react";
import { informationCircleOutline, warningOutline } from "ionicons/icons";
import { InfoCard } from "./InfoCard";

let iconProp: any;
jest.mock("@ionic/react", () => ({
  IonCard: ({ children, className }: any) => (
    <div
      data-testid="ion-card"
      className={className}
    >
      {children}
    </div>
  ),
  IonIcon: ({ icon, slot }: any) => {
    iconProp = icon;
    return (
      <div
        data-testid="ion-icon"
        data-slot={slot}
      />
    );
  },
}));

describe("InfoCard", () => {
  beforeEach(() => {
    iconProp = undefined;
  });

  test("renders content when provided", () => {
    const { getByText } = render(<InfoCard content="Test content" />);
    expect(getByText("Test content")).toBeInTheDocument();

    const { container: noContentContainer } = render(
      <InfoCard content={null} />
    );
    expect(noContentContainer.querySelector("p")).toBeNull();
  });

  test("applies classes correctly", () => {
    const { getByTestId } = render(
      <InfoCard
        className="custom-class"
        danger
        warning
      />
    );
    expect(getByTestId("ion-card")).toHaveClass(
      "info-card",
      "custom-class",
      "danger",
      "warning"
    );
  });

  test("renders children and icon correctly", () => {
    const customIcon = "custom-icon";
    const { getByText } = render(
      <InfoCard icon={customIcon}>
        <span>Test child</span>
      </InfoCard>
    );

    expect(getByText("Test child")).toBeInTheDocument();
    expect(iconProp).toBe(customIcon);

    render(<InfoCard warning />);
    expect(iconProp).toBe(warningOutline);

    render(<InfoCard />);
    expect(iconProp).toBe(informationCircleOutline);
  });
});
