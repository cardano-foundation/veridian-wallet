import { addOutline } from "ionicons/icons";
import { IonText } from "@ionic/react";
import { ConnectionNotesProps } from "./ConnectionNotes.types";
import { i18n } from "../../../../../i18n";
import { PageFooter } from "../../../../components/PageFooter";
import { CardDetailsBlock } from "../../../../components/CardDetails";
import "./ConnectionNotes.scss";

const ConnectionNotes = ({
  notes,
  onOptionButtonClick,
  pageId,
}: ConnectionNotesProps) => {
  return (
    <>
      {notes.length > 0 ? (
        notes.map((note, index) => (
          <CardDetailsBlock
            key={index}
            className="connection-details-notes"
            title={
              index === 0
                ? i18n.t("tabs.connections.details.notes.title")
                : undefined
            }
          >
            {note.title && (
              <h4 className="connection-details-note-title">{note.title}</h4>
            )}
            {note.message && (
              <IonText className="connection-details-note-text">
                {note.message}
              </IonText>
            )}
          </CardDetailsBlock>
        ))
      ) : (
        <p className="connection-notes-empty">
          {i18n.t("tabs.connections.details.nocurrentnotesext")}
        </p>
      )}
      <PageFooter
        pageId={pageId}
        primaryButtonIcon={notes.length > 0 ? "" : addOutline}
        primaryButtonText={`${
          notes.length > 0
            ? i18n.t("tabs.connections.details.options.labels.manage")
            : i18n.t("tabs.connections.details.options.labels.add")
        }`}
        primaryButtonAction={onOptionButtonClick}
      />
    </>
  );
};

export { ConnectionNotes };
