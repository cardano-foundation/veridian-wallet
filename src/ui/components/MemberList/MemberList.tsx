import { IonIcon } from "@ionic/react";
import {
  checkmark,
  closeOutline,
  hourglassOutline,
  star,
} from "ionicons/icons";
import { i18n } from "../../../i18n";
import { combineClassNames } from "../../utils/style";
import { CardDetailsItem } from "../CardDetails";
import { FallbackIcon } from "../FallbackIcon";
import "./MemberList.scss";
import { MemberAcceptStatus, MemberListProps } from "./MemberList.type";

export const MemberList = ({
  members,
  bottomText,
  mask,
  fullText,
}: MemberListProps) => {
  return (
    <>
      {members.map((item, index) => {
        const { name, avatar: Avatar, isCurrentUser, status } = item;

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
          <CardDetailsItem
            key={index}
            info={name}
            startSlot={
              Avatar ?? (
                <FallbackIcon
                  className="member-avatar"
                  slot="start"
                  alt="keri"
                />
              )
            }
            className="member"
            testId={`group-member-${index}`}
            mask={mask}
            fullText={fullText}
            endSlot={
              <>
                {isCurrentUser && (
                  <div className="user-label">
                    <IonIcon icon={star} />
                    <span>{i18n.t("profiledetails.detailsmodal.you")}</span>
                  </div>
                )}
                {icon && (
                  <div className={statusClasses}>
                    <IonIcon icon={icon} />
                  </div>
                )}
              </>
            }
          />
        );
      })}
      {bottomText && <p className="bottom-text">{bottomText}</p>}
    </>
  );
};
