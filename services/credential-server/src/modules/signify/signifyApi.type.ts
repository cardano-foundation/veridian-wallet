import { Dict } from "signify-ts";

enum NotificationRoute {
  ExnIpexOffer = "/exn/ipex/offer",
}

type SchemasListResult = {
  count: number;
  schemasList: any[];
};

type CredentialsListResult = {
  count: number;
  credentialsList: any[];
};

type Notifications = {
  notifications: any;
};

type ExchangesListResult = {
  count: number;
  exchangesList: any[];
};

type Credential = {
  status: {
    s: string;
  };
  sad: Dict<any>;
  anc: Dict<any>;
  iss: Dict<any>;
};

type QviCredential = {
  sad: Dict<any>;
};

type LeCredential = {
  sad: Dict<any>;
  anc: Dict<any>;
  iss: Dict<any>;
  ancAttachment: string;
};

type ExchangeMsg = {
  exn: {
    d: string;
    i: string;
  };
};

export {
  NotificationRoute,
  SchemasListResult,
  CredentialsListResult,
  Notifications,
  ExchangesListResult,
  Credential,
  QviCredential,
  LeCredential,
  ExchangeMsg,
};
