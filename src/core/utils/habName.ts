export interface HabNameParts {
  version?: string;
  displayName: string;
  groupMetadata?: {
    groupInitiator: boolean;
    groupId: string;
    userName: string;
  };
  theme?: string;
}

// Old format: theme:groupInitiator-groupId:displayName or  theme:displayName
// New format: version:theme:groupInitiator-groupId-userName:displayName or version:theme:displayName
export function parseHabName(name: string): HabNameParts {
  const parts = name.split(":");

  if (name.startsWith("1.2.0.3:")) {
    if (parts.length < 3 || parts.length > 4) {
      throw new Error(
        "Invalid new format name: Expected 3 or 4 parts separated by colons (version:theme:groupPart:displayName or version:theme:displayName)."
      );
    }

    const version = parts[0];
    const theme = parts[1];
    const displayName = parts.length === 3 ? parts[2] : parts[3];

    if (parts.length === 3) {
      return {
        version,
        theme,
        displayName,
      };
    }

    const groupPart = parts[2];
    const firstHyphenIndex = groupPart.indexOf("-");
    const lastHyphenIndex = groupPart.lastIndexOf("-");

    if (
      firstHyphenIndex === -1 ||
      lastHyphenIndex === -1 ||
      firstHyphenIndex === lastHyphenIndex
    ) {
      throw new Error(
        "Invalid new format name: Invalid group part format (expected groupInitiator-groupId-userName)"
      );
    }

    const groupInitiatorStr = groupPart.substring(0, firstHyphenIndex);
    const groupId = groupPart.substring(firstHyphenIndex + 1, lastHyphenIndex);
    const userName = groupPart.substring(lastHyphenIndex + 1);

    if (groupInitiatorStr !== "1" && groupInitiatorStr !== "0") {
      throw new Error(
        "Invalid new format name: groupInitiator must be 1 or 0."
      );
    }
    if (!groupId || groupId.trim() === "") {
      throw new Error("Invalid new format name: groupId cannot be empty.");
    }
    if (!userName) {
      throw new Error("Invalid new format name: userName cannot be null.");
    }

    return {
      version,
      theme,
      displayName,
      groupMetadata: {
        groupInitiator: groupInitiatorStr === "1",
        groupId,
        userName,
      },
    };
  }

  // Handle old format: theme:groupInitiator-groupId:displayName or theme:displayName
  if (parts.length < 2 || parts.length > 3) {
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
      userName: "",
    },
  };
}

export function formatToV1_2_0_3(parts: HabNameParts): string {
  const version = "1.2.0.3";
  const themePart = parts.theme || ""; // Ensure theme is not undefined
  const displayNamePart = parts.displayName || ""; // Ensure display name is not undefined

  if (parts.groupMetadata) {
    const groupInitiatorStr = parts.groupMetadata.groupInitiator ? "1" : "0";
    const groupIdPart = parts.groupMetadata.groupId || "";
    const userNamePart = parts.groupMetadata.userName || "";
    return `${version}:${themePart}:${groupInitiatorStr}-${groupIdPart}-${userNamePart}:${displayNamePart}`;
  } else {
    return `${version}:${themePart}:${displayNamePart}`;
  }
}
