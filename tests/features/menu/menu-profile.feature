Feature: Menu Profile

  Background:
    Given user is onboarded with skipped password creation
    And user tap skip button on Welcome screen

  Scenario: C387 MenuProfile - Loads
    Given user tap Menu button on Tab bar
    When user tap on Profile button on Menu screen
    Then user can see Profile screen

  Scenario: C388 MenuProfile - Cancel editing
    Given user tap Menu button on Tab bar
    When user tap on Profile button on Menu screen
    And user tap on Edit button on Profile screen
    And user tap on Cancel button on Edit Profile screen
    Then user can see Profile screen

  Scenario: C389 MenuProfile - Confirm edit
    Given user tap Menu button on Tab bar
    When user tap on Profile button on Menu screen
    And user tap on Edit button on Profile screen
    And user edit username to "Test" on Edit Profile screen
    And user tap on confirm button on Edit Profile screen
    Then user should see the updated username "Test" on the Profile screen
