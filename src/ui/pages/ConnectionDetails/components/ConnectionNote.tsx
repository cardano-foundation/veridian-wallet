import { useEffect, useRef, useState } from "react";
import { trashOutline } from "ionicons/icons";
import { IonButton, IonIcon, IonInput, IonTextarea } from "@ionic/react";
import { i18n } from "../../../../i18n";
import { ConnectionNoteProps } from "./ConnectionNote.types";
import { useHideKeyboard } from "../../../hooks/useHideKeyboard";
import { ErrorMessage } from "../../../components/ErrorMessage";
import {
  validateNoteContent,
  NOTE_VALIDATION_CONSTANTS,
} from "./noteValidation";

const ConnectionNote = ({
  data,
  onNoteDataChange,
  onDeleteNote,
  onErrorChange,
}: ConnectionNoteProps) => {
  const { title, message, id } = data;
  const [newTitle, setNewTitle] = useState(title);
  const [newMessage, setNewMessage] = useState(message);
  const { hideKeyboard } = useHideKeyboard();

  const hasError = validateNoteContent(newTitle, newMessage);
  const titleError =
    newTitle.length > NOTE_VALIDATION_CONSTANTS.TITLE_MAX_LENGTH;
  const messageError =
    newMessage.length > NOTE_VALIDATION_CONSTANTS.MESSAGE_MAX_LENGTH;

  const hasErrorRef = useRef<boolean>();
  useEffect(() => {
    onErrorChange(id, hasError);
    hasErrorRef.current = hasError;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hasErrorRef.current !== hasError) {
      onErrorChange(id, hasError);
      hasErrorRef.current = hasError;
    }
  }, [hasError, onErrorChange, id]);

  useEffect(() => {
    onErrorChange(id, hasError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitNoteChange = () => {
    onNoteDataChange({
      id: id,
      title: newTitle,
      message: newMessage,
    });
  };

  return (
    <div
      data-testid="connection-note"
      className="connection-details-info-block-inner"
    >
      <div className="connection-details-info-block-line">
        <div className="connection-details-info-block-data">
          <div className="connection-details-info-block-title">
            <span>{i18n.t("tabs.connections.details.notes.notetitle")}</span>
            <span data-testid="title-length">
              {newTitle.length}/{NOTE_VALIDATION_CONSTANTS.TITLE_MAX_LENGTH}
            </span>
          </div>
          <IonInput
            aria-label={`${i18n.t("tabs.connections.details.notes.notetitle")}`}
            data-testid={`edit-connections-modal-note-title-${id}`}
            placeholder={`${i18n.t(
              "tabs.connections.details.notes.placeholders.title"
            )}`}
            onIonInput={(e) => setNewTitle(`${e.target.value ?? ""}`)}
            onIonBlur={submitNoteChange}
            value={newTitle}
            onKeyDown={hideKeyboard}
          />
          {titleError && (
            <ErrorMessage
              message={`${i18n.t(
                "tabs.connections.details.notes.errors.title"
              )}`}
            />
          )}
        </div>
        <div className="connection-details-info-block-data">
          <div className="connection-details-info-block-title">
            <span>{i18n.t("tabs.connections.details.notes.notemessage")}</span>
            <span>
              {newMessage.length}/{NOTE_VALIDATION_CONSTANTS.MESSAGE_MAX_LENGTH}
            </span>
          </div>
          <IonTextarea
            autoGrow={true}
            data-testid={`edit-connections-modal-note-message-${id}`}
            placeholder={`${i18n.t(
              "tabs.connections.details.notes.placeholders.message"
            )}`}
            onIonInput={(e) => setNewMessage(`${e.target.value ?? ""}`)}
            onIonBlur={submitNoteChange}
            value={newMessage}
          />
          {messageError && (
            <ErrorMessage
              message={`${i18n.t(
                "tabs.connections.details.notes.errors.message"
              )}`}
            />
          )}
        </div>
      </div>
      <div className="connection-details-delete-note">
        <IonButton
          shape="round"
          data-testid={`note-delete-button-${id}`}
          onClick={() => {
            onDeleteNote(id);
          }}
        >
          <IonIcon
            slot="icon-only"
            icon={trashOutline}
          />
        </IonButton>
      </div>
    </div>
  );
};

export { ConnectionNote };
