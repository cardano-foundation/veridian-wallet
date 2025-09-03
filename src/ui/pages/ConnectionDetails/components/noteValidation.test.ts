import {
  validateNoteContent,
  NOTE_VALIDATION_CONSTANTS,
} from "./noteValidation";

describe("noteValidation", () => {
  describe("NOTE_VALIDATION_CONSTANTS", () => {
    it("should have correct title max length", () => {
      expect(NOTE_VALIDATION_CONSTANTS.TITLE_MAX_LENGTH).toBe(64);
    });

    it("should have correct message max length", () => {
      expect(NOTE_VALIDATION_CONSTANTS.MESSAGE_MAX_LENGTH).toBe(576);
    });
  });

  describe("validateNoteContent", () => {
    it("should return false for valid content", () => {
      const result = validateNoteContent("Valid Title", "Valid Message");
      expect(result).toBe(false);
    });

    it("should return true for title exceeding max length", () => {
      const longTitle = "A".repeat(
        NOTE_VALIDATION_CONSTANTS.TITLE_MAX_LENGTH + 1
      );
      const result = validateNoteContent(longTitle, "Valid Message");
      expect(result).toBe(true);
    });

    it("should return true for message exceeding max length", () => {
      const longMessage = "A".repeat(
        NOTE_VALIDATION_CONSTANTS.MESSAGE_MAX_LENGTH + 1
      );
      const result = validateNoteContent("Valid Title", longMessage);
      expect(result).toBe(true);
    });

    it("should return true for both title and message exceeding max length", () => {
      const longTitle = "A".repeat(
        NOTE_VALIDATION_CONSTANTS.TITLE_MAX_LENGTH + 1
      );
      const longMessage = "A".repeat(
        NOTE_VALIDATION_CONSTANTS.MESSAGE_MAX_LENGTH + 1
      );
      const result = validateNoteContent(longTitle, longMessage);
      expect(result).toBe(true);
    });

    it("should return false for empty strings", () => {
      const result = validateNoteContent("", "");
      expect(result).toBe(false);
    });

    it("should return false for title at max length", () => {
      const maxTitle = "A".repeat(NOTE_VALIDATION_CONSTANTS.TITLE_MAX_LENGTH);
      const result = validateNoteContent(maxTitle, "Valid Message");
      expect(result).toBe(false);
    });

    it("should return false for message at max length", () => {
      const maxMessage = "A".repeat(
        NOTE_VALIDATION_CONSTANTS.MESSAGE_MAX_LENGTH
      );
      const result = validateNoteContent("Valid Title", maxMessage);
      expect(result).toBe(false);
    });
  });
});
