
enum CardType {
  CREDENTIALS = "credentials",
  IDENTIFIERS = "identifiers",
}

enum RequestType {
  CONNECTION = "Connection",
  CREDENTIAL = "Credential",
}

// String enums as some of these map to i18n values (if relevant)
enum OperationType {
  IDLE = "idle",
  DELETE_CONNECTION = "deleteConnection",
  SCAN_CONNECTION = "scanConnection",
  MULTI_SIG_INITIATOR_SCAN = "multiSigInitiatorScan",
  MULTI_SIG_RECEIVER_SCAN = "multiSigReceiverScan",
  MULTI_SIG_INITIATOR_INIT = "multiSigInitiatorInit",
  SCAN_WALLET_CONNECTION = "scanWalletConnection",
  SCAN_SSI_BOOT_URL = "scanSSIBootUrl",
  SCAN_SSI_CONNECT_URL = "scanSSIConnectUrl",
  OPEN_WALLET_CONNECTION_DETAIL = "openWalletConnection",
  OPEN_MULTISIG_IDENTIFIER = "openMultisignIdentifier",
}

enum ToastMsgType {
  COPIED_TO_CLIPBOARD = "copiedToClipboard",
  IDENTIFIER_REQUESTED = "identifierRequested",
  IDENTIFIER_CREATED = "identifierCreated",
  MULTI_SIGN_IDENTIFIER_CREATED = "multiSignIdentifierCreated",
  DELEGATED_IDENTIFIER_CREATED = "delegatedidentifiercreated",
  IDENTIFIER_UPDATED = "identifierUpdated",
  IDENTIFIER_DELETED = "identifierDeleted",
  CREDENTIAL_DELETED = "credentialDeleted",
  CREDENTIAL_RESTORED = "credentialRestored",
  CREDENTIALS_DELETED = "credentialsDeleted",
  CREDENTIALS_RESTORED = "credentialsRestored",
  CREDENTIAL_ARCHIVED = "credentialArchived",
  CONNECTION_DELETED = "connectionDeleted",
  CONNECTION_REQUEST_PENDING = "connectionRequestPending",
  CONNECTION_REQUEST_INCOMING = "connectionRequestIncoming",
  NEW_CONNECTION_ADDED = "newConnectionAdded",
  CREDENTIAL_REQUEST_PENDING = "credentialRequestPending",
  NEW_CREDENTIAL_ADDED = "newCredentialAdded",
  NOTES_UPDATED = "notesUpdated",
  NOTE_REMOVED = "noteRemoved",
  MAX_FAVOURITES_REACHED = "maxFavouritesReached",
  USERNAME_CREATION_SUCCESS = "usernameCreationSuccess",
  USERNAME_CREATION_ERROR = "usernameCreationError",
  WALLET_CONNECTION_DELETED = "walletconnectiondeleted",
  CONNECT_WALLET_SUCCESS = "connectwalletsuccess",
  DISCONNECT_WALLET_SUCCESS = "disconnectwallet",
  UNABLE_CONNECT_WALLET = "unableconnectwalleterror",
  PEER_ID_SUCCESS = "peeridsuccess",
  PEER_ID_ERROR = "peeriderror",
  PEER_ID_NOT_RECOGNISED = "peeridnotrecognised",
  SETUP_BIOMETRIC_AUTHENTICATION_SUCCESS = "setupbiometricsuccess",
  ROTATE_KEY_SUCCESS = "rotatekeysuccess",
  ROTATE_KEY_ERROR = "rotatekeyerror",
  SCANNER_ERROR = "qrerror",
  NEW_MULTI_SIGN_MEMBER = "newmultisignmember",
  PASSCODE_UPDATED = "passcodeupdated",
  PASSWORD_UPDATED = "passwordupdated",
  PASSWORD_DISABLED = "passworddisabled",
  PASSWORD_CREATED = "passwordcreated",
  PROPOSED_CRED_SUCCESS = "proposedcredsuccess",
  SHARE_CRED_SUCCESS = "sharecredsuccess",
  SHARE_CRED_FAIL = "sharecrederror",
  PROPOSAL_CRED_ACCEPTED = "proposalcredaccepted",
  PROPOSAL_CRED_REJECT = "proposalcredreject",
  PROPOSAL_CRED_FAIL = "proposalcredfailerror",
  DELETE_CONNECTION_FAIL = "deleteconnectionerror",
  DELETE_CRED_FAIL = "deletecrederror",
  DELETE_IDENTIFIER_FAIL = "deleteidentifiererror",
  ARCHIVED_CRED_FAIL = "archivedcrederror",
  SIGN_SUCCESSFUL = "signsuccessful",
  UNABLE_DELETE_PASSWORD_HINT = "deletepasswordhinterror",
  UNABLE_EDIT_IDENTIFIER = "editidentifiererror",
  FAILED_UPDATE_CONNECTION = "failedupdateconnectionerror",
  DUPLICATE_CONNECTION = "duplicateconnectionerror",
  GROUP_ID_NOT_MATCH_ERROR = "groupidnotmatcherror",
  UNKNOWN_ERROR="unknownerror",
}

const PASSCODE_MAPPING = {
  numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 0],
  labels: [
    [""],
    ["A B C"],
    ["D E F"],
    ["G H I"],
    ["J K L"],
    ["M N O"],
    ["P Q R S"],
    ["T U V"],
    ["W X Y Z"],
    [""],
  ],
};

enum BackEventPriorityType {
  LockPage = 1001,
  Alert = 1000,
  Modal = 500,
  Scanner = 103,
  Page = 102,
  Tab = 101,
}

export {
  BackEventPriorityType, CardType,
  OperationType, PASSCODE_MAPPING, RequestType, ToastMsgType
};

