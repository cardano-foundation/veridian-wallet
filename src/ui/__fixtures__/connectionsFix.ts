import {
  ConnectionStatus,
  MultisigConnectionDetails,
  RegularConnectionDetailsFull,
} from "../../core/agent/agent.types";
import { ConnectionHistoryType } from "../../core/agent/services/connectionService.types";
import CardanoLogo from "../assets/images/CardanoLogo.jpg";

const connectionsFix: RegularConnectionDetailsFull[] = [
  {
    id: "ebfeb1ebc6f1c276ef71212ec20",
    contactId: "ebfeb1ebc6f1c276ef71212ec20",
    identifier: "ELjvc_mLWOx7pI4fBh7lGUYofOAJUgUrMKnaoFGdvs86",
    label: "Cambridge University",
    createdAtUTC: "2017-01-14T19:23:24Z",
    logo: CardanoLogo,
    status: ConnectionStatus.PENDING,
    serviceEndpoints: [
      "http://keria:3902/oobi/ELjvc_mLWOx7pI4fBh7lGUYofOAJUgUrMKnaoFGdvs86/agent/ENGnzDMWk8PlFbOoYCauLs1rDuQbvsIStxNzkjZPikSo?name=CF%20Credential%20Issuance",
    ],
    notes: [
      {
        id: "ebfeb1ebc6f1c276ef71212ec20",
        title: "Title",
        message: "Message",
      },
    ],
    historyItems: [
      {
        id: "1",
        type: ConnectionHistoryType.CREDENTIAL_REQUEST_PRESENT,
        timestamp: "2017-01-14T19:23:24Z",
        credentialType: "Cardano Foundation",
      },
    ],
  },
  {
    id: "ebfeb1ebc6f1c276ef71212ec21",
    contactId: "ebfeb1ebc6f1c276ef71212ec21",
    identifier: "ENGnzDMWk8PlFbOoYCauLs1rDuQbvsIStxNzkjZPikSo",
    label: "Passport Office",
    createdAtUTC: "2017-01-16T08:21:54Z",
    logo: CardanoLogo,
    status: ConnectionStatus.CONFIRMED,
    serviceEndpoints: [
      "http://keria:3902/oobi/ELjvc_mLWOx7pI4fBh7lGUYofOAJUgUrMKnaoFGdvs86/agent/ENGnzDMWk8PlFbOoYCauLs1rDuQbvsIStxNzkjZPikSo?name=CF%20Credential%20Issuance",
    ],
    notes: [
      {
        id: "ebfeb1ebc6f1c276ef71212ec20",
        title: "Title",
        message: "Message",
      },
    ],
    historyItems: [
      {
        id: "1",
        type: ConnectionHistoryType.CREDENTIAL_REQUEST_PRESENT,
        timestamp: "2017-01-14T19:23:24Z",
        credentialType: "Cardano Foundation",
      },
    ],
  },
  {
    id: "ebfeb1ebc6f1c276ef71212ec22",
    contactId: "ebfeb1ebc6f1c276ef71212ec22",
    identifier: "EKwzermyJ6VhunFWpo7fscyCILxFG7zZIM9JwSSABbZ5",
    label: "Cardano Foundation",
    createdAtUTC: "2017-01-13T10:15:11Z",
    logo: CardanoLogo,
    status: ConnectionStatus.CONFIRMED,
    serviceEndpoints: [],
    notes: [],
    historyItems: [],
  },
  {
    id: "ebfeb1ebc6f1c276ef71212ec23",
    contactId: "ebfeb1ebc6f1c276ef71212ec23",
    identifier: "EBvcao4Ub-Q7Wwkm0zJzwigvPTrthP4uH5mQ4efRv9aU",
    label: "John Smith",
    createdAtUTC: "2024-02-13T11:39:20Z",
    logo: CardanoLogo,
    status: ConnectionStatus.CONFIRMED,
    serviceEndpoints: [],
    notes: [],
    historyItems: [],
  },
  {
    id: "ebfeb1ebc6f1c276ef71212ec24",
    contactId: "ebfeb1ebc6f1c276ef71212ec24",
    identifier: "EMrT7qX0FIMenQoe5pJLahxz_rheks1uIviGW8ch8pfB",
    label: "Starling Bank",
    createdAtUTC: "2016-01-10T19:23:24Z",
    logo: CardanoLogo,
    status: ConnectionStatus.PENDING,
    serviceEndpoints: [],
    notes: [],
    historyItems: [],
  },
  {
    id: "ebfeb1ebc6f1c276ef71212ec25",
    contactId: "ebfeb1ebc6f1c276ef71212ec25",
    identifier: "EHgDxeR8ZbNnNjQ2v4xdwgYTg9wKkVs_eLQf8U1nU9gQ",
    label: "Friends' Bank",
    createdAtUTC: "2018-01-14T19:23:24Z",
    logo: CardanoLogo,
    status: ConnectionStatus.CONFIRMED,
    serviceEndpoints: [],
    notes: [],
    historyItems: [],
  },
  {
    label: "The Pentagon",
    id: "EBvcao4Ub-Q7Wwkm0zJzwigvPTrthP4uH5mQ4efRv9aU",
    contactId: "EBvcao4Ub-Q7Wwkm0zJzwigvPTrthP4uH5mQ4efRv9aU",
    identifier: "EXs9OWpOtqrJ9jVhK0_QYL4LdQ1a3VIrJn9d8sQ5RZeg",
    status: ConnectionStatus.CONFIRMED,
    createdAtUTC: "2024-08-07T15:30:42.952Z",
    serviceEndpoints: [],
    notes: [],
    historyItems: [],
  },
];

