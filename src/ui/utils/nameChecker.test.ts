import { nameChecker } from "./nameChecker";

describe("nameChecker", () => {
  it("should return true if name contains valid characters", () => {
    const name = "Name1_-";
    expect(nameChecker.isValidCharacters(name)).toBe(true);
  });
  it("should return true if name length is greater than 1 and less than 32", () => {
    const name = "Name 1_-";
    expect(nameChecker.isValidLength(name)).toBe(true);
  });
  it("should return false if name length is more than 32", () => {
    const name =
      "Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-Name1_-";
    expect(nameChecker.isValidLength(name)).toBe(false);
  });
  it("should return false if name has only space character", () => {
    const name = " ";
    expect(nameChecker.hasNonSpaceCharacter(name)).toBe(false);
  });
  it("should return true if name has normal characters and space character", () => {
    const name = "Name of you";
    expect(nameChecker.hasNonSpaceCharacter(name)).toBe(true);
  });
});
