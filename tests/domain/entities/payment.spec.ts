import { Payment } from "@/domain/entities";
import { PaymentStatus } from "@/domain/enums";
import { DomainError, InvalidParamError } from "@/domain/errors";

describe("Payment Entity", () => {
  const validOrderId = "123";
  const validAmount = 100;

  describe("create", () => {
    it("should create a new payment with valid params", () => {
      const payment = Payment.create(validOrderId, validAmount);

      expect(payment.paymentId).toBeDefined();
      expect(payment.getOrderId()).toBe(validOrderId);
      expect(payment.getAmount()).toBe(validAmount);
      expect(payment.getStatus()).toBe(PaymentStatus.PENDING);
    });

    it("should throw if amount is zero", () => {
      expect(() => Payment.create(validOrderId, 0)).toThrow(DomainError);
    });

    it("should throw if amount is negative", () => {
      expect(() => Payment.create(validOrderId, -1)).toThrow(InvalidParamError);
    });
  });

  describe("status transitions", () => {
    it("should allow transition from PENDING to PAID", () => {
      const payment = Payment.create(validOrderId, validAmount);
      payment.markAsPaid();
      expect(payment.getStatus()).toBe(PaymentStatus.PAID);
    });

    it("should allow transition from PENDING to CANCELED", () => {
      const payment = Payment.create(validOrderId, validAmount);
      payment.cancel();
      expect(payment.getStatus()).toBe(PaymentStatus.CANCELED);
    });

    it("should not allow transition from PAID to CANCELED", () => {
      const payment = Payment.create(validOrderId, validAmount);
      payment.markAsPaid();
      expect(() => payment.cancel()).toThrow(DomainError);
    });

    it("should not allow transition from CANCELED to PAID", () => {
      const payment = Payment.create(validOrderId, validAmount);
      payment.cancel();
      expect(() => payment.markAsPaid()).toThrow(DomainError);
    });

    it("should throw DomainError with specific message for invalid transition", () => {
      const payment = Payment.create(validOrderId, validAmount);
      payment.markAsPaid();
      expect(() => payment.setStatus(PaymentStatus.PENDING)).toThrow(
        "Can't transition from PAID to PENDING"
      );
    });

    it("should throw specific error message for invalid status transition", () => {
      const payment = Payment.create(validOrderId, validAmount);
      payment.markAsPaid();

      expect(() => payment.setStatus(PaymentStatus.CANCELED)).toThrow(
        "Can't transition from PAID to CANCELED"
      );
    });
  });

  describe("restore", () => {
    it("should restore a payment with all properties", () => {
      const paymentId = "123";
      const createdAt = new Date();
      const status = PaymentStatus.PAID;

      const payment = Payment.restore(
        paymentId,
        validOrderId,
        status,
        validAmount,
        createdAt
      );

      expect(payment.paymentId).toBe(paymentId);
      expect(payment.getOrderId()).toBe(validOrderId);
      expect(payment.getAmount()).toBe(validAmount);
      expect(payment.getStatus()).toBe(status);
      expect(payment.getCreatedAt()).toBe(createdAt);
    });

    it("should throw if restored with invalid amount", () => {
      const paymentId = "123";
      const createdAt = new Date();
      const status = PaymentStatus.PAID;

      expect(() =>
        Payment.restore(paymentId, validOrderId, status, -1, createdAt)
      ).toThrow(InvalidParamError);
    });

    it("should throw if restored with zero amount", () => {
      const paymentId = "123";
      const createdAt = new Date();
      const status = PaymentStatus.PAID;

      expect(() =>
        Payment.restore(paymentId, validOrderId, status, 0, createdAt)
      ).toThrow(DomainError);
    });
  });

  describe("validation", () => {
    it("should throw DomainError with specific message for zero amount", () => {
      expect(() => Payment.create(validOrderId, 0)).toThrow(
        "Payment amount must be greater than zero"
      );
    });
  });

  describe("toJSON", () => {
    it("should return correct JSON representation", () => {
      const paymentId = "payment-123";
      const createdAt = new Date();
      const payment = Payment.restore(
        paymentId,
        validOrderId,
        PaymentStatus.PENDING,
        validAmount,
        createdAt
      );

      const json = payment.toJSON();

      expect(json).toEqual({
        paymentId,
        orderId: validOrderId,
        status: PaymentStatus.PENDING,
        amount: validAmount,
        createdAt: createdAt.toISOString(),
      });
    });
  });
});
