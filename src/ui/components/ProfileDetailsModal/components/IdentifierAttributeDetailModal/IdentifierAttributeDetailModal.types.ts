import { IdentifierDetails } from "../../../../../core/agent/services/identifier.types";
import { Member } from "../../../MemberList/MemberList.type";

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
  openEdit?: () => void;
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

interface ListProps {
  title: string;
  data: Member[];
  bottomText?: string;
  fullText?: boolean;
  mask?: boolean;
  onButtonClick?: () => void;
}

export type {
  AdvancedProps,
  CreatedTimestampProps,
  IdentifierAttributeDetailModalProps,
  IdentifierIDDetailProps,
  ListProps,
  SenquenceNumberProps,
  SigningThresholdProps,
};

export { AccordionKey, DetailView };
