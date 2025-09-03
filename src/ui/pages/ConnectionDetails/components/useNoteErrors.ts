import { useCallback, useState } from "react";
import { ConnectionNoteDetails } from "../../../../core/agent/agent.types";
import { validateNoteContent } from "./noteValidation";

export const useNoteErrors = (notes: ConnectionNoteDetails[] = []) => {
  const [noteErrors, setNoteErrors] = useState<Map<string, boolean>>(() => {
    const initialErrors = new Map<string, boolean>();
    notes.forEach((note) => {
      const hasError = validateNoteContent(note.title, note.message);
      initialErrors.set(note.id, hasError);
    });
    return initialErrors;
  });

  const updateNoteError = useCallback((id: string, hasError: boolean) => {
    setNoteErrors((prev) => new Map(prev).set(id, hasError));
  }, []);

  const removeNoteError = useCallback((id: string) => {
    setNoteErrors((prev) => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const addNoteError = useCallback((id: string, hasError = false) => {
    setNoteErrors((prev) => new Map(prev).set(id, hasError));
  }, []);

  const recalculateErrors = useCallback((notes: ConnectionNoteDetails[]) => {
    const newNoteErrors = new Map<string, boolean>();
    notes.forEach((note) => {
      const hasError = validateNoteContent(note.title, note.message);
      newNoteErrors.set(note.id, hasError);
    });
    setNoteErrors(newNoteErrors);
  }, []);

  const resetErrors = useCallback(() => {
    setNoteErrors(new Map());
  }, []);

  const hasErrors = Array.from(noteErrors.values()).some(Boolean);

  return {
    noteErrors,
    hasErrors,
    updateNoteError,
    removeNoteError,
    addNoteError,
    recalculateErrors,
    resetErrors,
  };
};
