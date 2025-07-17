export interface HabNameParts {
  version?: string;
  displayName: string;
  isGroupMember?: boolean;
  groupId?: string;
  isInitiator?: boolean;
  userName?: string;
  theme?: string;
}

// Old format: theme:isInitiator-groupId:displayName
// New format: 1.2.0.3:theme:isInitiator-groupId-userName:displayName
export function parseHabName(name: string) {
  const parts = name.split(":");

  if (name.startsWith("1.2.0.3:")) {
    // New format
    if (parts.length < 2 || parts.length > 4) {
      throw new Error(
        "Invalid new format name: Expected between 2 and 4 parts separated by colons (version:theme:groupPart:displayName or version:theme:displayName)"
      );
    }

    if (parts.length === 3) {
      return {
        version: parts[0],
        theme: parts[1],
        displayName: parts[2],
        isGroupMember: false,
      };
    } else if (parts.length === 4) {
      const groupParts = parts[2].split("-");

      if (groupParts.length === 3) {
        return {
          version: parts[0],
          theme: parts[1],
          isGroupMember: true,
          isInitiator: groupParts[0] === "1",
          groupId: groupParts[1],
          userName: groupParts[2],
          displayName: parts[2],
        };
      } else {
        throw new Error(
          "Invalid new format name: Invalid group part format (expected isInitiator-groupId-userName or empty)."
        );
      }
    } else {
      // Old format
      if (parts.length < 2 || parts.length > 3) {
        throw new Error(
          "Invalid old format name: Expected beteen 2 and 3 parts separated by colons (theme:groupPart:displayName or theme:displayName)."
        );
      }
      if (parts.length === 2) {
        // Non-group member format
        return {
          theme: parts[0],
          displayName: parts[1],
          isGroupMember: false,
        };
      } else if (parts.length === 3) {
        const groupParts = parts[1].split("-");
        if (groupParts.length === 2) {
          return {
            theme: parts[0],
            isGroupMember: true,
            groupId: groupParts[1],
            isInitiator: groupParts[0] === "1",
            displayName: parts[2],
          };
        }
      }
    }
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
    return `${version}:${themePart}:${displayNamePart}`;
  }
}
