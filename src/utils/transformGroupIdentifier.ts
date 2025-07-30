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
      groupMetadata: input.di
        ? {
          groupId: input.di,
          groupInitiator: true,
          groupCreated: false,
          userName: "",
        }
        : undefined,
      groupMemberPre: input.groupMemberPre,
    },
  };

  return output;
}
