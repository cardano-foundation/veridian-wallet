import { PresentationRequestData } from "../../store/reducers/connectionsSlice.types";

export interface PresentationDetailModalProps {
  open: boolean;
  onClose: () => void;
  data: PresentationRequestData | null;
}

export interface CredentialStatus {
  status: "issued" | "revoked";
  issuer: string;
  holder: string;
  issuanceDate: string;
  credentialSAD?: any;
}

export interface SchemaInfo {
  title: string;
  description: string;
  properties: any;
}
