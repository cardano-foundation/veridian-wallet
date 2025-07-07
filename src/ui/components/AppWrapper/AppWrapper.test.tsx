const getConnectionShortDetailByIdMock = jest.fn();

import { render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { Agent } from "../../../core/agent/agent";
import {
  ConnectionShortDetails,
  ConnectionStatus,
  CreationStatus,
} from "../../../core/agent/agent.types";
import {
  AcdcStateChangedEvent,
  ConnectionStateChangedEvent,
  EventTypes,
  GroupCreatedEvent,
  IdentifierAddedEvent,
} from "../../../core/agent/event.types";
import { OperationPendingRecordType } from "../../../core/agent/records/operationPendingRecord.type";
import {
  CredentialShortDetails,
  CredentialStatus,
} from "../../../core/agent/services/credentialService.types";
import {
  PeerConnectSigningEvent,
  PeerConnectedEvent,
  PeerConnectionBrokenEvent,
  PeerConnectionEventTypes,
  PeerDisconnectedEvent,
} from "../../../core/cardano/walletConnect/peerConnection.types";
import { store } from "../../../store";
import { updateOrAddConnectionCache } from "../../../store/reducers/connectionsCache";
import { updateOrAddCredsCache } from "../../../store/reducers/credsCache";
import {
  addGroupIdentifierCache,
  updateCreationStatus,
  updateOrAddIdentifiersCache,
} from "../../../store/reducers/identifiersCache";
import {
  setQueueIncomingRequest,
  setToastMsg,
} from "../../../store/reducers/stateCache";
import { IncomingRequestType } from "../../../store/reducers/stateCache/stateCache.types";
import {
  ConnectionData,
  setConnectedWallet,
  setWalletConnectionsCache,
} from "../../../store/reducers/walletConnectionsCache";
import { ToastMsgType } from "../../globals/types";
import {
  AppWrapper,
  acdcChangeHandler,
  connectionStateChangedHandler,
  peerConnectRequestSignChangeHandler,
  peerConnectedChangeHandler,
  peerConnectionBrokenChangeHandler,
  peerDisconnectedChangeHandler,
} from "./AppWrapper";
import {
  groupCreatedHandler,
  identifierAddedHandler,
  operationCompleteHandler,
  operationFailureHandler,
} from "./coreEventListeners";
import {
  pendingIdentifierFix,
  pendingGroupIdentifierFix,
} from "../../__fixtures__/filteredIdentifierFix";

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      start: jest.fn(),
      setupLocalDependencies: jest.fn(),
      auth: {
        getLoginAttempts: jest.fn(() =>
          Promise.resolve({
            attempts: 0,
            lockedUntil: Date.now(),
          })
        ),
      },
      identifiers: {
        getIdentifiers: jest.fn().mockResolvedValue([]),
        syncKeriaIdentifiers: jest.fn(),
        onIdentifierAdded: jest.fn(),
        getAvailableWitnesses: jest.fn(),
      },
      multiSigs: {
        getMultisigIcpDetails: jest.fn().mockResolvedValue({}),
        onGroupAdded: jest.fn(),
      },
      connections: {
        getConnections: jest.fn().mockResolvedValue([]),
        getMultisigConnections: jest.fn().mockResolvedValue([]),
        onConnectionStateChanged: jest.fn(),
        getConnectionShortDetails: jest.fn(),
        isConnectionRequestSent: jest.fn(),
        isConnectionResponseReceived: jest.fn(),
        isConnectionRequestReceived: jest.fn(),
        isConnectionResponseSent: jest.fn(),
        isConnectionConnected: jest.fn(),
        getConnectionShortDetailById: getConnectionShortDetailByIdMock,
        getUnhandledConnections: jest.fn(),
        syncKeriaContacts: jest.fn(),
      },
      credentials: {
        getCredentials: jest.fn().mockResolvedValue([]),
        onCredentialStateChanged: jest.fn(),
        isCredentialOfferReceived: jest.fn(),
        isCredentialRequestSent: jest.fn(),
        createMetadata: jest.fn(),
        isCredentialDone: jest.fn(),
        updateMetadataCompleted: jest.fn(),
        onAcdcStateChanged: jest.fn(),
        syncKeriaCredentials: jest.fn(),
      },
      messages: {
        onBasicMessageStateChanged: jest.fn(),
        pickupMessagesFromMediator: jest.fn(),
      },
      keriaNotifications: {
        pollNotifications: jest.fn(),
        pollLongOperations: jest.fn(),
        getNotifications: jest.fn(),
        onNewNotification: jest.fn(),
        onLongOperationSuccess: jest.fn(),
        onLongOperationFailure: jest.fn(),
        onRemoveNotification: jest.fn(),
        stopPolling: jest.fn(),
      },
      getKeriaOnlineStatus: jest.fn(),
      onKeriaStatusStateChanged: jest.fn(),
      peerConnectionMetadataStorage: {
        getAllPeerConnectionMetadata: jest.fn(),
        getPeerConnectionMetadata: jest.fn(),
        getPeerConnection: jest.fn(),
      },
      basicStorage: {
        findById: jest.fn(),
        save: jest.fn(),
      },
    },
  },
}));

