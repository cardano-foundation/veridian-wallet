const NOTE_VALIDATION_CONSTANTS = {
  TITLE_MAX_LENGTH: 64,
  MESSAGE_MAX_LENGTH: 576,
} as const;

const validateNoteContent = (title: string, message: string): boolean => {
  return (
    title.length > NOTE_VALIDATION_CONSTANTS.TITLE_MAX_LENGTH ||
    title.length < 1 ||
    message.length > NOTE_VALIDATION_CONSTANTS.MESSAGE_MAX_LENGTH ||
    message.length < 1
  );
};

export { NOTE_VALIDATION_CONSTANTS, validateNoteContent };
