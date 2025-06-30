Feature: Connections

  Background:
    Given user is onboarded with skipped password creation
    And user tap skip button on Welcome screen

  Scenario: C209 Connections - back to Credentials screen
    Given user tap Credentials button on Tab bar
    When user tap Connections icon on Credentials screen
    Then user can see empty Connections screen
    When user tap Back arrow icon on Connections screen
    Then user can see empty Credentials screen

  Scenario: C212 Connections - user can start adding by Add a connection button
    Given user tap Credentials button on Tab bar
    When user tap Connections icon on Credentials screen
    And user tap Add a connection button on Connections screen
    Then user can see Add a connection modal

  Scenario: C213 Connections - user can start adding by plus icon
    Given user tap Credentials button on Tab bar
    When user tap Connections icon on Credentials screen
    And user tap Plus icon on Connections screen
    Then user can see Add a connection modal

  Scenario: C214 Connections - user can tap Done button on Add a connection modal
    Given user navigate to Connections screen
    When user tap Add a connection button on Connections screen
    And user tap Done button on Add a connection modal
    Then user can see empty Connections screen
