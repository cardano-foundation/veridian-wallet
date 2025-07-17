export interface HabNameParts {
  version?: string;
  displayName: string;
  isGroupMember?: boolean;
  groupId?: string;
  isInitiator?: boolean;
  userName?: string;
  theme?: string;
}

// Old format: theme:isInitiator-groupId:displayName or  theme:displayName
// New format: version:theme:isInitiator-groupId-userName:displayName or version:theme:displayName
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
        isGroupMember: false,
      };
    }

    const groupParts = parts[2].split("-");
    if (groupParts.length !== 3) {
      throw new Error(
        "Invalid new format name: Invalid group part format (expected isInitiator-groupId-userName)"
      );
    }

    const [isInitiatorStr, groupId, userName] = groupParts;
    if (isInitiatorStr !== "1" && isInitiatorStr !== "0") {
      throw new Error("Invalid new format name: isInitiator must be 1 or 0.");
    }
    if (!groupId || groupId.trim() === "") {
      throw new Error("Invalid new format name: groupId cannot be empty.");
    }
    if (!userName || userName.trim() === "") {
      throw new Error("Invalid new format name: userName cannot be empty.");
    }

    return {
      version,
      theme,
      isGroupMember: true,
      isInitiator: isInitiatorStr === "1",
      groupId,
      userName,
      displayName,
    };
  }

  // Handle old format: theme:isInitiator-groupId:displayName or theme:displayName
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
      isGroupMember: false,
    };
  }

  const groupParts = parts[1].split("-");
  if (groupParts.length !== 2) {
    throw new Error(
      "Invalid old format name: Invalid group part format (expected isInitiator-groupId)."
    );
  }

  const [isInitiatorStr, groupId] = groupParts;
  if (isInitiatorStr !== "1" && isInitiatorStr !== "0") {
    throw new Error("Invalid old format name: isInitiator must be 1 or 0.");
  }
  if (!groupId || groupId.trim() === "") {
    throw new Error("Invalid old format name: groupId cannot be empty.");
  }

  return {
    theme,
    isGroupMember: true,
    isInitiator: isInitiatorStr === "1",
    groupId,
    displayName,
  };
}

export function formatToV1_2_0_3(parts: HabNameParts): string {
  const version = "1.2.0.3";
  const themePart = parts.theme || ""; // Ensure theme is not undefined
  const displayNamePart = parts.displayName || ""; // Ensure display name is not undefined

  if (parts.isGroupMember) {
    const isInitiatorStr = parts.isInitiator ? "1" : "0";
    const groupIdPart = parts.groupId || "";
    const userNamePart = parts.userName || "";
    return `${version}:${themePart}:${isInitiatorStr}-${groupIdPart}-${userNamePart}:${displayNamePart}`;
  } else {
    // For non-group members, the groupPart should be empty.
    // The new format is version:theme::displayName (empty groupPart)
    return `${version}:${themePart}:${displayNamePart}`;
  }
}
