import {
  parseHabName,
  formatToV1_2_0_2,
  buildDeletedHabName,
  DELETED_IDENTIFIER_THEME,
} from "./habName";

describe("habName", () => {
  describe("parseHabName", () => {
    // Tests for old format names (theme:groupInitiator-groupId:displayName)
    test.each([
      {
        name: "01:1-groupId123:MyGroup",
        expected: {
          displayName: "MyGroup",
          theme: "01",
          groupMetadata: {
            groupInitiator: true,
            groupId: "groupId123",
            proposedUsername: "",
          },
        },
      },
      {
        name: "01:0-groupId456:AnotherGroup",
        expected: {
          displayName: "AnotherGroup",
          theme: "01",
          groupMetadata: {
            groupInitiator: false,
            groupId: "groupId456",
            proposedUsername: "",
          },
        },
      },
      {
        name: "01:1-gr@up!d:MyGroup",
        expected: {
          displayName: "MyGroup",
          theme: "01",
          groupMetadata: {
            groupInitiator: true,
            groupId: "gr@up!d",
            proposedUsername: "",
          },
        },
      },
      {
        name: "01:1-group-with-hyphens:MyGroup",
        expected: {
          displayName: "MyGroup",
          theme: "01",
          groupMetadata: {
            groupInitiator: true,
            groupId: "group-with-hyphens",
            proposedUsername: "",
          },
        },
      },
      {
        name: "01:1-group-id-extra:DisplayName", // Invalid groupPart for old format
        expected: {
          displayName: "DisplayName",
          theme: "01",
          groupMetadata: {
            groupInitiator: true,
            groupId: "group-id-extra",
            proposedUsername: "",
          },
        },
      },
    ])("should parse old format name correctly: %s", ({ name, expected }) => {
      const result = parseHabName(name);
      expect(result).toEqual(expect.objectContaining(expected));
    });

    // Tests for broken 1.1.X deleted mHab format (XX-salt:groupId:displayName - missing isInitiator)
    // These default groupInitiator to false since we cannot determine it
    test.each([
      {
        name: "XX-abc123:groupId456:MyDeletedGroup",
        expected: {
          displayName: "MyDeletedGroup",
          theme: "XX-abc123",
          groupMetadata: {
            groupInitiator: false,
            groupId: "groupId456",
            proposedUsername: "",
          },
        },
      },
      {
        name: "XX-randomSalt:EJ84hiNC0ts71HARE1ZkcnYAFJP0s:DeletedMember",
        expected: {
          displayName: "DeletedMember",
          theme: "XX-randomSalt",
          groupMetadata: {
            groupInitiator: false,
            groupId: "EJ84hiNC0ts71HARE1ZkcnYAFJP0s",
            proposedUsername: "",
          },
        },
      },
    ])(
      "should handle broken 1.1.X deleted mHab format: %s",
      ({ name, expected }) => {
        const result = parseHabName(name);
        expect(result).toEqual(expect.objectContaining(expected));
      }
    );

    // Tests for new format names (1.2.0.2:theme:groupInitiator:groupId:userName:displayName)
    test.each([
      {
        name: "1.2.0.2:XX:1:groupId789:user123:MyNewGroup",
        expected: {
          version: "1.2.0.2",
          displayName: "MyNewGroup",
          theme: "XX",
          groupMetadata: {
            groupInitiator: true,
            groupId: "groupId789",
            proposedUsername: "user123",
          },
        },
      },
      {
        name: "1.2.0.2:XX:1:gr@up!d:us$er%name:Group Name",
        expected: {
          version: "1.2.0.2",
          displayName: "Group Name",
          theme: "XX",
          groupMetadata: {
            groupInitiator: true,
            groupId: "gr@up!d",
            proposedUsername: "us$er%name",
          },
        },
      },
      {
        name: "1.2.0.2:XX:1:group-with-hyphens:user123:MyNewGroup",
        expected: {
          version: "1.2.0.2",
          displayName: "MyNewGroup",
          theme: "XX",
          groupMetadata: {
            groupInitiator: true,
            groupId: "group-with-hyphens",
            proposedUsername: "user123",
          },
        },
      },
      {
        name: "1.2.0.2:XX:1:groupId123::MyGroup", // Empty proposedUsername (migrated from 1.1)
        expected: {
          version: "1.2.0.2",
          displayName: "MyGroup",
          theme: "XX",
          groupMetadata: {
            groupInitiator: true,
            groupId: "groupId123",
            proposedUsername: "",
          },
        },
      },
      {
        name: "1.2.0.2:XX:MyNewWallet", // Non-group member in new format
        expected: {
          version: "1.2.0.2",
          displayName: "MyNewWallet",
          theme: "XX",
        },
      },
    ])("should parse new format name correctly: %s", ({ name, expected }) => {
      const result = parseHabName(name);
      expect(result).toEqual(expect.objectContaining(expected));
    });

    // Tests for invalid formats that should throw errors
    test.each([
      {
        name: "JustTheName",
        errorMessage:
          "Invalid old format name: Expected 2 or 3 parts separated by colons (theme:groupPart:displayName or theme:displayName)",
      },
      {
        name: "01:1-group-id:Display:Name", // Too many parts for old format
        errorMessage:
          "Invalid old format name: Expected 2 or 3 parts separated by colons (theme:groupPart:displayName or theme:displayName)",
      },
      {
        name: "1.2.0.2:XX:1:groupId789:user123", // Invalid number of parts for new format (5 parts)
        errorMessage:
          "Invalid new format name: Expected 3 or 6 parts separated by colons (version:theme:displayName or version:theme:groupInitiator:groupId:proposedUsername:displayName).",
      },
      {
        name: "03:1-group-id:", // Missing display name for old format
        errorMessage: "Invalid old format name: Missing theme or display name.",
      },
      {
        name: "::MyWallet", // Missing theme for old format
        errorMessage: "Invalid old format name: Missing theme or display name.",
      },
      {
        name: "01:1-:MyGroup", // Empty groupId for old format
        errorMessage: "Invalid old format name: groupId cannot be empty.",
      },
      {
        name: "1.2.0.2:XX:1::user123:MyGroup", // Empty groupId for new format
        errorMessage: "Invalid new format name: groupId cannot be empty.",
      },
      {
        name: "01:groupIdNoHyphen:MyGroup", // Non-deleted mHab missing hyphen (not broken format)
        errorMessage:
          "Invalid old format name: Invalid group part format (expected groupInitiator-groupId).",
      },
    ])(
      "should throw error for invalid format: %s",
      ({ name, errorMessage }) => {
        expect(() => parseHabName(name)).toThrow(errorMessage);
      }
    );
  });

  describe("formatToV1_2_0_3", () => {
    test.each([
      {
        parts: {
          displayName: "FormattedWallet",
          theme: "XX",
        },
        expected: "1.2.0.2:XX:FormattedWallet", // Non-group member format
      },
      {
        parts: {
          displayName: "FormattedGroup",
          theme: "XX",
          groupMetadata: {
            groupId: "groupXYZ",
            groupInitiator: true,
            proposedUsername: "formattedUser",
          },
        },
        expected: "1.2.0.2:XX:1:groupXYZ:formattedUser:FormattedGroup",
      },
      {
        parts: {
          displayName: "",
          theme: "XX",
        },
        expected: "1.2.0.2:XX:",
      },
      {
        parts: {
          displayName: "Group !@#$%^&*()",
          theme: "XX",
        },
        expected: "1.2.0.2:XX:Group !@#$%^&*()",
      },
      {
        parts: {
          displayName: "Group 🚀",
          theme: "XX",
        },
        expected: "1.2.0.2:XX:Group 🚀",
      },
      {
        parts: {
          displayName: "Display:Name:With:Colons",
          theme: "XX",
        },
        expected: "1.2.0.2:XX:Display:Name:With:Colons",
      },
    ])(
      "should format hab name parts correctly to v1.2.0.2 format: %s",
      ({ parts, expected }) => {
        const result = formatToV1_2_0_2(parts);
        expect(result).toBe(expected);
      }
    );
  });

  describe("buildDeletedHabName", () => {
    test("should build deleted hab name for regular identifier", () => {
      const input = {
        displayName: "my-identifier",
      };
      const salt = "test-salt";

      const result = buildDeletedHabName(input, salt);

      expect(result).toBe(
        `1.2.0.2:${DELETED_IDENTIFIER_THEME}-${salt}:my-identifier`
      );
    });

    test("should build deleted hab name for group identifier", () => {
      const input = {
        displayName: "my-group",
        groupMetadata: {
          groupInitiator: true,
          groupId: "group-123",
          proposedUsername: "user1",
        },
      };
      const salt = "test-salt";

      const result = buildDeletedHabName(input, salt);

      expect(result).toBe(
        `1.2.0.2:${DELETED_IDENTIFIER_THEME}-${salt}:1:group-123:user1:my-group`
      );
    });

    test("should build deleted hab name for non-initiator group identifier", () => {
      const input = {
        displayName: "member-identifier",
        groupMetadata: {
          groupInitiator: false,
          groupId: "group-456",
          proposedUsername: "member1",
        },
      };
      const salt = "random-salt";

      const result = buildDeletedHabName(input, salt);

      expect(result).toBe(
        `1.2.0.2:${DELETED_IDENTIFIER_THEME}-${salt}:0:group-456:member1:member-identifier`
      );
    });

    test("should handle empty proposedUsername for group identifier", () => {
      const input = {
        displayName: "migrated-group",
        groupMetadata: {
          groupInitiator: true,
          groupId: "legacy-group",
          proposedUsername: "",
        },
      };
      const salt = "salt123";

      const result = buildDeletedHabName(input, salt);

      expect(result).toBe(
        `1.2.0.2:${DELETED_IDENTIFIER_THEME}-${salt}:1:legacy-group::migrated-group`
      );
    });
  });
});
