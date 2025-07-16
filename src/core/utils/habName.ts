export interface HabNameParts {
  version?: string;
  displayName: string;
  isGroupMember: boolean;
  groupId?: string;
  isInitiator?: boolean;
  userName?: string;
  theme?: string;
}

// Old format: theme:isInitiator-groupId:displayName
// New format: 1.2.0.3:theme:isInitiator-groupId-userName:displayName
export function parseHabName(name: string): HabNameParts {
  const parts = name.split(":");

  if (name.startsWith("1.2.0.3:")) {
    // New format
    if (parts.length !== 4) {
      throw new Error(
        "Invalid new format name: Expected 4 parts separated by colons (version:theme:groupPart:displayName)."
      );
    }

    const [version, theme, groupPart, displayName] = parts;

    if (!version || !theme || !displayName) {
      throw new Error(
        "Invalid new format name: Missing version, theme, or display name."
      );
    }

    let isGroupMember = false;
    let groupId;
    let userName;
    let isInitiator;

    const groupParts = groupPart.split("-");
    if (groupParts.length === 3) {
      // isInitiator-groupId-userName
      isInitiator = groupParts[0] === "1";
      groupId = groupParts[1];
      userName = groupParts[2];

      // Stricter validation for group parts content
      if (groupId === "" || userName === "") {
        throw new Error(
          "Invalid new format name: Invalid group part format (expected isInitiator-groupId-userName or empty)."
        );
      }
      isGroupMember = true; // If it has 3 parts, it's a group member
    } else if (groupParts.length === 1 && groupParts[0] === "") {
      // Case for non-group member, where groupPart is empty
      isGroupMember = false;
    } else {
      throw new Error(
        "Invalid new format name: Invalid group part format (expected isInitiator-groupId-userName or empty)."
      );
    }

    return {
      version,
      displayName,
      isGroupMember,
      groupId,
      isInitiator,
      userName,
      theme,
    };
  } else {
    // Old format
    if (parts.length !== 3) {
      throw new Error(
        "Invalid old format name: Expected 3 parts separated by colons (theme:groupPart:displayName)."
      );
    }

    const [theme, groupPart, displayName] = parts;

    if (!theme || !displayName) {
      throw new Error(
        "Invalid old format name: Missing theme or display name."
      );
    }

    let isGroupMember;
    let groupId;
    let isInitiator;

    const groupParts = groupPart.split("-");
    if (groupParts.length === 2) {
      // isInitiator-groupId
      isInitiator = groupParts[0] === "1";
      groupId = groupParts[1];

      // Stricter validation for group parts content
      if (groupId === "") {
        throw new Error(
          "Invalid old format name: Invalid group part format (expected isInitiator-groupId or empty)."
        );
      }
      isGroupMember = true; // If it has 2 parts, it's a group member
    } else if (groupParts.length === 1 && groupParts[0] === "") {
      // Case for non-group member, where groupPart is empty
      isGroupMember = false;
    } else {
      throw new Error(
        "Invalid old format name: Invalid group part format (expected isInitiator-groupId or empty)."
      );
    }

    return {
      displayName,
      isGroupMember,
      groupId,
      isInitiator,
      theme,
    };
  }
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
    return `${version}:${themePart}::${displayNamePart}`;
  }
}