describe("App Wrapper", () => {
  test("renders children components", async () => {
    const { getByText } = render(
      <Provider store={store}>
        <AppWrapper>
          <div>App Content</div>
        </AppWrapper>
      </Provider>
    );

    await waitFor(() => {
      expect(getByText("App Content")).toBeInTheDocument();
    });
  });
});

const connectionStateChangedEvent: ConnectionStateChangedEvent = {
  type: EventTypes.ConnectionStateChanged,
  payload: {
    status: ConnectionStatus.PENDING,
  },
};

const connectionShortDetails: ConnectionShortDetails = {
  id: "id",
  label: "idw",
  logo: "png",
  status: ConnectionStatus.PENDING,
  createdAtUTC: "2024-03-07T11:54:56.886Z",
};

const peerConnectedEvent: PeerConnectedEvent = {
  type: PeerConnectionEventTypes.PeerConnected,
  payload: {
    identifier: "identifier",
    dAppAddress: "dApp-address",
  },
};

const peerDisconnectedEvent: PeerDisconnectedEvent = {
  type: PeerConnectionEventTypes.PeerDisconnected,
  payload: {
    dAppAddress: "dApp-address",
  },
};

const peerSignRequestEvent: PeerConnectSigningEvent = {
  type: PeerConnectionEventTypes.PeerConnectSign,
  payload: {
    identifier: "identifier",
    approvalCallback: function () {
      return;
    },
    payload: "Hello",
  },
};

const peerConnectionBrokenEvent: PeerConnectionBrokenEvent = {
  type: PeerConnectionEventTypes.PeerConnectionBroken,
  payload: {},
};

const peerConnection: ConnectionData = {
  id: "dApp-address",
  name: "dApp-name",
  iconB64: "icon",
  selectedAid: "identifier",
  url: "http://localhost:3000",
};

const identifierAddedEvent: IdentifierAddedEvent = {
  type: EventTypes.IdentifierAdded,
  payload: {
    identifier: pendingIdentifierFix,
  },
};

const groupCreatedEvent: GroupCreatedEvent = {
  type: EventTypes.GroupCreated,
  payload: {
    group: pendingGroupIdentifierFix,
  },
};

const dispatch = jest.fn();

describe("Connection state changed handler", () => {
  beforeAll(() => {
    const getConnectionShortDetailsSpy = jest.spyOn(
      Agent.agent.connections,
      "getConnectionShortDetailById"
    );
    getConnectionShortDetailsSpy.mockResolvedValue(connectionShortDetails);
  });

  test("handles connection state pending", async () => {
    await connectionStateChangedHandler(connectionStateChangedEvent, dispatch);
    expect(dispatch).toBeCalledWith(
      setToastMsg(ToastMsgType.CONNECTION_REQUEST_PENDING)
    );
  });

  test("handles connection state succuss", async () => {
    const connectionStateChangedEventMockSuccess = {
      ...connectionStateChangedEvent,
      payload: {
        status: ConnectionStatus.CONFIRMED,
        connectionId: "connectionId",
      },
    };
    await connectionStateChangedHandler(
      connectionStateChangedEventMockSuccess,
      dispatch
    );
    expect(dispatch).toBeCalledWith(
      updateOrAddConnectionCache(connectionShortDetails)
    );
    expect(dispatch).toBeCalledWith(
      setToastMsg(ToastMsgType.NEW_CONNECTION_ADDED)
    );
  });
});

describe("Credential state changed handler", () => {
  test("handles credential state pending", async () => {
    const credentialMock = {} as CredentialShortDetails;
    const credentialStateChangedEventMock = {
      type: EventTypes.AcdcStateChanged,
      payload: {
        status: CredentialStatus.PENDING,
        credential: credentialMock,
      },
    } as AcdcStateChangedEvent;
    await acdcChangeHandler(credentialStateChangedEventMock, dispatch);
    expect(dispatch).toBeCalledWith(
      setToastMsg(ToastMsgType.CREDENTIAL_REQUEST_PENDING)
    );
  });

  test("handles credential state confirmed", async () => {
    const credentialMock = {} as CredentialShortDetails;
    const credentialStateChangedEventMock = {
      type: EventTypes.AcdcStateChanged,
      payload: {
        status: CredentialStatus.CONFIRMED,
        credential: credentialMock,
      },
    } as AcdcStateChangedEvent;
    await acdcChangeHandler(credentialStateChangedEventMock, dispatch);
    expect(dispatch).toBeCalledWith(updateOrAddCredsCache(credentialMock));
    expect(dispatch).toBeCalledWith(
      setToastMsg(ToastMsgType.NEW_CREDENTIAL_ADDED)
    );
  });

  test("handles credential state revoked", async () => {
    const credentialMock = {} as CredentialShortDetails;
    const credentialStateChangedEventMock = {
      type: EventTypes.AcdcStateChanged,
      payload: {
        status: CredentialStatus.REVOKED,
        credential: credentialMock,
      },
    } as AcdcStateChangedEvent;
    await acdcChangeHandler(credentialStateChangedEventMock, dispatch);
    expect(dispatch).toBeCalledWith(updateOrAddCredsCache(credentialMock));
  });
});

