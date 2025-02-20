import { CreatePayment } from "@/application/usecases/payment";
import type { PaymentGateway, PaymentRepository } from "@/application/ports";
import { Payment } from "@/domain/entities";
import { ConflictError, InvalidParamError, DomainError } from "@/domain/errors";
import { mock } from "jest-mock-extended";

describe("Feature: Create Payment", () => {
  // System Under Test
  let sut: CreatePayment;

  // Dependencies
  let paymentRepository: jest.Mocked<PaymentRepository>;
  let paymentGateway: jest.Mocked<PaymentGateway>;

  // Test Data
  const validInput = {
    orderId: "order-123",
    amount: 100,
  };

  beforeEach(() => {
    // Setup dependencies
    paymentRepository = mock<PaymentRepository>();
    paymentGateway = mock<PaymentGateway>();
    sut = new CreatePayment(paymentRepository, paymentGateway);
  });

  describe("Scenario: Customer creates a new payment successfully", () => {
    it("should generate QR code and save payment", async () => {
      // Given a customer wants to pay for their order
      const qrCodeData = "qr-code-data";
      paymentRepository.findByOrderId.mockResolvedValue(null);
      paymentGateway.generatePaymentQRCode.mockResolvedValue(qrCodeData);

      // When they request to create a payment
      const result = await sut.execute(validInput);

      // Then a QR code should be generated
      expect(result).toBe(qrCodeData);

      // And the payment should be saved in the repository
      expect(paymentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          getOrderId: expect.any(Function),
          getAmount: expect.any(Function),
        })
      );

      // And the gateway should be called with correct data
      expect(paymentGateway.generatePaymentQRCode).toHaveBeenCalledWith({
        orderId: validInput.orderId,
        totalAmount: validInput.amount,
      });
    });
  });

  describe("Scenario: Customer tries to pay an order that was already paid", () => {
    it("should prevent duplicate payments", async () => {
      // Given an order that already has a payment
      const existingPayment = Payment.create(
        validInput.orderId,
        validInput.amount
      );
      paymentRepository.findByOrderId.mockResolvedValue(existingPayment);

      // When they try to create another payment
      const promise = sut.execute(validInput);

      // Then it should fail with conflict error
      await expect(promise).rejects.toThrow(ConflictError);
      await expect(promise).rejects.toThrow(
        "Payment already exists for this order"
      );

      // And no new payment should be created
      expect(paymentRepository.save).not.toHaveBeenCalled();
      expect(paymentGateway.generatePaymentQRCode).not.toHaveBeenCalled();
    });
  });

  describe("Scenario: Customer provides invalid payment amount", () => {
    it("should validate payment amount", async () => {
      // Given an invalid payment amount
      const invalidInput = {
        orderId: "order-123",
        amount: 0,
      };

      // When they try to create a payment
      const promise = sut.execute(invalidInput);

      // Then it should fail with validation error
      await expect(promise).rejects.toThrow(DomainError);
      await expect(promise).rejects.toThrow(
        "Payment amount must be greater than zero"
      );

      // And no payment should be created
      expect(paymentRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("Scenario: Payment gateway is unavailable", () => {
    it("should handle gateway errors", async () => {
      // Given the payment gateway is experiencing issues
      const error = new Error("Gateway error");
      paymentRepository.findByOrderId.mockResolvedValue(null);
      paymentGateway.generatePaymentQRCode.mockRejectedValue(error);

      // When they try to create a payment
      const promise = sut.execute(validInput);

      // Then the error should be propagated
      await expect(promise).rejects.toThrow("Gateway error");
    });
  });

  describe("Scenario: Database is unavailable", () => {
    it("should handle repository errors", async () => {
      // Given the database is experiencing issues
      const error = new Error("Database error");
      paymentRepository.findByOrderId.mockRejectedValue(error);

      // When they try to create a payment
      const promise = sut.execute(validInput);

      // Then the error should be propagated
      await expect(promise).rejects.toThrow("Database error");

      // And the gateway should not be called
      expect(paymentGateway.generatePaymentQRCode).not.toHaveBeenCalled();
    });
  });

  describe("CreatePayment input validation", () => {
    it("should throw DomainError when amount is zero", async () => {
      const input = {
        orderId: "order-123",
        amount: 0,
      };

      await expect(sut.execute(input)).rejects.toThrow(DomainError);
      await expect(sut.execute(input)).rejects.toThrow(
        "Payment amount must be greater than zero"
      );
    });

    it("should throw InvalidParamError when amount is negative", async () => {
      const input = {
        orderId: "order-123",
        amount: -10,
      };

      await expect(sut.execute(input)).rejects.toThrow(InvalidParamError);
      await expect(sut.execute(input)).rejects.toThrow("Invalid price");
    });
  });
});
