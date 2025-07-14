export interface HabNameParts {
  version: string | null;
  displayName: string;
  isGroupMember: boolean;
  groupId: string | null;
  isInitiator: boolean | null;
  userName: string | null;
  theme: string | null; // just for old format
}

export function parseHabName(name: string): HabNameParts {
  if (name.startsWith("v1.2.0.3:")) {
    const version = "v1.2.0.3";
    const rest = name.substring(version.length + 1);

    let displayName: string;
    let isGroupMember = false;
    let groupId: string | null = null;
    let isInitiator: boolean | null = null;
    let userName: string | null = null;

    const lastColonIndex = rest.lastIndexOf(":");

    if (lastColonIndex === -1) {
      // New format, but no colon after version, so it's just a display name
      displayName = rest;
    } else {
      const potentialGroupPart = rest.substring(0, lastColonIndex);
      const extractedDisplayName = rest.substring(lastColonIndex + 1);

      // Check if potentialGroupPart matches the group member pattern: <isInitiator>-<groupId>-<userName>
      const groupParts = potentialGroupPart.split("-");
      const isGroupPattern =
        (groupParts[0] === "0" || groupParts[0] === "1") &&
        groupParts.length >= 2;

      if (isGroupPattern) {
        isGroupMember = true;
        isInitiator = groupParts[0] === "1";
        groupId = groupParts.slice(1, groupParts.length - 1).join("-");
        userName = groupParts[groupParts.length - 1];
        displayName = extractedDisplayName;
      } else {
        // It's a simple display name that happened to contain a colon, or a malformed group part
        displayName = rest; // The whole rest is the display name
      }
    }

    // Universal check for displayName containing colons in new format
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
      theme: null,
    };
  } else {
    // Old format: <theme>:<isInitiator>-<groupId>:<displayName> OR <theme>:<displayName>
    const parts = name.split(":");

    if (parts.length < 2) {
      throw new Error("Invalid old format name: Missing colon.");
    }

    if (parts.length > 3) {
      throw new Error(
        "Invalid old format name: Display name cannot contain colons."
      );
    }

    const theme = parts[0];
    let displayName: string;
    let isGroupMember = false;
    let groupId: string | null = null;
    let isInitiator: boolean | null = null;

    if (parts.length === 2) {
      // Only one colon: <theme>:<displayName>
      displayName = parts[1];

      // If there's only one colon, but the rest contains hyphens, it's a malformed group.
      if (displayName.includes("-")) {
        throw new Error("Invalid old format name: Malformed group structure.");
      }
    } else {
      // parts.length === 3, so <theme>:<isInitiator>-<groupId>:<displayName>
      const middlePart = parts[1];
      displayName = parts[2];

      const groupParts = middlePart.split("-");
      // The check must ensure there are at least 2 parts (initiator and groupId)
      // and that the initiator flag is valid ('0' or '1').
      // The groupId can contain at most one hyphen, so groupParts can have a max length of 3.
      if (
        groupParts.length < 2 ||
        groupParts.length > 3 ||
        (groupParts[0] !== "0" && groupParts[0] !== "1")
      ) {
        throw new Error("Invalid old format name: Malformed group structure.");
      }

      isGroupMember = true;
      isInitiator = groupParts[0] === "1";
      // The rest of the parts form the groupId, allowing it to contain hyphens.
      groupId = groupParts.slice(1).join("-");
    }

    return {
      version: null,
      displayName,
      isGroupMember,
      groupId,
      isInitiator,
      userName: null,
      theme,
    };
  }
}

export function formatToV1_2_0_3(parts: HabNameParts): string {
  const version = "v1.2.0.3";
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
