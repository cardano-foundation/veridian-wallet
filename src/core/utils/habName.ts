export interface HabNameParts {
  version: string | null;
  displayName: string;
  isGroupMember: boolean;
  groupId: string | null;
  isInitiator: boolean | null;
  userName: string | null;
  theme?: string | null;
}

// Old format: theme:isInitiator-groupId:displayName
// New format: 1.2.0.3:isInitiator-groupId-userName:displayName
export function parseHabName(name: string): HabNameParts {
  if (!name.includes(":")) {
    throw new Error("Invalid old format name: Missing colon.");
  }

  if (name.startsWith("1.2.0.3:")) {
    const version = "1.2.0.3";
    const rest = name.substring(version.length + 1);
    const lastColonIndex = rest.lastIndexOf(":");

    let displayName = rest;
    let isGroupMember = false;
    let groupId: string | null = null;
    let isInitiator: boolean | null = null;
    let userName: string | null = null;

    let potentialGroupPart = rest;
    let potentialDisplayName = "";

    if (lastColonIndex !== -1) {
      potentialGroupPart = rest.substring(0, lastColonIndex);
      potentialDisplayName = rest.substring(lastColonIndex + 1);
    }

    const groupParts = potentialGroupPart.split("-");
    const isGroupPattern =
      groupParts.length >= 3 &&
      (groupParts[0] === "0" || groupParts[0] === "1");

    if (isGroupPattern) {
      displayName = potentialDisplayName;
      isGroupMember = true;
      isInitiator = groupParts[0] === "1";
      userName =
        groupParts[groupParts.length - 1] === ""
          ? null
          : groupParts[groupParts.length - 1];
      groupId = groupParts.slice(1, groupParts.length - 1).join("-") || "";
    } else {
      displayName = rest;
    }

    if (displayName.includes(":")) {
      throw new Error(
        "Invalid new format name: Display name cannot contain colons."
      );
    }

    return {
      version,
      displayName,
      isGroupMember,
      groupId,
      isInitiator,
      userName,
    };
  } else {
    const firstColonIndex = name.indexOf(":");
    const lastColonIndex = name.lastIndexOf(":");

    const theme = name.substring(0, firstColonIndex);
    const displayName: string =
      lastColonIndex === firstColonIndex
        ? name.substring(firstColonIndex + 1)
        : name.substring(lastColonIndex + 1);
    let isGroupMember = false;
    let groupId: string | null = null;
    let userName: string | null = null;
    let isInitiator: boolean | null = null;

    if (firstColonIndex !== lastColonIndex) {
      const middlePart = name.substring(firstColonIndex + 1, lastColonIndex);
      if (middlePart.includes(":")) {
        throw new Error(
          "Invalid old format name: Display name cannot contain colons."
        );
      }
      const groupParts = middlePart.split("-");
      if (
        groupParts.length < 2 ||
        groupParts.length > 3 ||
        (groupParts[0] !== "0" && groupParts[0] !== "1")
      ) {
        throw new Error("Invalid old format name: Malformed group structure.");
      }

      isGroupMember = true;
      isInitiator = groupParts[0] === "1";
      if (groupParts.length === 3) {
        groupId = groupParts[1];
        userName = groupParts[2];
      } else {
        groupId = groupParts.slice(1).join("-") || "";
      }
    } else if (displayName.includes("-")) {
      throw new Error("Invalid old format name: Malformed group structure.");
    }

    if (displayName.includes(":")) {
      throw new Error(
        "Invalid old format name: Display name cannot contain colons."
      );
    }

    return {
      version: null,
      displayName,
      isGroupMember,
      groupId,
      isInitiator,
      userName,
      theme,
    };
  }
}

export function formatToV1_2_0_3(parts: HabNameParts): string {
  const version = "1.2.0.3";
  if (parts.isGroupMember) {
    const initiator = parts.isInitiator ? "1" : "0";
    const userName = parts.userName ?? "";
    return `${version}:${initiator}-${parts.groupId ?? ""}-${userName}:${
      parts.displayName
    }`;
  } else {
    return `${version}:${parts.displayName}`;
  }
}
