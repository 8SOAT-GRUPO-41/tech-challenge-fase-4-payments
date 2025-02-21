Feature: Create Payment
  As a customer
  I want to create a payment for my order
  So that I can complete my purchase

  Scenario: Customer creates a new payment successfully
    Given a customer wants to pay for their order with amount 100
    And no payment exists for order "order-123"
    When they request to create a payment
    Then a QR code should be generated
    And the payment should be saved in the repository
    And the gateway should be called with correct data

  Scenario: Customer tries to pay an order that was already paid
    Given an order "order-123" that already has a payment
    When they try to create another payment
    Then it should fail with conflict error "Payment already exists for this order"
    And no new payment should be created

  Scenario: Customer provides invalid payment amount
    Given a customer wants to pay with amount 0
    When they try to create a payment
    Then it should fail with domain error "Payment amount must be greater than zero"
    And no payment should be created

  Scenario: Payment gateway is unavailable
    Given the payment gateway is experiencing issues
    When they try to create a payment
    Then it should fail with error "Gateway error"

  Scenario: Database is unavailable
    Given the database is experiencing issues
    When they try to create a payment
    Then it should fail with error "Database error"
    And the gateway should not be called

  Scenario: Customer provides negative payment amount
    Given a customer wants to pay with amount -10
    When they try to create a payment
    Then it should fail with validation error "Invalid price"
    And no payment should be created 