Feature: IndividualIdentifierShare

  Background:
    Given user is onboarded with skipped password creation
    And user tap skip button on Welcome screen
    And identifier is created and user can see Identifier Card Details screen for Individual

  Scenario: C155 IndividualIdentifierShare - Copy identifier
    Given user tap Share button on Identifier Card Details screen
    When user see Share Identifier modal
    And user tap Copy Identifier icon on Share identifier modal
    Then user can see toast message about copied value to clipboard

  Scenario: C156 IndividualIdentifierShare - More share options
    Given user tap Share button on Identifier Card Details screen
    When user see Share Identifier modal
    Then user tap More Share Options icon on Share identifier modal

  Scenario: C157 IndividualIdentifierShare - Share identifier from Identifier options
    Given user tap Options button on Identifier Card Details screen
    Then user tap Share Identifier icon on Share identifier modal
    And user see Share Identifier modal
