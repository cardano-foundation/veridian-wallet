Feature: Group Profile Multisig (Joiner)

  Background:
    Given user tap Get Started button on Onboarding screen
    And user generate passcode on Passcode screen
    And user skip Biometric popup if it exist
    And skip Create Password screen
    And user is on Connect to Veridian screen
    And user navigates to SSI Agent Advanced Setup screen
    And SSI Agent URLs are cleared
    When user enters boot URL "default"
    And user enters connect URL "default"
    And user tap Validate button on SSI Agent Details screen

  @onboarding @profile @group @multisig @joiner
  Scenario Outline: Joiner joins <required>-of-<recovery> multisig group created by remote initiator and it becomes active
    Given the remote initiator "Alice" creates a pending <required>-of-<recovery> group "MultisigGroup"
    And Bob scans Alice's group OOBI to join as a member
    And Alice and the following extra virtual members resolve Bob's OOBI:
      | name            |
      | <extra_members> |
    When Alice creates a <required>-of-<recovery> multisig group "MultisigGroup" and proposes it to all members
    And Bob accepts the group invitation in the app
    And all remote members complete the group joining process
    Then the group becomes "Active" for the joiner

    Examples:
      | required | recovery | extra_members |
      | 1        | 2        |               |
      | 2        | 2        |               |
      | 2        | 3        | Charlie       |
      | 3        | 3        | Charlie       |
