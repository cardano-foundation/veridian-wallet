import { ConnectionShortDetails } from "../../../../core/agent/agent.types";
import { ACDCDetails } from "../../../../core/agent/services/credentialService.types";

interface MemberInfo {
  aid: string;
  name: string;
  joinedCred?: string;
}

enum DetailView {
  Attributes = "attributes",
}
interface IssuerProps {
  connectionShortDetails: ConnectionShortDetails | undefined;
  setOpenConnectionlModal: (value: boolean) => void;
}

interface CredentialContentProps extends IssuerProps {
  cardData: ACDCDetails;
  joinedCredRequestMembers?: MemberInfo[];
}

interface IssuedIdentifierProps {
  identifierId: string;
}

export type { CredentialContentProps, IssuedIdentifierProps, IssuerProps };

export { DetailView };
