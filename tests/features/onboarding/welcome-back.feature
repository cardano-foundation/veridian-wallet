Feature: WelcomeBack

  Background:
    Given user is onboarded with skipped password creation
    And user had already setup a identity

  Scenario: C227 WelcomeBack - incorrect passcode
    When user type in wrong passcode
    Then user see a error message about incorrect passcode

  Scenario: C228 WelcomeBack - 3 attempt remain
    When user make 2 attempts with wrong passcode
    Then user see a toast message said 3 attempt remain

  Scenario: C229 WelcomeBack - 2 attempt remain
    When user make 3 attempts with wrong passcode
    Then user see a toast message said 2 attempt remain

  Scenario: C236 WelcomeBack - 1 attempt remain
    When user make 4 attempts with wrong passcode
    Then user see a toast message said 1 attempt remain

  Scenario: C237 WelcomeBack- login unavailable for 1 min
    When user make 5 attempts with wrong passcode
    Then user cannot do anything , the screen to blank with the toast message login unavailable , retry in 1 min

  Scenario: C238 WelcomeBack- login unavailable for 5 min
    When user make 6 attempts with wrong passcode
    Then user cannot do anything , the screen to blank with the toast message login unavailable , retry in 5 min

  Scenario: C240 WelcomeBack - forgotten passcode
    When user click on forgotten passcode
    Then user got navigate to recovery phrase screen