const connectionRequestPlaceholder = {
  label: "",
  goal_code: "",
  goal: "",
  handshake_protocols: [],
  requestattach: [],
  service: [
    {
      id: "",
      type: "",
      recipientKeys: [],
      routingKeys: [],
      serviceEndpoint: "",
    },
  ],
  profileUrl: "",
  public_did: "",
  type: "",
  id: "",
};

// Convenience array exports for tests that prefer explicit arrays instead of maps
export { connectionsFix, connectionRequestPlaceholder };
export const connectionsFixValues = connectionsFix;

// Explicit array of connections used by notification tests.
export const connectionsForNotificationsValues = [
  {
    id: "EMrT7qX0FIMenQoe5pJLahxz_rheks1uIviGW8ch8pfB",
    label: "CF Credential Issuance",
    connectionDate: "2024-06-25T12:38:06.342Z",
    status: "confirmed",
    oobi: "http://keria:3902/oobi/EMrT7qX0FIMenQoe5pJLahxz_rheks1uIviGW8ch8pfB/agent/EK05Hv5jz3yZJD1UG4FwSE0-xgG2wgWeG4RCasOlr9iI?name=CF%20Credential%20Issuance",
    groupId: "549eb79f-856c-4bb7-8dd5-d5eed865906a",
  },
];

export const multisignConnection: MultisigConnectionDetails = {
  id: "EGpdFYdBkhbMBqTkUGaYeHmu0cX0EgxohGXwY6uLa2d2",
  label: "Leader",
  createdAtUTC: "2025-09-19T10:35:27.838Z",
  status: ConnectionStatus.CONFIRMED,
  oobi: "https://keria-ext.dev.idw-sandboxes.cf-deployments.org/oobi/EGpdFYdBkhbMBqTkUGaYeHmu0cX0EgxohGXwY6uLa2d2/agent/EOf2XGHRW_94wyPkBFwNRupyTdWlhbD-qzQIzXWRIA7u?name=Leader&groupId=0AB-FeKhcGbqGs6Ao39SytSw&groupName=Group+Name",
  contactId: "EGpdFYdBkhbMBqTkUGaYeHmu0cX0EgxohGXwY6uLa2d2",
  groupId: "0AB-FeKhcGbqGs6Ao39SytSw",
};
