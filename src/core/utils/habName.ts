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
    // new format: v1.2.0:<isInitiator>-<groupId>-<userName>:<displayName>
    const version = "v1.2.0.3";
    const rest = name.substring(version.length + 1);
    const parts = rest.split(":");

    if (parts.length === 2) {
      // group member (ej: 0-f45gb21-:MyGroup)
      const groupParts = parts[0].split("-");
      return {
        version,
        displayName: parts[1],
        isGroupMember: true,
        isInitiator: groupParts[0] === "1",
        groupId: groupParts[1],
        userName: groupParts[2],
        theme: null,
      };
    } else {
      // (ex: MyWallet)
      return {
        version,
        displayName: parts[0],
        isGroupMember: false,
        groupId: null,
        isInitiator: null,
        userName: null,
        theme: null,
      };
    }
  } else {
    // Old format: <theme>:<isInitiator>-<groupId>:<displayName>
    const parts = name.split(":");
    const theme = parts[0];

    if (parts.length === 3) {
      const groupParts = parts[1].split("-");
      return {
        version: null,
        displayName: parts[2],
        isGroupMember: true,
        isInitiator: groupParts[0] === "1",
        groupId: groupParts[1],
        userName: null,
        theme,
      };
    } else {
      // TODO: raise error?
      return {
        version: null,
        displayName: parts[1],
        isGroupMember: false,
        groupId: null,
        isInitiator: null,
        userName: null,
        theme,
      };
    }
  }
}

export function formatToV1_2_0_3(parts: HabNameParts): string {
  const version = "v1.2.0.3";
  if (parts.isGroupMember) {
    const initiator = parts.isInitiator ? "1" : "0";
    const userName = parts.userName ?? "";
    return `${version}:${initiator}-${parts.groupId}-${userName}:${parts.displayName}`;
  } else {
    return `${version}:${parts.displayName}`;
  }
}
