import { IonButton, IonIcon, IonModal } from "@ionic/react";
import { addOutline, createOutline } from "ionicons/icons";
import { useEffect, useRef, useState } from "react";
import { Agent } from "../../../../core/agent/agent";
import { ConnectionNoteDetails } from "../../../../core/agent/agent.types";
import { i18n } from "../../../../i18n";
import { useAppDispatch } from "../../../../store/hooks";
import { setToastMsg } from "../../../../store/reducers/stateCache";
import { Alert } from "../../../components/Alert";
import { ScrollablePageLayout } from "../../../components/layout/ScrollablePageLayout";
import { PageFooter } from "../../../components/PageFooter";
import { PageHeader } from "../../../components/PageHeader";
import { ToastMsgType } from "../../../globals/types";
import { showError } from "../../../utils/error";
import ConnectionDetailsHeader from "./ConnectionDetailsHeader";
import { ConnectionNote } from "./ConnectionNote";
import "./EditConnectionsModal.scss";
import { EditConnectionsModalProps } from "./EditConnectionsModal.types";

export const EditConnectionsContainer = ({
  notes,
  setNotes,
  modalIsOpen,
  setModalIsOpen,
  connectionDetails,
  onConfirm,
}: EditConnectionsModalProps) => {
  const TEMP_ID_PREFIX = "temp";
  const dispatch = useAppDispatch();
  const [updatedNotes, setUpdatedNotes] = useState<ConnectionNoteDetails[]>([
    ...notes,
  ]);
  const [alertDeleteNoteIsOpen, setAlertDeleteNoteIsOpen] = useState(false);
  const deleteNoteId = useRef("");

  useEffect(() => {
    if (modalIsOpen) setUpdatedNotes([...notes]);
  }, [modalIsOpen, notes]);

  const confirm = async () => {
    try {
      const filteredNotes = updatedNotes.filter(
        (note) => note.title !== "" && note.message !== ""
      );

      let update = false;

      await Promise.all(
        filteredNotes
          .filter((note) => note.id.includes(TEMP_ID_PREFIX))
          .map((note) => {
            update = true;
            return Agent.agent.connections.createConnectionNote(
              connectionDetails.id,
              note
            );
          })
      );

      await Promise.all(
        notes.map((note) => {
          const noteFind = filteredNotes.find(
            (noteFilter) => note.id === noteFilter.id
          );

          if (!noteFind) {
            update = true;
            return Agent.agent.connections.deleteConnectionNoteById(
              connectionDetails.id,
              note.id
            );
          }

          if (
            note.title !== noteFind.title ||
            note.message !== noteFind.message
          ) {
            update = true;
            return Agent.agent.connections.updateConnectionNoteById(
              connectionDetails.id,
              noteFind.id,
              noteFind
            );
          }
        })
      );

      if (update) {
        setNotes(filteredNotes);
        dispatch(setToastMsg(ToastMsgType.NOTES_UPDATED));
        onConfirm();
        update = false;
      }
    } catch (e) {
      showError(
        "Failed to update connection",
        e,
        dispatch,
        ToastMsgType.FAILED_UPDATE_CONNECTION
      );
    } finally {
      setModalIsOpen(false);
    }
  };

  const handleAddNewNote = () => {
    setUpdatedNotes((currentNotes) => [
      ...currentNotes,
      {
        title: "",
        message: "",
        id: TEMP_ID_PREFIX + Date.now(),
      },
    ]);
  };

  const handleUpdateNotes = (note: ConnectionNoteDetails) => {
    const updateNoteIndex = updatedNotes.findIndex(
      (currentNote) => currentNote.id === note.id
    );

    if (updateNoteIndex === -1) return;

    const updateNote = updatedNotes[updateNoteIndex];
    if (updateNote.message === note.message && updateNote.title === note.title)
      return;

    setUpdatedNotes((currentNotes) => {
      currentNotes[updateNoteIndex] = {
        ...note,
      };

      return [...currentNotes];
    });
  };

  const openAlert = (id: string) => {
    setAlertDeleteNoteIsOpen(true);
    deleteNoteId.current = id;
  };

  const handleDeleteNote = () => {
    if (!deleteNoteId.current) return;

    const newNotes = updatedNotes.filter(
      (note) => note.id !== deleteNoteId.current
    );
    setUpdatedNotes(newNotes);
    deleteNoteId.current = "";
    dispatch(setToastMsg(ToastMsgType.NOTE_REMOVED));
  };

  const cancelDeleteNote = () => setAlertDeleteNoteIsOpen(false);

  return (
    <>
      <ScrollablePageLayout
        activeStatus={modalIsOpen}
        header={
          <PageHeader
            closeButton={true}
            closeButtonLabel={`${i18n.t("connections.details.cancel")}`}
            closeButtonAction={() => {
              setModalIsOpen(false);
            }}
            actionButton={true}
            actionButtonAction={confirm}
            actionButtonLabel={`${i18n.t("connections.details.confirm")}`}
          />
        }
      >
        <div className="connection-details-content">
          <ConnectionDetailsHeader
            logo={connectionDetails?.logo}
            label={connectionDetails?.label}
            date={connectionDetails?.createdAtUTC}
          />
          <div className="connection-details-info-block">
            {updatedNotes.length ? (
              <>
                <h3 className="note-title">
                  {i18n.t("connections.details.notes")}
                </h3>
                {updatedNotes.map((note) => (
                  <ConnectionNote
                    data={note}
                    onNoteDataChange={handleUpdateNotes}
                    onDeleteNote={openAlert}
                    key={note.id}
                  />
                ))}
              </>
            ) : (
              <>
                <p className="connection-details-info-block-nonotes">
                  {i18n.t("connections.details.nocurrentnotesext")}
                </p>
                <PageFooter
                  pageId="edit-connections-modal"
                  primaryButtonIcon={addOutline}
                  primaryButtonText={`${i18n.t(
                    "connections.details.options.labels.add"
                  )}`}
                  primaryButtonAction={handleAddNewNote}
                />
              </>
            )}
          </div>
          <div className="connection-details-add-note">
            <IonButton
              shape="round"
              className="primary-button add-note-button"
              data-testid="add-note-button"
              onClick={handleAddNewNote}
            >
              <IonIcon
                slot="icon-only"
                icon={createOutline}
              />
            </IonButton>
          </div>
        </div>
      </ScrollablePageLayout>
      <Alert
        isOpen={alertDeleteNoteIsOpen}
        setIsOpen={setAlertDeleteNoteIsOpen}
        dataTestId="alert-confirm-delete-note"
        headerText={i18n.t(
          "connections.details.options.alert.deletenote.title"
        )}
        confirmButtonText={`${i18n.t(
          "connections.details.options.alert.deletenote.confirm"
        )}`}
        cancelButtonText={`${i18n.t(
          "connections.details.options.alert.deletenote.cancel"
        )}`}
        actionConfirm={handleDeleteNote}
        actionCancel={cancelDeleteNote}
        actionDismiss={cancelDeleteNote}
      />
    </>
  );
};

const EditConnectionsModal = ({
  notes,
  setNotes,
  modalIsOpen,
  setModalIsOpen,
  connectionDetails,
  onConfirm,
}: EditConnectionsModalProps) => {
  return (
    <IonModal
      isOpen={modalIsOpen}
      className="edit-connections-modal"
      data-testid="edit-connections-modal"
      onDidDismiss={() => {
        setModalIsOpen(false);
      }}
    >
      <EditConnectionsContainer
        notes={notes}
        setNotes={setNotes}
        connectionDetails={connectionDetails}
        onConfirm={onConfirm}
        modalIsOpen={modalIsOpen}
        setModalIsOpen={setModalIsOpen}
      />
    </IonModal>
  );
};

export { EditConnectionsModal };
