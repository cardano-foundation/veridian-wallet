import { IdentifierShortDetails } from "../../core/agent/services/identifier.types";
import { CreationStatus } from "../../core/agent/agent.types";

const failedMultisignIdentifierFix: IdentifierShortDetails[] = [
  {
    id: "ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inc",
    displayName: "Professional ID",
    createdAtUTC: "2023-01-01T19:23:24Z",
    theme: 0,
    creationStatus: CreationStatus.FAILED,
    groupMetadata: {
      groupId: "549eb79f-856c-4bb7-8dd5-d5eed865906a",
      groupCreated: false,
      groupInitiator: false,
      proposedUsername: "test",
    },
  },
];

const multisignIdentifierFix: IdentifierShortDetails[] = [
  {
    id: "ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inu",
    displayName: "Professional ID",
    createdAtUTC: "2023-01-01T19:23:24Z",
    theme: 0,
    creationStatus: CreationStatus.COMPLETE,
    groupMetadata: {
      groupId: "549eb79f-856c-4bb7-8dd5-d5eed865906a",
      groupCreated: false,
      groupInitiator: true,
      proposedUsername: "test",
    },
  },
];

const pendingMemberIdentifierFix: IdentifierShortDetails[] = [
  {
    id: "ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb",
    displayName: "Professional ID",
    createdAtUTC: "2023-01-01T19:23:24Z",
    theme: 0,
    creationStatus: CreationStatus.PENDING,
    groupMetadata: {
      groupId: "549eb79f-856c-4bb7-8dd5-d5eed865906a",
      groupCreated: false,
      groupInitiator: false,
      proposedUsername: "test",
    },
  },
];

const pendingGroupIdentifierFix: IdentifierShortDetails = {
  id: "ECHG-cxboMQ78Hwlm2-w6OS3iU275bAKkqC1LjwICPy2",
  displayName: "Test MS",
  createdAtUTC: "2024-03-07T11:54:56.886Z",
  theme: 0,
  creationStatus: CreationStatus.PENDING,
  groupMemberPre: "ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb",
  groupId: "549eb79f-856c-4bb7-8dd5-d5eed865906a",
  groupUsername: "test",
};

const filteredIdentifierFix: IdentifierShortDetails[] = [
  {
    id: "ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb",
    displayName: "Professional ID",
    createdAtUTC: "2023-01-01T19:23:24Z",
    theme: 0,
    creationStatus: CreationStatus.COMPLETE,
  },
  {
    id: "ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inx",
    displayName: "Professional ID",
    createdAtUTC: "2023-01-01T19:23:24Z",
    theme: 1,
    creationStatus: CreationStatus.COMPLETE,
  },
  {
    id: "ECHG-cxboMQ78Hwlm2-w6OS3iU275bAKkqC1LjwICPyi",
    displayName: "Test MS",
    createdAtUTC: "2024-03-07T11:54:56.886Z",
    theme: 0,
    creationStatus: CreationStatus.PENDING,
  },
  {
    displayName: "GID 1",
    id: "EIRdVIgcPYj6LbN4DdxzJFnsvELV-7eWDBQ4a-VsRDQb",
    createdAtUTC: "2024-10-21T11:15:58.673Z",
    theme: 0,
    creationStatus: CreationStatus.COMPLETE,
    groupMemberPre: "EHzi_GBx0jIgd3G0Qqcjg3ZaLJ6d84wp6q0qUvC_iOQ4",
    groupId: "549eb79f-856c-4bb7-8dd5-d5eed865906a",
    groupUsername: "GID 1",
  },
  {
    displayName: "Profess",
    id: "EE-gjeEni5eCdpFlBtG7s4wkv7LJ0JmWplCS4DNQwW2G",
    createdAtUTC: "2024-10-21T11:15:58.673Z",
    theme: 0,
    creationStatus: CreationStatus.COMPLETE,
  },
  failedMultisignIdentifierFix[0],
  multisignIdentifierFix[0],
  pendingGroupIdentifierFix,
];

const filteredIdentifierMapFix = filteredIdentifierFix.reduce(
  (result, next) => {
    result[next.id] = next;

    return result;
  },
  {} as Record<string, IdentifierShortDetails>
);

const failedFilteredIdentifierMapFix = filteredIdentifierFix.reduce(
  (result, next) => {
    result[next.id] = {
      ...next,
      creationStatus: CreationStatus.FAILED,
    };

    return result;
  },
  {} as Record<string, IdentifierShortDetails>
);

const pendingIdentifierFix: IdentifierShortDetails = {
  id: "EB3VkeAMhhPh2GZnDYs68N8-jJ1xrB6ptX5JxPuPFpZ7",
  displayName: "Test MS",
  createdAtUTC: "2024-03-07T11:54:56.886Z",
  theme: 0,
  creationStatus: CreationStatus.PENDING,
};

export {
  filteredIdentifierMapFix,
  filteredIdentifierFix,
  multisignIdentifierFix,
  pendingMemberIdentifierFix,
  failedMultisignIdentifierFix,
  failedFilteredIdentifierMapFix,
  pendingGroupIdentifierFix,
  pendingIdentifierFix,
};
