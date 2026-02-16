Feature: Onboarding Password Creation

  Background:
    Given the app is launched

  @onboarding @password @setup
  Scenario: User can navigate to password creation form
    Given user is on the Create Password setup screen
    Then user can see "Add a password" button
    When user taps "Add a password" button
    Then user is on the Password creation screen
    And user can see "Create password" input field
    And user can see "Confirm password" input field
    And user can see "Create password" button

  @onboarding @password @validation @error
  Scenario Outline: User sees validation error messages for invalid passwords
    Given user is on the Password creation screen
    And password form is cleared
    When user enters password "<password>"
    Then user can see "<errorMessage>" error message
    Examples:
      | password      | errorMessage                                 |
      | 1234567       | Must contain between 8-64 characters         |
      | !a345678      | Must contain an uppercase letter            |
      | !A345678      | Must contain a lowercase letter             |
      | 12345678Qw    | Must contain a valid symbol                 |
      | !Aasdfgq      | Must contain a number                       |
      | Abc@12344∞    | Use only lowercase/uppercase letters, numbers & symbols for your password. |

  @onboarding @password @validation @error
  Scenario: User sees password mismatch error and can fix it
    Given user is on the Password creation screen
    And password form is cleared
    When user enters password "ValidP@ss123!"
    And user enters confirm password "Different123!"
    Then user sees "Passwords do not match" error
    And "Create password" button is disabled
    When user enters confirm password "ValidP@ss123!"
    Then password mismatch error is cleared
    And "Create password" button is enabled

  @onboarding @password @validation @boundary
  Scenario Outline: User can create password with boundary length values
    Given user is on the Password creation screen
    And password form is cleared
    When user enters password "<password>"
    And user enters confirm password "<password>"
    And user taps "Create password" button
    Then password is created successfully
    And user navigates to the next screen after password creation
    Examples:
      | password                                                                              |
      | Pass123!                                                                              |
      | Pass12345678901234567890123456789012345678901234567890123456789!                     |

  @onboarding @password @hint
  Scenario: User can create password with optional hint
    Given user is on the Password creation screen
    And password form is cleared
    When user enters password "StrongP@ssw0rd123!"
    And user enters confirm password "StrongP@ssw0rd123!"
    And user enters hint "My favorite color"
    And user taps "Create password" button
    Then password is created successfully
    And user navigates to the next screen after password creation

  @onboarding @password @hint @error
  Scenario: User sees hint error when hint matches password
    Given user is on the Password creation screen
    And password form is cleared
    When user enters password "StrongP@ssw0rd123!"
    And user enters confirm password "StrongP@ssw0rd123!"
    And user enters hint "My password is StrongP@ssw0rd123!"
    Then user sees "Your hint cannot be your password" error
    And "Create password" button is disabled
    When user enters hint "My favorite color"
    Then hint error is cleared
    And "Create password" button is enabled

  @onboarding @password @skip
  Scenario: User can skip password creation
    Given user is on the Create Password setup screen
    When user taps "Set up later" button
    Then user sees skip password confirmation alert
    When user confirms skip password
    Then user navigates to the next screen

  @onboarding @password @skip
  Scenario: User can cancel skipping password creation
    Given user is on the Create Password setup screen
    When user taps "Set up later" button
    Then user sees skip password confirmation alert
    When user cancels skip password
    Then user remains on Create Password setup screen
