import { parseHabName, formatToV1_2_0_3 } from "./habName";

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
            userName: "",
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
            userName: "",
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
            userName: "",
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
            userName: "",
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
            userName: "",
          },
        },
      },
    ])("should parse old format name correctly: %s", ({ name, expected }) => {
      const result = parseHabName(name);
      expect(result).toEqual(expect.objectContaining(expected));
    });

    // Tests for new format names (1.2.0.3:theme:groupInitiator:groupId:userName:displayName)
    test.each([
      {
        name: "1.2.0.3:XX:1:groupId789:user123:MyNewGroup",
        expected: {
          version: "1.2.0.3",
          displayName: "MyNewGroup",
          theme: "XX",
          groupMetadata: {
            groupInitiator: true,
            groupId: "groupId789",
            userName: "user123",
          },
        },
      },
      {
        name: "1.2.0.3:XX:1:gr@up!d:us$er%name:Group Name",
        expected: {
          version: "1.2.0.3",
          displayName: "Group Name",
          theme: "XX",
          groupMetadata: {
            groupInitiator: true,
            groupId: "gr@up!d",
            userName: "us$er%name",
          },
        },
      },
      {
        name: "1.2.0.3:XX:1:group-with-hyphens:user123:MyNewGroup",
        expected: {
          version: "1.2.0.3",
          displayName: "MyNewGroup",
          theme: "XX",
          groupMetadata: {
            groupInitiator: true,
            groupId: "group-with-hyphens",
            userName: "user123",
          },
        },
      },
      {
        name: "1.2.0.3:XX:MyNewWallet", // Non-group member in new format
        expected: {
          version: "1.2.0.3",
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
        name: "1.2.0.3:XX:1:groupId789:user123", // Invalid number of parts for new format (5 parts)
        errorMessage:
          "Invalid new format name: Expected 3 or 6 parts separated by colons (version:theme:displayName or version:theme:groupInitiator:groupId:userName:displayName).",
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
        name: "1.2.0.3:XX:1::user123:MyGroup", // Empty groupId for new format
        errorMessage: "Invalid new format name: groupId cannot be empty.",
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
        expected: "1.2.0.3:XX:FormattedWallet", // Non-group member format
      },
      {
        parts: {
          displayName: "FormattedGroup",
          theme: "XX",
          groupMetadata: {
            groupId: "groupXYZ",
            groupInitiator: true,
            userName: "formattedUser",
          },
        },
        expected: "1.2.0.3:XX:1:groupXYZ:formattedUser:FormattedGroup",
      },
      {
        parts: {
          displayName: "",
          theme: "XX",
        },
        expected: "1.2.0.3:XX:",
      },
      {
        parts: {
          displayName: "Group !@#$%^&*()",
          theme: "XX",
        },
        expected: "1.2.0.3:XX:Group !@#$%^&*()",
      },
      {
        parts: {
          displayName: "Group 🚀",
          theme: "XX",
        },
        expected: "1.2.0.3:XX:Group 🚀",
      },
      {
        parts: {
          displayName: "Display:Name:With:Colons",
          theme: "XX",
        },
        expected: "1.2.0.3:XX:Display:Name:With:Colons",
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
