const createGroupMock = jest.fn();

import { fireEvent, render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { ConnectionStatus } from "../../../../../core/agent/agent.types";
import EN_TRANSLATIONS from "../../../../../locales/en/en.json";
import { multisignIdentifierFix } from "../../../../__fixtures__/filteredIdentifierFix";
import { makeTestStore } from "../../../../utils/makeTestStore";
import { GroupInfomation, Stage } from "../../SetupGroupProfile.types";
import { InitializeGroup } from "./InitializeGroup";

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

jest.mock("signify-ts", () => ({
  ...jest.requireActual("signify-ts"),
  Salter: jest.fn(() => ({
    qb64: "",
  })),
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

const initiatorGroupProfile = {
  ...multisignIdentifierFix[0],
  groupMetadata: {
    groupId: "549eb79f-856c-4bb7-8dd5-d5eed865906a",
    groupCreated: false,
    groupInitiator: true,
    proposedUsername: "Initiator",
  },
};

const state: GroupInfomation = {
  stage: Stage.InitGroup,
  displayNameValue: "test",
  signer: {
    recoverySigners: 0,
    requiredSigners: 0,
  },
  scannedConections: memberConnections,
  selectedConnections: memberConnections,
  ourIdentifier: initiatorGroupProfile.id,
  newIdentifier: initiatorGroupProfile,
};

jest.mock("../../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      multiSigs: {
        createGroup: (...args: any) => createGroupMock(...args),
      },
    },
  },
}));

describe("Init group", () => {
  test("Render", async () => {
    const { getByText } = render(
      <Provider store={makeTestStore()}>
        <InitializeGroup
          state={state}
          setState={jest.fn}
        />
      </Provider>
    );

    expect(
      getByText(EN_TRANSLATIONS.setupgroupprofile.initgroup.title)
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.setupgroupprofile.initgroup.text)
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.setupgroupprofile.initgroup.button.back)
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.setupgroupprofile.initgroup.button.cancel)
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.setupgroupprofile.initgroup.button.sendrequest)
    ).toBeVisible();

    expect(getByText(state.newIdentifier.displayName)).toBeVisible();

    for (const member of state.selectedConnections) {
      expect(getByText(member.label)).toBeVisible();
    }

    expect(
      getByText(EN_TRANSLATIONS.setupgroupprofile.initgroup.thresholdalert)
    ).toBeVisible();
  });

  test("Config member and signer", async () => {
    const setStateMock = jest.fn();
    const { getByText, getByTestId } = render(
      <Provider store={makeTestStore()}>
        <InitializeGroup
          state={state}
          setState={setStateMock}
        />
      </Provider>
    );

    fireEvent.click(getByTestId("group-member-block"));

    await waitFor(() => {
      expect(getByTestId("setup-connections-modal")).toBeVisible();
    });

    fireEvent.click(
      getByText(
        EN_TRANSLATIONS.setupgroupprofile.initgroup.setconnections.button
          .confirm
      )
    );

    await waitFor(() => {
      expect(getByTestId("setup-signer-modal")).toBeVisible();
    });

    fireEvent.click(
      getByText(
        EN_TRANSLATIONS.setupgroupprofile.initgroup.setsigner.button.confirm
      )
    );

    await waitFor(() => {
      expect(setStateMock).toBeCalledWith({
        ...state,
        signer: {
          recoverySigners: null,
          requiredSigners: null,
        },
      });
    });
  });

  test("Send request", async () => {
    const { getByText } = render(
      <Provider store={makeTestStore()}>
        <InitializeGroup
          state={{
            ...state,
            signer: {
              recoverySigners: 1,
              requiredSigners: 2,
            },
          }}
          setState={jest.fn}
        />
      </Provider>
    );

    expect(
      getByText(
        EN_TRANSLATIONS.setupgroupprofile.initgroup.setsigner.members.replace(
          "{{members}}",
          "1"
        )
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.setupgroupprofile.initgroup.setsigner.members.replace(
          "{{members}}",
          "2"
        )
      )
    ).toBeVisible();

    fireEvent.click(
      getByText(EN_TRANSLATIONS.setupgroupprofile.initgroup.button.sendrequest)
    );

    await waitFor(() => {
      expect(createGroupMock).toBeCalled();
    });
  });
});
