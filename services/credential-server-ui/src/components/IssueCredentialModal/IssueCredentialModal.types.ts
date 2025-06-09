import { Contact } from "../../pages/Connections/components/ConnectionsTable/ConnectionsTable.types";

interface ReviewProps {
  credentialType?: string;
  connectionId?: string;
  attribute: Record<string, string>;
  connections: Contact[];
}

interface InputAttributeProps {
  attributes: string[];
  value: Record<string, string>;
  setValue: (key: string, value: string) => void;
  required: boolean;
}

interface IssueCredListData {
  id: string;
  text: string;
  subText?: string;
}

interface IssueCredListTemplateProps {
  value?: string;
  onChange: (value: string) => void;
  data: IssueCredListData[];
}

interface IssueCredentialModalProps {
  open: boolean;
  onClose: () => void;
  credentialTypeId?: string;
  connectionId?: string;
}

enum IssueCredentialStage {
  SelectConnection,
  SelectCredentialType,
  InputAttribute,
  Review,
}

export { IssueCredentialStage };
export type {
  InputAttributeProps,
  IssueCredentialModalProps,
  IssueCredListData,
  IssueCredListTemplateProps,
  ReviewProps,
};
