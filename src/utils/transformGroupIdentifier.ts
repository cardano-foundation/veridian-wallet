import {
  IdentifierDetails,
  IdentifierShortDetails,
} from "../core/agent/services/identifier.types";

interface TransformedOutput {
  [key: string]: IdentifierShortDetails;
}

export function transformGroupIdentifier(
  input: IdentifierDetails
): TransformedOutput {
  const output: TransformedOutput = {
    [input.id]: {
      displayName: input.displayName,
      id: input.id,
      createdAtUTC: input.createdAtUTC,
      theme: input.theme,
      creationStatus: input.creationStatus,
      groupMetadata: input.groupMemberPre ? undefined : input.groupMetadata,
      groupMemberPre: input.groupMemberPre,
      groupUsername: input.groupUsername ?? (input.di ? "" : undefined),
      groupId: input.groupMemberPre
        ? input.groupId
        : input.groupMetadata?.groupId,
    },
  };

  return output;
}
