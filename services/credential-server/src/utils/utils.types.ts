import { Dict } from "signify-ts";

export type BranFileContent = {
  bran: string;
  issuerBran: string;
};

export enum NotificationRoute {
  ExnIpexOffer = "/exn/ipex/offer",
}

export type Credential = {
  status: {
    s: string;
  };
  sad: Dict<any>;
  anc: Dict<any>;
  iss: Dict<any>;
};

export type QviCredential = {
  sad: Dict<any>;
};

export type LeCredential = {
  sad: Dict<any>;
  anc: Dict<any>;
  iss: Dict<any>;
  ancAttachment: string;
};

export type ExchangeMsg = {
  exn: {
    d: string;
    i: string;
  };
};
