Feature: IndividualIdentifierEdit

  Background:
    Given user is onboarded with skipped password creation
    And user tap skip button on Welcome screen

  Scenario: C152 IndividualIdentifierEdit - User can cancel edit for Individual default identifier
    Given identifier is created and user can see Identifier Card Details screen for Individual
    When user tap Options button on Identifier Card Details screen
    And user tap Edit identifier option from Identifier Options modal
    And user modify display name on Edit Identifier modal
    And user tap Cancel button on Identifier Edit modal
    Then user can see Identifier Card Details screen

  Scenario: C153 IndividualIdentifierEdit - User can change display name for Individual default identifier
    Given identifier is created and user can see Identifier Card Details screen for Individual
    When user tap Options button on Identifier Card Details screen
    And user tap Edit identifier option from Identifier Options modal
    And user modify display name on Edit Identifier modal
    And user tap Confirm Changes button on Edit Identifier modal
    Then user can see toast message about updated identifier
    And user can see Card Details screen with new display name
