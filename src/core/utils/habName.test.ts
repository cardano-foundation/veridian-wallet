import { parseHabName, formatToV1_2_0_3 } from "./habName";

describe("habName", () => {
  describe("parseHabName", () => {
    // Test cases for old format gHab
    test("should parse old format gHab name correctly", () => {
      const name = "01:MyWallet";
      const result = parseHabName(name);
      expect(result).toEqual({
        version: null,
        displayName: "MyWallet",
        isGroupMember: false,
        groupId: null,
        isInitiator: null,
        userName: null,
        theme: "01",
      });
    });

    // Test cases for old format mHab
    test("should parse old format mHab name correctly for initiator", () => {
      const name = "01:1-groupId123:MyGroup";
      const result = parseHabName(name);
      expect(result).toEqual({
        version: null,
        displayName: "MyGroup",
        isGroupMember: true,
        groupId: "groupId123",
        isInitiator: true,
        userName: null,
        theme: "01",
      });
    });

    test("should parse old format mHab name correctly for non-initiator", () => {
      const name = "01:0-groupId456:AnotherGroup";
      const result = parseHabName(name);
      expect(result).toEqual({
        version: null,
        displayName: "AnotherGroup",
        isGroupMember: true,
        groupId: "groupId456",
        isInitiator: false,
        userName: null,
        theme: "01",
      });
    });

    // Test cases for new format gHab
    test("should parse new format gHab name correctly", () => {
      const name = "v1.2.0.3:MyNewWallet";
      const result = parseHabName(name);
      expect(result).toEqual({
        version: "v1.2.0.3",
        displayName: "MyNewWallet",
        isGroupMember: false,
        groupId: null,
        isInitiator: null,
        userName: null,
        theme: null,
      });
    });

    // Test cases for new format mHab with userName
    test("should parse new format mHab name with userName correctly", () => {
      const name = "v1.2.0.3:1-groupId789-user123:MyNewGroup";
      const result = parseHabName(name);
      expect(result).toEqual({
        version: "v1.2.0.3",
        displayName: "MyNewGroup",
        isGroupMember: true,
        groupId: "groupId789",
        isInitiator: true,
        userName: "user123",
        theme: null,
      });
    });

    // Test cases for new format mHab with blank userName
    test("should parse new format mHab name with blank userName correctly", () => {
      const name = "v1.2.0.3:0-groupIdABC-:MyBlankUserGroup";
      const result = parseHabName(name);
      expect(result).toEqual({
        version: "v1.2.0.3",
        displayName: "MyBlankUserGroup",
        isGroupMember: true,
        groupId: "groupIdABC",
        isInitiator: false,
        userName: "",
        theme: null,
      });
    });
  });

  describe("formatToV1_2_0_3", () => {
    // Test cases for gHab
    test("should format gHab parts correctly", () => {
      const parts = {
        version: null,
        displayName: "FormattedWallet",
        isGroupMember: false,
        groupId: null,
        isInitiator: null,
        userName: null,
        theme: "XX",
      };
      const result = formatToV1_2_0_3(parts);
      expect(result).toBe("v1.2.0.3:FormattedWallet");
    });

    // Test cases for mHab with userName
    test("should format mHab parts with userName correctly", () => {
      const parts = {
        version: null,
        displayName: "FormattedGroup",
        isGroupMember: true,
        groupId: "groupXYZ",
        isInitiator: true,
        userName: "formattedUser",
        theme: "XX",
      };
      const result = formatToV1_2_0_3(parts);
      expect(result).toBe("v1.2.0.3:1-groupXYZ-formattedUser:FormattedGroup");
    });

    // Test cases for mHab with blank userName
    test("should format mHab parts with blank userName correctly", () => {
      const parts = {
        version: null,
        displayName: "BlankUserGroup",
        isGroupMember: true,
        groupId: "groupUVW",
        isInitiator: false,
        userName: "",
        theme: "XX",
      };
      const result = formatToV1_2_0_3(parts);
      expect(result).toBe("v1.2.0.3:0-groupUVW-:BlankUserGroup");
    });

    // Test cases for mHab with null userName
    test("should format mHab parts with null userName correctly", () => {
      const parts = {
        version: null,
        displayName: "NullUserGroup",
        isGroupMember: true,
        groupId: "groupRST",
        isInitiator: true,
        userName: null,
        theme: "XX",
      };
      const result = formatToV1_2_0_3(parts);
      expect(result).toBe("v1.2.0.3:1-groupRST-:NullUserGroup");
    });
  });
});
