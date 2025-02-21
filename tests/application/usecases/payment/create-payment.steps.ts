import { loadFeature, defineFeature } from "jest-cucumber";
import { CreatePayment } from "@/application/usecases/payment";
import type { PaymentGateway, PaymentRepository } from "@/application/ports";
import { Payment } from "@/domain/entities";
import { ConflictError, InvalidParamError, DomainError } from "@/domain/errors";
import { mock } from "jest-mock-extended";

const feature = loadFeature(
  "tests/application/usecases/payment/features/create-payment.feature"
);

defineFeature(feature, (test) => {
  let sut: CreatePayment;
  let paymentRepository: jest.Mocked<PaymentRepository>;
  let paymentGateway: jest.Mocked<PaymentGateway>;
  let result: string | Error;
  let promise: Promise<string>;

  beforeEach(() => {
    paymentRepository = mock<PaymentRepository>();
    paymentGateway = mock<PaymentGateway>();
    sut = new CreatePayment(paymentRepository, paymentGateway);
  });

  test("Customer creates a new payment successfully", ({
    given,
    and,
    when,
    then,
  }) => {
    const validInput = { orderId: "order-123", amount: 100 };
    const qrCodeData = "qr-code-data";

    given("a customer wants to pay for their order with amount 100", () => {
      // Input já definido
    });

    and('no payment exists for order "order-123"', () => {
      paymentRepository.findByOrderId.mockResolvedValue(null);
      paymentGateway.generatePaymentQRCode.mockResolvedValue(qrCodeData);
    });

    when("they request to create a payment", async () => {
      result = await sut.execute(validInput);
    });

    then("a QR code should be generated", () => {
      expect(result).toBe(qrCodeData);
    });

    and("the payment should be saved in the repository", () => {
      expect(paymentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          getOrderId: expect.any(Function),
          getAmount: expect.any(Function),
        })
      );
    });

    and("the gateway should be called with correct data", () => {
      expect(paymentGateway.generatePaymentQRCode).toHaveBeenCalledWith({
        orderId: validInput.orderId,
        totalAmount: validInput.amount,
      });
    });
  });

  test("Customer tries to pay an order that was already paid", ({
    given,
    when,
    then,
    and,
  }) => {
    const validInput = { orderId: "order-123", amount: 100 };

    given(/^an order "(.*)" that already has a payment$/, (orderId) => {
      const existingPayment = Payment.create(orderId, validInput.amount);
      paymentRepository.findByOrderId.mockResolvedValue(existingPayment);
    });

    when("they try to create another payment", async () => {
      promise = sut.execute(validInput);
    });

    then(
      /^it should fail with conflict error "(.*)"$/,
      async (errorMessage) => {
        await expect(promise).rejects.toThrow(ConflictError);
        await expect(promise).rejects.toThrow(errorMessage);
      }
    );

    and("no new payment should be created", () => {
      expect(paymentRepository.save).not.toHaveBeenCalled();
      expect(paymentGateway.generatePaymentQRCode).not.toHaveBeenCalled();
    });
  });

  test("Customer provides invalid payment amount", ({
    given,
    when,
    then,
    and,
  }) => {
    let invalidInput: { orderId: string; amount: number };

    given("a customer wants to pay with amount 0", () => {
      invalidInput = { orderId: "order-123", amount: 0 };
    });

    when("they try to create a payment", async () => {
      promise = sut.execute(invalidInput);
    });

    then(/^it should fail with domain error "(.*)"$/, async (errorMessage) => {
      await expect(promise).rejects.toThrow(DomainError);
      await expect(promise).rejects.toThrow(errorMessage);
    });

    and("no payment should be created", () => {
      expect(paymentRepository.save).not.toHaveBeenCalled();
    });
  });

  test("Payment gateway is unavailable", ({ given, when, then }) => {
    const validInput = { orderId: "order-123", amount: 100 };

    given("the payment gateway is experiencing issues", () => {
      const error = new Error("Gateway error");
      paymentRepository.findByOrderId.mockResolvedValue(null);
      paymentGateway.generatePaymentQRCode.mockRejectedValue(error);
    });

    when("they try to create a payment", async () => {
      promise = sut.execute(validInput);
    });

    then(/^it should fail with error "(.*)"$/, async (errorMessage) => {
      await expect(promise).rejects.toThrow(errorMessage);
    });
  });

  test("Database is unavailable", ({ given, when, then, and }) => {
    const validInput = { orderId: "order-123", amount: 100 };

    given("the database is experiencing issues", () => {
      const error = new Error("Database error");
      paymentRepository.findByOrderId.mockRejectedValue(error);
    });

    when("they try to create a payment", async () => {
      promise = sut.execute(validInput);
    });

    then(/^it should fail with error "(.*)"$/, async (errorMessage) => {
      await expect(promise).rejects.toThrow(errorMessage);
    });

    and("the gateway should not be called", () => {
      expect(paymentGateway.generatePaymentQRCode).not.toHaveBeenCalled();
    });
  });

  test("Customer provides negative payment amount", ({
    given,
    when,
    then,
    and,
  }) => {
    let invalidInput: { orderId: string; amount: number };

    given("a customer wants to pay with amount -10", () => {
      invalidInput = { orderId: "order-123", amount: -10 };
    });

    when("they try to create a payment", async () => {
      promise = sut.execute(invalidInput);
    });

    then(
      /^it should fail with validation error "(.*)"$/,
      async (errorMessage) => {
        await expect(promise).rejects.toThrow(InvalidParamError);
        await expect(promise).rejects.toThrow(errorMessage);
      }
    );

    and("no payment should be created", () => {
      expect(paymentRepository.save).not.toHaveBeenCalled();
      expect(paymentGateway.generatePaymentQRCode).not.toHaveBeenCalled();
    });
  });
});