describe("Peer connection states changed handler", () => {
  test("handle peer connected event", async () => {
    Agent.agent.peerConnectionMetadataStorage.getPeerConnectionMetadata = jest
      .fn()
      .mockResolvedValue(peerConnection);
    Agent.agent.peerConnectionMetadataStorage.getAllPeerConnectionMetadata =
      jest.fn().mockResolvedValue([peerConnection]);
    await peerConnectedChangeHandler(peerConnectedEvent, dispatch);
    await waitFor(() => {
      expect(dispatch).toBeCalledWith(setConnectedWallet(peerConnection));
    });
    expect(dispatch).toBeCalledWith(
      setWalletConnectionsCache([peerConnection])
    );
    expect(dispatch).toBeCalledWith(
      setToastMsg(ToastMsgType.CONNECT_WALLET_SUCCESS)
    );
  });

  test("handle peer disconnected event", async () => {
    await peerDisconnectedChangeHandler(
      peerDisconnectedEvent,
      peerConnection.id,
      dispatch
    );
    expect(dispatch).toBeCalledWith(setConnectedWallet(null));
    expect(dispatch).toBeCalledWith(
      setToastMsg(ToastMsgType.DISCONNECT_WALLET_SUCCESS)
    );
  });

  test("handle peer sign request event", async () => {
    Agent.agent.peerConnectionMetadataStorage.getPeerConnection = jest
      .fn()
      .mockResolvedValue(peerConnection);
    await peerConnectRequestSignChangeHandler(peerSignRequestEvent, dispatch);
    expect(dispatch).toBeCalledWith(
      setQueueIncomingRequest({
        signTransaction: peerSignRequestEvent,
        peerConnection: peerConnection,
        type: IncomingRequestType.PEER_CONNECT_SIGN,
      })
    );
  });

  test("handle peer connection broken event", async () => {
    await peerConnectionBrokenChangeHandler(
      peerConnectionBrokenEvent,
      dispatch
    );
    expect(dispatch).toBeCalledWith(setConnectedWallet(null));
    expect(dispatch).toBeCalledWith(
      setToastMsg(ToastMsgType.DISCONNECT_WALLET_SUCCESS)
    );
  });
});

describe("KERIA operation state changed handler", () => {
  test("handles completed witness operation", async () => {
    const id = "id";
    await operationCompleteHandler(
      { opType: OperationPendingRecordType.Witness, oid: id },
      dispatch
    );
    expect(dispatch).toBeCalledWith(
      updateCreationStatus({ id: id, creationStatus: CreationStatus.COMPLETE })
    );
    expect(dispatch).toBeCalledWith(
      setToastMsg(ToastMsgType.IDENTIFIER_UPDATED)
    );
  });

  test("handles failed witness operation", async () => {
    const id = "id";
    await operationFailureHandler(
      { opType: OperationPendingRecordType.Witness, oid: id },
      dispatch
    );
    expect(dispatch).toBeCalledWith(
      updateCreationStatus({ id: id, creationStatus: CreationStatus.FAILED })
    );
    expect(dispatch).toBeCalledWith(
      setToastMsg(ToastMsgType.IDENTIFIER_UPDATED)
    );
  });

  test("handles failed oobi operation", async () => {
    const id = "id";
    const connectionMock = {
      id: "id",
      creationStatus: CreationStatus.PENDING,
      createdAt: new Date(),
      alias: "CF Credential Issuance",
      oobi: "http://oobi.com/",
    };
    getConnectionShortDetailByIdMock.mockResolvedValue(connectionMock);
    await operationFailureHandler(
      { opType: OperationPendingRecordType.Oobi, oid: id },
      dispatch
    );
    expect(dispatch).toBeCalledWith(
      updateOrAddConnectionCache(expect.objectContaining({ ...connectionMock }))
    );
  });
});

describe("Identifier state changed handler", () => {
  test("handles identifier added event", async () => {
    await identifierAddedHandler(identifierAddedEvent, dispatch);
    expect(dispatch).toBeCalledWith(
      updateOrAddIdentifiersCache(pendingIdentifierFix)
    );
  });
});

describe("Group state changed handler", () => {
  test("handles group created event", async () => {
    await groupCreatedHandler(groupCreatedEvent, dispatch);
    expect(dispatch).toBeCalledWith(
      addGroupIdentifierCache(pendingGroupIdentifierFix)
    );
  });
});
