import { renderHook, act } from "@testing-library/react";
import { ConnectionNoteDetails } from "../../../../core/agent/agent.types";
import { useNoteErrors } from "./useNoteErrors";

const mockNote: ConnectionNoteDetails = {
  id: "test-id",
  title: "Test Title",
  message: "Test Message",
};

const mockNoteWithError: ConnectionNoteDetails = {
  id: "error-id",
  title:
    "This is a very long title that exceeds the sixty four character limit for titles in the system",
  message: "Test Message",
};

describe("useNoteErrors", () => {
  it("should initialize with empty errors map", () => {
    const { result } = renderHook(() => useNoteErrors());

    expect(result.current.noteErrors.size).toBe(0);
    expect(result.current.hasErrors).toBe(false);
  });

  it("should initialize with provided notes and calculate errors", () => {
    const { result } = renderHook(() =>
      useNoteErrors([mockNote, mockNoteWithError])
    );

    expect(result.current.noteErrors.size).toBe(2);
    expect(result.current.noteErrors.get("test-id")).toBe(false);
    expect(result.current.noteErrors.get("error-id")).toBe(true);
    expect(result.current.hasErrors).toBe(true);
  });

  it("should update note error", () => {
    const { result } = renderHook(() => useNoteErrors([mockNote]));

    act(() => {
      result.current.updateNoteError("test-id", true);
    });

    expect(result.current.noteErrors.get("test-id")).toBe(true);
    expect(result.current.hasErrors).toBe(true);
  });

  it("should remove note error", () => {
    const { result } = renderHook(() =>
      useNoteErrors([mockNote, mockNoteWithError])
    );

    act(() => {
      result.current.removeNoteError("error-id");
    });

    expect(result.current.noteErrors.size).toBe(1);
    expect(result.current.noteErrors.has("error-id")).toBe(false);
    expect(result.current.hasErrors).toBe(false);
  });

  it("should add note error", () => {
    const { result } = renderHook(() => useNoteErrors());

    act(() => {
      result.current.addNoteError("new-id", true);
    });

    expect(result.current.noteErrors.get("new-id")).toBe(true);
    expect(result.current.hasErrors).toBe(true);
  });

  it("should recalculate errors for provided notes", () => {
    const { result } = renderHook(() => useNoteErrors());

    act(() => {
      result.current.recalculateErrors([mockNote, mockNoteWithError]);
    });

    expect(result.current.noteErrors.size).toBe(2);
    expect(result.current.noteErrors.get("test-id")).toBe(false);
    expect(result.current.noteErrors.get("error-id")).toBe(true);
    expect(result.current.hasErrors).toBe(true);
  });

  it("should reset errors", () => {
    const { result } = renderHook(() => useNoteErrors([mockNoteWithError]));

    act(() => {
      result.current.resetErrors();
    });

    expect(result.current.noteErrors.size).toBe(0);
    expect(result.current.hasErrors).toBe(false);
  });
});
