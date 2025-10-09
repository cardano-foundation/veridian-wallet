import { IdentifierDetails } from "../../../core/agent/services/identifier.types";

interface EditProfileProps {
  modalIsOpen: boolean;
  setModalIsOpen: (value: boolean) => void;
  cardData: IdentifierDetails;
  setCardData: (data: IdentifierDetails) => void;
  editType?: "name" | "userName";
}

export type { EditProfileProps };
