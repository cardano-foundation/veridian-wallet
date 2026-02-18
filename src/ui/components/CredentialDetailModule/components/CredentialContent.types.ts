import { ConnectionShortDetails } from "../../../../core/agent/agent.types";
import { ACDCDetails } from "../../../../core/agent/services/credentialService.types";

enum DetailView {
  Attributes = "attributes",
}
interface IssuerProps {
  connectionShortDetails: ConnectionShortDetails | undefined;
  setOpenConnectionlModal: (value: boolean) => void;
}

interface CredentialContentProps extends IssuerProps {
  cardData: ACDCDetails;
}

interface IssuedIdentifierProps {
  identifierId: string;
}

export type { CredentialContentProps, IssuedIdentifierProps, IssuerProps };

export { DetailView };
