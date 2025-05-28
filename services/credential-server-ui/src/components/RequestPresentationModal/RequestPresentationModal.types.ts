import { Contact } from "../../pages/Connections/components/ConnectionsTable/ConnectionsTable.types";

interface ReviewProps {
  credentialType?: string;
  connectionId?: string;
  attribute: Record<string, string>;
  connections: Contact[];
}

interface InputAttributeProps {
  attributeOptional?: boolean;
  attributes: string[];
  value: Record<string, string>;
  setValue: (key: string, value: string) => void;
}

interface SelectListData {
  id: string;
  text: string;
  subText?: string;
}

interface SelectListProps {
  value?: string;
  onChange: (value: string) => void;
  data: SelectListData[];
}

interface RequestPresentationModalProps {
  open: boolean;
  onClose: () => void;
  connectionId?: string;
}

enum RequestPresentationStage {
  SelectConnection,
  SelectCredentialType,
  InputAttribute,
  Review,
}

export { RequestPresentationStage };
export type {
  InputAttributeProps,
  RequestPresentationModalProps,
  ReviewProps,
  SelectListData,
  SelectListProps,
};
