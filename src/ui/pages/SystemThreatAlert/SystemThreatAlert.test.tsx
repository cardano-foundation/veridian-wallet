import { render } from "@testing-library/react";
import TRANSLATE from "../../../locales/en/en.json";
import { SystemThreatAlert } from "./SystemThreatAlert";

const browserMock = jest.fn(({ link }: { link: string }) =>
  Promise.resolve(link)
);

jest.mock("@capacitor/browser", () => ({
  ...jest.requireActual("@capacitor/browser"),
  Browser: {
    open: (params: never) => browserMock(params),
  },
}));

describe("System Threat Alert", () => {
  test("Render", async () => {
    const { getByText } = render(
      <SystemThreatAlert errors={["Debug threat error"]} />
    );

    expect(getByText(TRANSLATE.systemthreats.title)).toBeVisible();
    expect(getByText(TRANSLATE.systemthreats.description)).toBeVisible();
    expect(getByText(TRANSLATE.systemthreats.help)).toBeVisible();
    expect(getByText("Debug threat error")).toBeVisible();
  });
});
