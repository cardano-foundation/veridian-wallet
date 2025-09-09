import { fireEvent, render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { ConnectionStatus } from "../../../../../core/agent/agent.types";
import EN_TRANSLATIONS from "../../../../../locales/en/en.json";
import { makeTestStore } from "../../../../utils/makeTestStore";
import { SetupMemberModal } from "./SetupMemberModal";

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

const memberConnections = [
  {
    id: "EKlUo3CAqjPfFt0Wr2vvSc7MqT9WiL2EGadRsAP3V1I2",
    label: "Member 1",
    oobi: "http://127.0.0.1:3902/oobi/EKlUo3CAqjPfFt0Wr2vvSc7MqT9WiL2EGadRsAP3V1IJ/agent/EF_dfLFGvUh9kMsV2LIJQtrkuXWG_-wxWzC_XjCWjlkQ",
    status: ConnectionStatus.CONFIRMED,
    createdAtUTC: new Date().toISOString(),
    contactId: "EKlUo3CAqjPfFt0Wr2vvSc7MqT9WiL2EGadRsAP3V1IJ",
    identifier: "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
  },
  {
    id: "EKlUo3CAqjPfFt0Wr2vvSc7MqT9WiL2EGadRsAP3V1I3",
    label: "Member 2",
    oobi: "http://127.0.0.1:3902/oobi/EKlUo3CAqjPfFt0Wr2vvSc7MqT9WiL2EGadRsAP3V1IJ/agent/EF_dfLFGvUh9kMsV2LIJQtrkuXWG_-wxWzC_XjCWjlkQ",
    status: ConnectionStatus.CONFIRMED,
    createdAtUTC: new Date().toISOString(),
    contactId: "EKlUo3CAqjPfFt0Wr2vvSc7MqT9WiL2EGadRsAP3V1IJ",
    identifier: "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
  },
  {
    id: "EKlUo3CAqjPfFt0Wr2vvSc7MqT9WiL2EGadRsAP3V1I4",
    label: "Member 3",
    oobi: "http://127.0.0.1:3902/oobi/EKlUo3CAqjPfFt0Wr2vvSc7MqT9WiL2EGadRsAP3V1IJ/agent/EF_dfLFGvUh9kMsV2LIJQtrkuXWG_-wxWzC_XjCWjlkQ",
    status: ConnectionStatus.CONFIRMED,
    createdAtUTC: new Date().toISOString(),
    contactId: "EKlUo3CAqjPfFt0Wr2vvSc7MqT9WiL2EGadRsAP3V1IJ",
    identifier: "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
  },
];

describe("Setup member modal", () => {
  test("Render modal", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={makeTestStore()}>
        <SetupMemberModal
          isOpen
          setOpen={jest.fn}
          onSubmit={jest.fn}
          connections={memberConnections}
          currentSelectedConnections={memberConnections}
        />
      </Provider>
    );

    expect(
      getByText(
        EN_TRANSLATIONS.setupgroupprofile.initgroup.setconnections.title
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.setupgroupprofile.initgroup.setconnections.button.back
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.setupgroupprofile.initgroup.setconnections.button
          .confirm
      )
    ).toBeVisible();

    for (const connection of memberConnections) {
      expect(getByText(connection.label)).toBeVisible();
    }
  });

  test("Select member and submit", async () => {
    const submit = jest.fn();
    const { getByText, getByTestId } = render(
      <Provider store={makeTestStore()}>
        <SetupMemberModal
          isOpen
          setOpen={jest.fn}
          onSubmit={submit}
          connections={memberConnections}
          currentSelectedConnections={[memberConnections[0]]}
        />
      </Provider>
    );

    for (const connection of memberConnections) {
      expect(getByText(connection.label)).toBeVisible();
    }

    expect(
      getByText(
        EN_TRANSLATIONS.setupgroupprofile.initgroup.setconnections.button
          .confirm
      ).getAttribute("disabled")
    ).toBe("false");

    fireEvent.click(getByTestId(`card-item-${memberConnections[0].id}`));

    await waitFor(() => {
      expect(
        (
          getByTestId(
            "connection-select-" + memberConnections[0].id
          ) as HTMLInputElement
        ).checked
      ).toBe(false);
    });

    fireEvent.click(getByTestId(`card-item-${memberConnections[0].id}`));

    await waitFor(() => {
      expect(
        (
          getByTestId(
            "connection-select-" + memberConnections[0].id
          ) as HTMLInputElement
        ).checked
      ).toBe(true);
      expect(
        getByText(
          EN_TRANSLATIONS.setupgroupprofile.initgroup.setconnections.button
            .confirm
        ).getAttribute("disabled")
      ).toBe("false");
    });

    fireEvent.click(
      getByText(
        EN_TRANSLATIONS.setupgroupprofile.initgroup.setconnections.button
          .confirm
      )
    );

    expect(submit).toBeCalledWith([memberConnections[0]]);
  });
});
