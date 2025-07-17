import { CURRENT_VERSION } from "../storage/sqliteStorage/migrations";
import { parseHabName, formatToV1_2_0_3 } from "./habName";

describe("habName", () => {
  describe("parseHabName", () => {
    // Tests for old format names (theme:isInitiator-groupId:displayName)
    test.each([
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
        name: "01:MyWallet", // Non-group member in old format
        expected: {
          version: undefined,
          displayName: "MyWallet",
          isGroupMember: false,
          groupId: undefined,
          isInitiator: undefined,
          userName: undefined,
          theme: "01",
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
    ])("should parse old format name correctly: %s", ({ name, expected }) => {
      const result = parseHabName(name);
      expect(result).toEqual(expected);
    });

    // Tests for new format names (1.2.0.3:theme:isInitiator-groupId-userName:displayName)
    test.each([
      {
        name: `${CURRENT_VERSION}:XX:1-groupId789-user123:MyNewGroup`,
        expected: {
          version: CURRENT_VERSION,
          displayName: "MyNewGroup",
          isGroupMember: true,
          groupId: "groupId789",
          isInitiator: true,
          userName: "user123",
          theme: "XX",
        },
      },
      {
        name: `${CURRENT_VERSION}:XX:1-gr@up!d-us$er%name:Group Name`,
        expected: {
          version: CURRENT_VERSION,
          displayName: "Group Name",
          isGroupMember: true,
          groupId: "gr@up!d",
          isInitiator: true,
          userName: "us$er%name",
          theme: "XX",
        },
      },
      {
        name: `${CURRENT_VERSION}:XX:MyNewWallet`, // Non-group member in new format
        expected: {
          version: CURRENT_VERSION,
          displayName: "MyNewWallet",
          isGroupMember: false,
          groupId: undefined,
          isInitiator: undefined,
          userName: undefined,
          theme: "XX",
        },
      },
      {
        name: `${CURRENT_VERSION}:XX:0--:Empty Group`, // Empty groupId and userName, but still a group
        expected: {
          version: CURRENT_VERSION,
          displayName: "Empty Group",
          isGroupMember: true,
          groupId: "",
          isInitiator: false,
          userName: "",
          theme: "XX",
        },
      },
    ])("should parse new format name correctly: %s", ({ name, expected }) => {
      const result = parseHabName(name);
      expect(result).toEqual(expected);
    });

    // Tests for invalid formats that should throw errors
    test.each([
      {
        name: "JustTheName",
        errorMessage:
          "Invalid old format name: Expected 3 parts separated by colons (theme:groupPart:displayName).",
      },
      {
        name: "01:MyWallet", // Missing groupPart and displayName
        errorMessage:
          "Invalid old format name: Expected 3 parts separated by colons (theme:groupPart:displayName).",
      },
      {
        name: "01:1-group-id:Display:Name", // Too many parts for old format
        errorMessage:
          "Invalid old format name: Expected 3 parts separated by colons (theme:groupPart:displayName).",
      },
      {
        name: "01:1-group-id-extra:DisplayName", // Invalid groupPart for old format
        errorMessage:
          "Invalid old format name: Invalid group part format (expected isInitiator-groupId or empty).",
      },
      {
        name: `${CURRENT_VERSION}:MyNewWallet`, // Missing theme, groupPart, displayName for new format
        errorMessage:
          "Invalid new format name: Expected 4 parts separated by colons (version:theme:groupPart:displayName).",
      },
      {
        name: "03:1-group-id:", // Missing display name for old format
        errorMessage: "Invalid old format name: Missing theme or display name.",
      },
      {
        name: ":MyWallet", // Missing theme for old format
        errorMessage:
          "Invalid old format name: Expected 3 parts separated by colons (theme:groupPart:displayName).",
      },
      {
        name: "01:1-:MyGroup", // Empty groupId for old format
        errorMessage:
          "Invalid old format name: Invalid group part format (expected isInitiator-groupId or empty).",
      },
      {
        name: `${CURRENT_VERSION}:XX:1--user123:MyGroup`, // Empty groupId for new format
        errorMessage:
          "Invalid new format name: Invalid group part format (expected isInitiator-groupId-userName or empty).",
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
        expected: `${CURRENT_VERSION}:XX:FormattedWallet`, // Non-group member format
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
        expected: `${CURRENT_VERSION}:XX:1-groupXYZ-formattedUser:FormattedGroup`,
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
        expected: `${CURRENT_VERSION}:XX:0-groupUVW-:BlankUserGroup`,
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
        expected: `${CURRENT_VERSION}:XX:1-groupRST-:NullUserGroup`,
      },
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
        expected: `${CURRENT_VERSION}:XX:`,
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
        expected: `${CURRENT_VERSION}:XX:1-group123-user1:`,
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
        expected: `${CURRENT_VERSION}:XX:Group !@#$%^&*()`,
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
        expected: `${CURRENT_VERSION}:XX:Group 🚀`,
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
        expected: `${CURRENT_VERSION}:XX:Display:Name:With:Colons`,
      },
    ])(
      "should format hab name parts correctly to v1.2.0.3 format: %s",
      ({ parts, expected }) => {
        const result = formatToV1_2_0_3(parts);
        expect(result).toBe(expected);
      }
    );
  });
});
