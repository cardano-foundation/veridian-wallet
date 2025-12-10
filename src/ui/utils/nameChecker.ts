import { i18n } from "../../i18n";

const nameRequirements = {
  validConnectionCharactersPattern: /^[a-zA-Z0-9-_\s]+$/,
  validCharactersPattern: /^[a-zA-Z0-9-_]+$/,
  lengthPattern: /^.{1,32}$/,
  onlySpacePattern: /^\s+$/,
};

const nameErrorMessages = {
  invalidCharacter: i18n.t("nameerror.hasspecialchar"),
  invalidMaxLength: i18n.t("nameerror.maxlength"),
  invalidMinLength: i18n.t("nameerror.onlyspace"),
  invalidSpaceCharacter: i18n.t("nameerror.onlyspace"),
};

const nameChecker = {
  isValidCharacters(name: string, allowSpace = false) {
    return allowSpace
      ? nameRequirements.validConnectionCharactersPattern.test(name)
      : nameRequirements.validCharactersPattern.test(name);
  },
  isValidLength(name: string) {
    return nameRequirements.lengthPattern.test(name);
  },
  hasNonSpaceCharacter(name: string) {
    return !nameRequirements.onlySpacePattern.test(name);
  },
  getError(name: string, allowSpace = false) {
    if (name.length > 32) {
      return nameErrorMessages.invalidMaxLength;
    }

    if (!name) {
      return nameErrorMessages.invalidMinLength;
    }

    if (!this.isValidCharacters(name, allowSpace)) {
      return nameErrorMessages.invalidCharacter;
    }

    if (!nameChecker.hasNonSpaceCharacter(name)) {
      return nameErrorMessages.invalidSpaceCharacter;
    }

    return undefined;
  },
};

function uniqueGroupName(desiredName: string, existingNames: string[]): string {
  if (!existingNames.includes(desiredName)) return desiredName;

  // Escape regex special characters
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const trimmed = desiredName.trim();

  // Detect if desiredName already has a numeric suffix (e.g. "Name #3")
  const suffixMatch = trimmed.match(/^(.*?)(?:\s*#\s*(\d+))\s*$/);
  const baseName = suffixMatch ? suffixMatch[1].trim() : trimmed;

  // Extract all existing display names

  const baseEsc = escapeRegExp(baseName);

  // Match: "Base", "Base#2", "Base #2" (case-insensitive)
  const re = new RegExp(`^${baseEsc}\\s*(?:#\\s*(\\d+))?$`, "i");

  const numbersUsed = new Set<number>();

  // Collect which numbers are already taken
  for (const name of existingNames) {
    const m = name.match(re);
    if (m) {
      const num = m[1] ? parseInt(m[1], 10) : 0;
      if (!Number.isNaN(num) && num >= 1) numbersUsed.add(num);
    }
  }

  // Find smallest number >=1 not used
  let candidate = 1;
  while (numbersUsed.has(candidate)) candidate++;

  return `${baseName} #${candidate}`;
}

export { nameChecker, uniqueGroupName };
