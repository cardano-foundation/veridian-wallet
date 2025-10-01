import { IonButton, IonIcon } from "@ionic/react";
import { pencilOutline, star } from "ionicons/icons";
import { i18n } from "../../../../../i18n";
import {
  CardBlock,
  CardDetailsItem,
  FlatBorderType,
} from "../../../CardDetails";
import { ListHeader } from "../../../ListHeader";
import { ListProps } from "./IdentifierAttributeDetailModal.types";
import { FallbackIcon } from "../../../FallbackIcon";

const List = ({
  data,
  title,
  bottomText,
  fullText,
  mask,
  onButtonClick,
}: ListProps) => {
  return (
    <>
      <ListHeader title={title} />
      <CardBlock
        className="edit-username-button-container"
        flatBorder={FlatBorderType.BOT}
        testId="edit-username-button-block"
      >
        <IonButton
          shape="round"
          className="edit-username-button"
          data-testid="edit-username-button"
          onClick={onButtonClick}
        >
          <p>{i18n.t("profiledetails.group.groupmembers.editname")}</p>
          <IonIcon icon={pencilOutline} />
        </IonButton>
      </CardBlock>
      <CardBlock
        testId="group-member-block"
        className="list-item"
        flatBorder={FlatBorderType.TOP}
      >
        {data.map((item, index) => {
          return (
            <CardDetailsItem
              key={index}
              info={item.title}
              startSlot={
                item.avatar ? item.avatar : <FallbackIcon src={item.image} />
              }
              className="member"
              testId={`group-member-${item.title}`}
              mask={mask}
              fullText={fullText}
              endSlot={
                item.isCurrentUser && (
                  <div className="user-label">
                    <IonIcon icon={star} />
                    <span>{i18n.t("profiledetails.detailsmodal.you")}</span>
                  </div>
                )
              }
            />
          );
        })}
        <p className="bottom-text">{bottomText}</p>
      </CardBlock>
    </>
  );
};

export { List };
