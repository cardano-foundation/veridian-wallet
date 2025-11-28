import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";

interface SetGroupNameProps {
  identifier: IdentifierShortDetails;
  onClose?: (newProfile?: IdentifierShortDetails) => void;
}

export type { SetGroupNameProps };
