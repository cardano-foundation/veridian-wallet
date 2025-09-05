import { ConnectionNoteDetails } from "../../../../core/agent/agent.types";

interface ConnectionNoteProps {
  data: ConnectionNoteDetails;
  onDeleteNote: (noteId: string) => void;
  onNoteDataChange: (noteData: ConnectionNoteDetails) => void;
  onErrorChange: (id: string, hasError: boolean) => void;
}

export type { ConnectionNoteProps };
