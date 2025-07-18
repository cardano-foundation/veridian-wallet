import { IdentifierDetails } from "../../../../../core/agent/services/identifier.types";

enum DetailView {
  GroupMember = "groupmember",
  SigningThreshold = "signingthreshold",
  RotationThreshold = "rotationthreshold",
  AdvancedDetail = "advanceddetail",
}

const AccordionKey = {
  SIGNINGKEY: "signingkey",
  ROTATIONKEY: "rotationkey",
};

interface IdentifierAttributeDetailModalProps {
  isOpen: boolean;
  setOpen: (value: boolean) => void;
  data: IdentifierDetails;
  view: DetailView;
  setViewType: (view: DetailView) => void;
}

interface IdentifierIDDetailProps {
  id: string;
}

interface SigningThresholdProps {
  data: IdentifierDetails;
  setViewType: (view: DetailView) => void;
}

interface CreatedTimestampProps {
  createdTime: string;
}

interface SenquenceNumberProps {
  data: IdentifierDetails;
}

interface AdvancedProps {
  data: IdentifierDetails;
  currentUserIndex: number;
}

interface ListItem {
  image?: string;
  title: string;
  isCurrentUser?: boolean;
}

interface ListProps {
  title: string;
  data: ListItem[];
  bottomText: string;
  fullText?: boolean;
  mask?: boolean;
}

export type {
  IdentifierAttributeDetailModalProps,
  IdentifierIDDetailProps,
  SigningThresholdProps,
  CreatedTimestampProps,
  SenquenceNumberProps,
  ListProps,
  ListItem,
  AdvancedProps,
};

export { DetailView, AccordionKey };
