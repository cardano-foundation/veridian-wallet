export interface HabNameParts {
  version?: string;
  displayName: string;
  groupMetadata?: {
    groupInitiator: boolean;
    groupId: string;
    proposedUsername: string;
  };
  theme: string;
}

// Old format: theme:groupInitiator-groupId:displayName or  theme:displayName
// New format: version:theme:groupInitiator:groupId:proposedUsername:displayName or version:theme:displayName
export function parseHabName(name: string): HabNameParts {
  const parts = name.split(":");

  if (name.startsWith("1.2.0.2:")) {
    if (parts.length !== 3 && parts.length !== 6) {
      throw new Error(
        "Invalid new format name: Expected 3 or 6 parts separated by colons (version:theme:displayName or version:theme:groupInitiator:groupId:proposedUsername:displayName)."
      );
    }

    const version = parts[0];
    const theme = parts[1];

    if (parts.length === 3) {
      return {
        version,
        theme,
        displayName: parts[2],
      };
    }

    const groupInitiatorStr = parts[2];
    const groupId = parts[3];
    const proposedUsername = parts[4];
    const displayName = parts[5];

    if (groupInitiatorStr !== "1" && groupInitiatorStr !== "0") {
      throw new Error(
        "Invalid new format name: groupInitiator must be 1 or 0."
      );
    }
    if (!groupId || groupId.trim() === "") {
      throw new Error("Invalid new format name: groupId cannot be empty.");
    }

    return {
      version,
      theme,
      displayName,
      groupMetadata: {
        groupInitiator: groupInitiatorStr === "1",
        groupId,
        proposedUsername,
      },
    };
  }

  // Handle old format: theme:groupInitiator-groupId:displayName or theme:displayName
  if (parts.length !== 2 && parts.length !== 3) {
    throw new Error(
      "Invalid old format name: Expected 2 or 3 parts separated by colons (theme:groupPart:displayName or theme:displayName)."
    );
  }

  const theme = parts[0];
  const displayName = parts.length === 2 ? parts[1] : parts[2];

  if (!theme || !displayName) {
    throw new Error("Invalid old format name: Missing theme or display name.");
  }

  if (parts.length === 2) {
    return {
      theme,
      displayName,
    };
  }

  const groupPart = parts[1];
  const firstHyphenIndex = groupPart.indexOf("-");

  if (firstHyphenIndex === -1) {
    // Check for broken 1.1.X deleted mHab format: XX-salt:groupId:displayName
    // groupId never contains -, so if theme starts with XX- and groupPart has no hyphen,
    // this is a broken deleted mHab that's missing the isInitiator flag
    if (theme.startsWith("XX-")) {
      if (!groupPart || groupPart.trim() === "") {
        throw new Error("Invalid old format name: groupId cannot be empty.");
      }
      return {
        theme,
        displayName,
        groupMetadata: {
          groupInitiator: false, // Cannot be determined, default to false
          groupId: groupPart,
          proposedUsername: "",
        },
      };
    }
    throw new Error(
      "Invalid old format name: Invalid group part format (expected groupInitiator-groupId)."
    );
  }
  const groupInitiatorStr = groupPart.substring(0, firstHyphenIndex);
  const groupId = groupPart.substring(firstHyphenIndex + 1);

  if (groupInitiatorStr !== "1" && groupInitiatorStr !== "0") {
    throw new Error("Invalid old format name: groupInitiator must be 1 or 0.");
  }
  if (!groupId || groupId.trim() === "") {
    throw new Error("Invalid old format name: groupId cannot be empty.");
  }

  return {
    theme,
    displayName,
    groupMetadata: {
      groupInitiator: groupInitiatorStr === "1",
      groupId,
      proposedUsername: "",
    },
  };
}

export function formatToV1_2_0_2(parts: HabNameParts): string {
  const version = "1.2.0.2";
  const theme = parts.theme;
  const displayName = parts.displayName;

  if (parts.groupMetadata) {
    const initiatorFlag = parts.groupMetadata.groupInitiator ? "1" : "0";
    const groupId = parts.groupMetadata.groupId;
    const proposedUsername = parts.groupMetadata.proposedUsername;
    return `${version}:${theme}:${initiatorFlag}:${groupId}:${proposedUsername}:${displayName}`;
  } else {
    return `${version}:${theme}:${displayName}`;
  }
}

export const DELETED_IDENTIFIER_THEME = "XX";

export interface DeletedHabNameInput {
  displayName: string;
  groupMetadata?: {
    groupInitiator: boolean;
    groupId: string;
    proposedUsername: string;
  };
}

export function buildDeletedHabName(
  input: DeletedHabNameInput,
  salt: string
): string {
  const deletedTheme = `${DELETED_IDENTIFIER_THEME}-${salt}`;
  return formatToV1_2_0_2({
    theme: deletedTheme,
    displayName: input.displayName,
    groupMetadata: input.groupMetadata,
  });
}
