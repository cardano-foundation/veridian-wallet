import { IonIcon, IonItem, IonText } from "@ionic/react";
import { checkmark, closeOutline, hourglassOutline } from "ionicons/icons";
import { combineClassNames } from "../../../utils/style";
import { FallbackIcon } from "../../FallbackIcon";
import "./MultisigMember.scss";
import { MemberAcceptStatus, MemberProps } from "./MultisigMember.types";

const MultisigMember = ({ name, status }: MemberProps) => {
  const statusClasses = combineClassNames("status", {
    accepted: status === MemberAcceptStatus.Accepted,
    waiting: status === MemberAcceptStatus.Waiting,
    rejected: status === MemberAcceptStatus.Rejected,
  });

  const icon = (() => {
    switch (status) {
      case MemberAcceptStatus.Accepted:
        return checkmark;
      case MemberAcceptStatus.Rejected:
        return closeOutline;
      case MemberAcceptStatus.Waiting:
        return hourglassOutline;
      default:
        return null;
    }
  })();

  return (
    <IonItem
      lines="none"
      className="multisig-member"
    >
      <FallbackIcon
        className="member-avatar"
        slot="start"
        alt="keri"
      />
      <IonText
        slot="start"
        className="member-name"
      >
        {name}
      </IonText>
      {status !== undefined && icon && (
        <IonIcon
          slot="end"
          icon={icon}
          className={statusClasses}
        />
      )}
    </IonItem>
  );
};

export { MultisigMember };
