import { CURRENT_VERSION } from "../storage/sqliteStorage/migrations";
import { parseHabName, formatToV1_2_0_3 } from "./habName";

describe("habName", () => {
  describe("parseHabName", () => {
    test.each([
      {
        name: "01:MyWallet",
        expected: {
          version: undefined,
          displayName: "MyWallet",
          groupId: undefined,
          isGroupMember: false,
          isInitiator: undefined,
          userName: undefined,
          theme: "01",
        },
      },
      {
        name: "01:1-groupId123:MyGroup",
        expected: {
          version: undefined,
          displayName: "MyGroup",
          isGroupMember: true,
          groupId: "groupId123",
          isInitiator: true,
          userName: undefined,
          theme: "01",
        },
      },
      {
        name: "01:0-groupId456:AnotherGroup",
        expected: {
          version: undefined,
          displayName: "AnotherGroup",
          isGroupMember: true,
          groupId: "groupId456",
          isInitiator: false,
          userName: undefined,
          theme: "01",
        },
      },
      {
        name: "0:1-group1-user1:test1",
        expected: {
          version: undefined,
          displayName: "test1",
          isGroupMember: true,
          groupId: "group1",
          isInitiator: true,
          userName: "user1",
          theme: "0",
        },
      },
    ])("should parse old format name correctly: %s", ({ name, expected }) => {
      const result = parseHabName(name);
      expect(result).toEqual(expected);
    });

    test.each([
      {
        name: `${CURRENT_VERSION}:MyNewWallet`,
        expected: {
          version: CURRENT_VERSION,
          displayName: "MyNewWallet",
          isGroupMember: false,
          groupId: undefined,
          isInitiator: undefined,
          userName: undefined,
        },
      },
      {
        name: `${CURRENT_VERSION}:1-groupId789-user123:MyNewGroup`,
        expected: {
          version: "1.2.0.3",
          displayName: "MyNewGroup",
          isGroupMember: true,
          groupId: "groupId789",
          isInitiator: true,
          userName: "user123",
        },
      },
      {
        name: `${CURRENT_VERSION}:1-gr@up!d-us$er%name:Group Name`,
        expected: {
          version: "1.2.0.3",
          displayName: "Group Name",
          isGroupMember: true,
          groupId: "gr@up!d",
          isInitiator: true,
          userName: "us$er%name",
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
          version: undefined,
          displayName: "",
          isGroupMember: false,
          groupId: undefined,
          isInitiator: undefined,
          userName: undefined,
          theme: "02",
        },
      },
      {
        name: `${CURRENT_VERSION}:`,
        expected: {
          version: CURRENT_VERSION,
          displayName: "",
          isGroupMember: false,
          groupId: undefined,
          isInitiator: undefined,
          userName: undefined,
        },
      },
      {
        name: `${CURRENT_VERSION}:0-group-id-user:`,
        expected: {
          version: CURRENT_VERSION,
          displayName: "",
          isGroupMember: true,
          groupId: "group-id",
          isInitiator: false,
          userName: "user",
        },
      },
      {
        name: `${CURRENT_VERSION}:My Wallet With Spaces`,
        expected: {
          version: CURRENT_VERSION,
          displayName: "My Wallet With Spaces",
          isGroupMember: false,
          groupId: undefined,
          isInitiator: undefined,
          userName: undefined,
        },
      },
      {
        name: `${CURRENT_VERSION}:Wallet 🚀`,
        expected: {
          version: CURRENT_VERSION,
          displayName: "Wallet 🚀",
          isGroupMember: false,
          groupId: undefined,
          isInitiator: undefined,
          userName: undefined,
        },
      },
      {
        name: `${CURRENT_VERSION}:0--`,
        expected: {
          version: CURRENT_VERSION,
          displayName: "",
          isGroupMember: true,
          groupId: "",
          isInitiator: false,
          userName: undefined,
        },
      },
      {
        name: "03:1-group-id:",
        expected: {
          version: undefined,
          displayName: "",
          isGroupMember: true,
          groupId: "group",
          isInitiator: true,
          userName: "id",
          theme: "03",
        },
      },
      {
        name: ":MyWallet",
        expected: {
          version: undefined,
          displayName: "MyWallet",
          isGroupMember: false,
          groupId: undefined,
          isInitiator: undefined,
          userName: undefined,
          theme: "",
        },
      },
      {
        name: "01:1-:MyGroup",
        expected: {
          version: undefined,
          displayName: "MyGroup",
          isGroupMember: true,
          groupId: "",
          isInitiator: true,
          userName: undefined,
          theme: "01",
        },
      },
      {
        name: `${CURRENT_VERSION}:1-some-group-:MyGroup`,
        expected: {
          version: CURRENT_VERSION,
          displayName: "MyGroup",
          isGroupMember: true,
          groupId: "some-group",
          isInitiator: true,
          userName: undefined,
        },
      },
      {
        name: `${CURRENT_VERSION}:1--user123:MyGroup`,
        expected: {
          version: CURRENT_VERSION,
          displayName: "MyGroup",
          isGroupMember: true,
          groupId: "",
          isInitiator: true,
          userName: "user123",
        },
      },
      {
        name: "01:1-gr@up!d:MyGroup",
        expected: {
          version: undefined,
          displayName: "MyGroup",
          isGroupMember: true,
          groupId: "gr@up!d",
          isInitiator: true,
          userName: undefined,
          theme: "01",
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
        name: `${CURRENT_VERSION}:My:Wallet:With:Colons`,
        errorMessage:
          "Invalid new format name: Display name cannot contain colons.",
      },
      {
        name: `${CURRENT_VERSION}:!@#$%^&*()_+-=[]{}|;':",./<>?`,
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
          version: undefined,
          displayName: "FormattedWallet",
          isGroupMember: false,
          groupId: undefined,
          isInitiator: undefined,
          userName: undefined,
          theme: "XX",
        },
        expected: "1.2.0.3:FormattedWallet",
      },
      {
        parts: {
          version: undefined,
          displayName: "FormattedGroup",
          isGroupMember: true,
          groupId: "groupXYZ",
          isInitiator: true,
          userName: "formattedUser",
          theme: "XX",
        },
        expected: "1.2.0.3:1-groupXYZ-formattedUser:FormattedGroup",
      },
      {
        parts: {
          version: undefined,
          displayName: "BlankUserGroup",
          isGroupMember: true,
          groupId: "groupUVW",
          isInitiator: false,
          userName: "",
          theme: "XX",
        },
        expected: "1.2.0.3:0-groupUVW-:BlankUserGroup",
      },
      {
        parts: {
          version: undefined,
          displayName: "NullUserGroup",
          isGroupMember: true,
          groupId: "groupRST",
          isInitiator: true,
          userName: undefined,
          theme: "XX",
        },
        expected: "1.2.0.3:1-groupRST-:NullUserGroup",
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
          version: undefined,
          displayName: "",
          isGroupMember: false,
          groupId: undefined,
          isInitiator: undefined,
          userName: undefined,
          theme: "XX",
        },
        expected: "1.2.0.3:",
      },
      {
        parts: {
          version: undefined,
          displayName: "",
          isGroupMember: true,
          groupId: "group123",
          isInitiator: true,
          userName: "user1",
          theme: "XX",
        },
        expected: "1.2.0.3:1-group123-user1:",
      },
      {
        parts: {
          version: undefined,
          displayName: "Group !@#$%^&*()",
          isGroupMember: false,
          groupId: undefined,
          isInitiator: undefined,
          userName: undefined,
          theme: "XX",
        },
        expected: "1.2.0.3:Group !@#$%^&*()",
      },
      {
        parts: {
          version: undefined,
          displayName: "Group 🚀",
          isGroupMember: false,
          groupId: undefined,
          isInitiator: undefined,
          userName: undefined,
          theme: "XX",
        },
        expected: "1.2.0.3:Group 🚀",
      },
      {
        parts: {
          version: undefined,
          displayName: "Special Group",
          isGroupMember: true,
          groupId: "gr@up!d",
          isInitiator: false,
          userName: "us$er%name",
          theme: "XX",
        },
        expected: "1.2.0.3:0-gr@up!d-us$er%name:Special Group",
      },
      {
        parts: {
          version: undefined,
          displayName: "Empty Group",
          isGroupMember: true,
          groupId: "",
          isInitiator: false,
          userName: "",
          theme: "XX",
        },
        expected: "1.2.0.3:0--:Empty Group",
      },
      {
        parts: {
          version: undefined,
          displayName: "Display:Name:With:Colons",
          isGroupMember: false,
          groupId: undefined,
          isInitiator: undefined,
          userName: undefined,
          theme: "XX",
        },
        expected: "1.2.0.3:Display:Name:With:Colons",
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
        version: undefined,
        displayName: "Not A Group",
        isGroupMember: false,
        groupId: "should-be-ignored",
        isInitiator: undefined,
        userName: "should-be-ignored",
        theme: "XX",
      };
      const result = formatToV1_2_0_3(parts);
      expect(result).toBe("1.2.0.3:Not A Group");
    });

    test("should handle undefined groupId for mHab gracefully", () => {
      const parts = {
        version: "0",
        displayName: "Malformed Group",
        isGroupMember: true,
        isInitiator: true,
        userName: "user1",
        theme: "XX",
      };
      const result = formatToV1_2_0_3(parts);
      expect(result).toBe("1.2.0.3:1--user1:Malformed Group");
    });
  });
});
