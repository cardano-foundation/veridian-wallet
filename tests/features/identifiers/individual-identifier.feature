Feature: IndividualIdentifier

  Background:
    Given user is onboarded with skipped password creation
    And user tap skip button on Welcome screen

  Scenario: C135 IndividualIdentifier - Cancel adding an identifier from Add an identifier button
    Given user tap Add an identifier button on the Identifiers screen
    Then user can see Add An Identifier modal
    When user tap Cancel button on modal
    Then user can see Identifiers screen
    And user can not to see Add An Identifier modal

  Scenario: C136 IndividualIdentifier - Cancel adding an identifier from plus icon
    Given user tap Plus button on the screen
    Then user can see Add An Identifier modal
    When user tap Cancel button on modal
    Then user can see Identifiers screen
    And user can not to see Add An Identifier modal

  Scenario: C137 IndividualIdentifier - Create individual identifier from Add an identifier button
    Given user tap Add an identifier button on the Identifiers screen
    When user add Individual identifier
    Then user can see toast message about created identifier on Identifiers screen
    And user can see Identifiers screen with 1 card

  Scenario: C138 IndividualIdentifier - Create individual identifier from plus icon
    Given user tap Plus button on the screen
    When user add Individual identifier
    Then user can see toast message about created identifier on Identifiers screen
    And user can see Identifiers screen with 1 card
