Feature: CreatePasswordValidation

  Background:
    Given user tap Get Started button on Onboarding screen
    And user generate passcode on Passcode screen
    And user skip Biometric popup if it exist
    And user tap on Add a password on Create a password screen

  Scenario Outline: <caseId> CreatePasswordValidation - user can set <name> password length
    Given user generated a password of <length> characters
    And user type in password on Create Password screen
    And user confirm type in password on Create Password screen
    When user tap Create Password button on Create Password screen
    Then user can see Your Recovery Phrase screen
    Examples:
      | caseId | name    | length |
      | C163   | maximum | 64     |
      | C164   | minimum | 8      |

  Scenario Outline: <caseId> CreatePasswordValidation - <name>
    Given user type in password <password> on Create Password screen
    Then user can see <errorMessage> on Create Password screen
    Examples:
      | caseId | name                          | password                                                          | errorMessage                         |
      | C166   | too long password             | 1234567asdwer@#$3FSvcvxzvxvfas4af4afavbns2adfasfs4wfsagsfssfewfa2 | Must contain between 8-64 characters |
      | C167   | too short password            | 1234567                                                           | Must contain between 8-64 characters |
      | C168   | lack of uppercase in password | !a345678                                                          | Must contain an uppercase letter     |
      | C169   | lack of lowercase in password | !A345678                                                          | Must contain a lowercase letter      |
      | C170   | lack of symbol in password    | 12345678Qw                                                        | Must contain a valid symbol          |
      | C171   | lack of number in password    | !Aasdfgq                                                          | Must contain a number                |
