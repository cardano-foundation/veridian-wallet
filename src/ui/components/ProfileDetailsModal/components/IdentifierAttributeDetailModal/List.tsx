import { IonButton, IonIcon } from "@ionic/react";
import { pencilOutline } from "ionicons/icons";
import { i18n } from "../../../../../i18n";
import { CardBlock, FlatBorderType } from "../../../CardDetails";
import { ListHeader } from "../../../ListHeader";
import { MemberList } from "../../../MemberList";
import { ListProps } from "./IdentifierAttributeDetailModal.types";

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
        <MemberList
          members={data}
          bottomText={bottomText}
          mask={mask}
          fullText={fullText}
        />
      </CardBlock>
    </>
  );
};

export { List };
