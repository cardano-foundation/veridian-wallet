import { parseHabName, formatToV1_2_0_3 } from "./habName";

describe("habName", () => {
  describe("parseHabName", () => {
    test.each([
      {
        name: "01:MyWallet",
        expected: {
          version: null,
          displayName: "MyWallet",
          groupId: null,
          isGroupMember: false,
          isInitiator: null,
          userName: null,
          theme: "01",
        },
      },
      {
        name: "01:1-groupId123:MyGroup",
        expected: {
          version: null,
          displayName: "MyGroup",
          isGroupMember: true,
          groupId: "groupId123",
          isInitiator: true,
          userName: null,
          theme: "01",
        },
      },
      {
        name: "01:0-groupId456:AnotherGroup",
        expected: {
          version: null,
          displayName: "AnotherGroup",
          isGroupMember: true,
          groupId: "groupId456",
          isInitiator: false,
          userName: null,
          theme: "01",
        },
      },
      {
        name: "03:1-group-id:",
        expected: {
          version: null,
          displayName: "",
          isGroupMember: true,
          groupId: "group-id",
          isInitiator: true,
          userName: null,
          theme: "03",
        },
      },
    ])("should parse old format name correctly: %s", ({ name, expected }) => {
      const result = parseHabName(name);
      expect(result).toEqual(expected);
    });

    test.each([
      {
        name: "v1.2.0.3:MyNewWallet",
        expected: {
          version: "v1.2.0.3",
          displayName: "MyNewWallet",
          isGroupMember: false,
          groupId: null,
          isInitiator: null,
          userName: null,
          theme: null,
        },
      },
      {
        name: "v1.2.0.3:1-groupId789-user123:MyNewGroup",
        expected: {
          version: "v1.2.0.3",
          displayName: "MyNewGroup",
          isGroupMember: true,
          groupId: "groupId789",
          isInitiator: true,
          userName: "user123",
          theme: null,
        },
      },
      {
        name: "v1.2.0.3:0-groupIdABC-:MyBlankUserGroup",
        expected: {
          version: "v1.2.0.3",
          displayName: "MyBlankUserGroup",
          isGroupMember: true,
          groupId: "groupIdABC",
          isInitiator: false,
          userName: "",
          theme: null,
        },
      },
      {
        name: "v1.2.0.3:1-gr@up!d-us$er%name:Group Name",
        expected: {
          version: "v1.2.0.3",
          displayName: "Group Name",
          isGroupMember: true,
          groupId: "gr@up!d",
          isInitiator: true,
          userName: "us$er%name",
          theme: null,
        },
      },
      {
        name: "V1.2.0.3:MixedCaseVersion",
        expected: {
          version: "v1.2.0.3",
          displayName: "MixedCaseVersion",
          isGroupMember: false,
          groupId: null,
          isInitiator: null,
          userName: null,
          theme: null,
        },
      },
    ])("should parse new format name correctly: %s", ({ name, expected }) => {
      const result = parseHabName(name);
      expect(result).toEqual(expected);
    });

    test.each([
      {
        name: "02:",
        expected: {
          version: null,
          displayName: "",
          isGroupMember: false,
          groupId: null,
          isInitiator: null,
          userName: null,
          theme: "02",
        },
      },
      {
        name: "v1.2.0.3:",
        expected: {
          version: "v1.2.0.3",
          displayName: "",
          isGroupMember: false,
          groupId: null,
          isInitiator: null,
          userName: null,
          theme: null,
        },
      },
      {
        name: "v1.2.0.3:0-group-id-user:",
        expected: {
          version: "v1.2.0.3",
          displayName: "",
          isGroupMember: true,
          groupId: "group-id",
          isInitiator: false,
          userName: "user",
          theme: null,
        },
      },
      {
        name: "v1.2.0.3:My Wallet With Spaces",
        expected: {
          version: "v1.2.0.3",
          displayName: "My Wallet With Spaces",
          isGroupMember: false,
          groupId: null,
          isInitiator: null,
          userName: null,
          theme: null,
        },
      },
      {
        name: "v1.2.0.3:Wallet 🚀",
        expected: {
          version: "v1.2.0.3",
          displayName: "Wallet 🚀",
          isGroupMember: false,
          groupId: null,
          isInitiator: null,
          userName: null,
          theme: null,
        },
      },
      {
        name: "v1.2.0.3:0--:", // Empty userName and groupId
        expected: {
          version: "v1.2.0.3",
          displayName: "",
          isGroupMember: true,
          groupId: "",
          isInitiator: false,
          userName: "",
          theme: null,
        },
      },
    ])(
      "should handle various edge cases for parsing: %s",
      ({ name, expected }) => {
        const result = parseHabName(name);
        expect(result).toEqual(expected);
      }
    );

    test.each([
      {
        name: "JustTheName",
        errorMessage: "Invalid old format name: Missing colon.",
      },
      {
        name: "01:1-group-id:Display:Name",
        errorMessage:
          "Invalid old format name: Display name cannot contain colons.",
      },
      {
        name: "01:1-group-id-extra:DisplayName",
        errorMessage: "Invalid old format name: Malformed group structure.",
      },
      {
        name: "01",
        errorMessage: "Invalid old format name: Missing colon.",
      },
      {
        name: "01:1-group-id",
        errorMessage: "Invalid old format name: Malformed group structure.",
      },
      {
        name: "04:1-group-with-hyphens:Group Name",
        errorMessage: "Invalid old format name: Malformed group structure.",
      },
      {
        name: "01:Name-With-Hyphen",
        errorMessage: "Invalid old format name: Malformed group structure.",
      },
      {
        name: "v1.2.0.3:My:Wallet:With:Colons",
        errorMessage:
          "Invalid new format name: Display name cannot contain colons.",
      },
      {
        name: "v1.2.0.3:!@#$%^&*()_+-=[]{}|;':\",./<>?",
        errorMessage:
          "Invalid new format name: Display name cannot contain colons.",
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
          version: null,
          displayName: "FormattedWallet",
          isGroupMember: false,
          groupId: null,
          isInitiator: null,
          userName: null,
          theme: "XX",
        },
        expected: "v1.2.0.3:FormattedWallet",
      },
      {
        parts: {
          version: null,
          displayName: "FormattedGroup",
          isGroupMember: true,
          groupId: "groupXYZ",
          isInitiator: true,
          userName: "formattedUser",
          theme: "XX",
        },
        expected: "v1.2.0.3:1-groupXYZ-formattedUser:FormattedGroup",
      },
      {
        parts: {
          version: null,
          displayName: "BlankUserGroup",
          isGroupMember: true,
          groupId: "groupUVW",
          isInitiator: false,
          userName: "",
          theme: "XX",
        },
        expected: "v1.2.0.3:0-groupUVW-:BlankUserGroup",
      },
      {
        parts: {
          version: null,
          displayName: "NullUserGroup",
          isGroupMember: true,
          groupId: "groupRST",
          isInitiator: true,
          userName: null,
          theme: "XX",
        },
        expected: "v1.2.0.3:1-groupRST-:NullUserGroup",
      },
    ])(
      "should format gHab and mHab parts correctly: %s",
      ({ parts, expected }) => {
        const result = formatToV1_2_0_3(parts);
        expect(result).toBe(expected);
      }
    );

    test.each([
      {
        parts: {
          version: null,
          displayName: "",
          isGroupMember: false,
          groupId: null,
          isInitiator: null,
          userName: null,
          theme: "XX",
        },
        expected: "v1.2.0.3:",
      },
      {
        parts: {
          version: null,
          displayName: "",
          isGroupMember: true,
          groupId: "group123",
          isInitiator: true,
          userName: "user1",
          theme: "XX",
        },
        expected: "v1.2.0.3:1-group123-user1:",
      },
      {
        parts: {
          version: null,
          displayName: "Group !@#$%^&*()",
          isGroupMember: false,
          groupId: null,
          isInitiator: null,
          userName: null,
          theme: "XX",
        },
        expected: "v1.2.0.3:Group !@#$%^&*()",
      },
      {
        parts: {
          version: null,
          displayName: "Group 🚀",
          isGroupMember: false,
          groupId: null,
          isInitiator: null,
          userName: null,
          theme: "XX",
        },
        expected: "v1.2.0.3:Group 🚀",
      },
      {
        parts: {
          version: null,
          displayName: "Special Group",
          isGroupMember: true,
          groupId: "gr@up!d",
          isInitiator: false,
          userName: "us$er%name",
          theme: "XX",
        },
        expected: "v1.2.0.3:0-gr@up!d-us$er%name:Special Group",
      },
      // New edge cases for formatToV1_2_0_3
      {
        parts: {
          version: null,
          displayName: "Empty Group",
          isGroupMember: true,
          groupId: "",
          isInitiator: false,
          userName: "",
          theme: "XX",
        },
        expected: "v1.2.0.3:0--:Empty Group",
      },
    ])(
      "should handle various edge cases for formatting: %s",
      ({ parts, expected }) => {
        const result = formatToV1_2_0_3(parts);
        expect(result).toBe(expected);
      }
    );

    test("should ignore userName if isGroupMember is false", () => {
      const parts = {
        version: null,
        displayName: "Not A Group",
        isGroupMember: false,
        groupId: "should-be-ignored",
        isInitiator: true,
        userName: "should-be-ignored",
        theme: "XX",
      };
      const result = formatToV1_2_0_3(parts);
      expect(result).toBe("v1.2.0.3:Not A Group");
    });

    test("should handle null groupId for mHab gracefully", () => {
      const parts = {
        version: null,
        displayName: "Malformed Group",
        isGroupMember: true,
        groupId: null,
        isInitiator: true,
        userName: "user1",
        theme: "XX",
      };
      const result = formatToV1_2_0_3(parts);
      expect(result).toBe("v1.2.0.3:1--user1:Malformed Group");
    });

    describe("when formatting with invalid parts", () => {
      test("should throw if displayName contains a colon", () => {
        const parts = {
          displayName: "Invalid:Name",
          isGroupMember: false,
        } as any; // Cast to any to bypass type-checking for test
        expect(() => formatToV1_2_0_3(parts)).toThrow(
          "Invalid parts: displayName cannot contain colons."
        );
      });

      test("should throw if groupId contains a colon", () => {
        const parts = {
          displayName: "Valid Name",
          isGroupMember: true,
          groupId: "invalid:group",
          isInitiator: true,
          userName: "user",
        } as any; // Cast to any to bypass type-checking for test
        expect(() => formatToV1_2_0_3(parts)).toThrow(
          "Invalid parts: groupId cannot contain colons."
        );
      });
    });
  });
});
