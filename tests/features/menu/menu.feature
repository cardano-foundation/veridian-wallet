Feature: Menu

  Background:
    Given user is onboarded with skipped password creation
    And user tap skip button on Welcome screen

  Scenario: C158 Menu - loads correctly
    Given user tap Menu button on Tab bar
    Then user can see Menu screen

  Scenario: C159 Menu - Settings screen loads correctly
    Given user tap Menu button on Tab bar
    When user tap Settings button on Menu screen
    Then user can see Menu Settings screen
