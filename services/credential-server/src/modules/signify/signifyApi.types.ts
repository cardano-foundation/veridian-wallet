import { Dict } from "signify-ts";

enum NotificationRoute {
  ExnIpexOffer = "/exn/ipex/offer",
}

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
  Credential,
  QviCredential,
  LeCredential,
  ExchangeMsg,
};
