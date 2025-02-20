import { ProcessPaymentWebhook } from "@/application/usecases/payment";
import type { PaymentGateway, PaymentRepository } from "@/application/ports";
import { Payment } from "@/domain/entities";
import { PaymentStatus } from "@/domain/enums";
import { NotFoundError } from "@/domain/errors";
import { mock } from "jest-mock-extended";

describe("ProcessPaymentWebhook UseCase", () => {
  const paymentRepository = mock<PaymentRepository>();
  const paymentGateway = mock<PaymentGateway>();
  const sut = new ProcessPaymentWebhook(paymentRepository, paymentGateway);

  const gatewayResourceId = "gateway-123";
  const orderId = "order-123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should process payment webhook successfully", async () => {
    const payment = Payment.create(orderId, 100);
    paymentGateway.getPaymentDetails.mockResolvedValue({
      orderId,
      paymentStatus: PaymentStatus.PAID,
    });
    paymentRepository.findByOrderId.mockResolvedValue(payment);

    await sut.execute({ gatewayResourceId });

    expect(paymentRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: payment.paymentId,
        getStatus: expect.any(Function),
      })
    );
    expect(payment.getStatus()).toBe(PaymentStatus.PAID);
  });

  it("should throw if payment is not found", async () => {
    paymentGateway.getPaymentDetails.mockResolvedValue({
      orderId,
      paymentStatus: PaymentStatus.PAID,
    });
    paymentRepository.findByOrderId.mockResolvedValue(null);

    await expect(sut.execute({ gatewayResourceId })).rejects.toThrow(
      NotFoundError
    );
    expect(paymentRepository.update).not.toHaveBeenCalled();
  });

  it("should propagate gateway errors", async () => {
    const error = new Error("Gateway error");
    paymentGateway.getPaymentDetails.mockRejectedValue(error);

    await expect(sut.execute({ gatewayResourceId })).rejects.toThrow(error);
    expect(paymentRepository.findByOrderId).not.toHaveBeenCalled();
    expect(paymentRepository.update).not.toHaveBeenCalled();
  });

  it("should handle null payment repository response", async () => {
    const gatewayResourceId = "gateway-123";
    paymentGateway.getPaymentDetails.mockResolvedValue({
      orderId: "non-existent-order",
      paymentStatus: PaymentStatus.PAID,
    });
    paymentRepository.findByOrderId.mockResolvedValue(null);

    await expect(sut.execute({ gatewayResourceId })).rejects.toThrow(
      new NotFoundError("Payment not found")
    );
  });

  it("should update payment with correct status from gateway", async () => {
    const payment = Payment.create(orderId, 100);
    const newStatus = PaymentStatus.PAID;

    paymentGateway.getPaymentDetails.mockResolvedValue({
      orderId,
      paymentStatus: newStatus,
    });
    paymentRepository.findByOrderId.mockResolvedValue(payment);

    await sut.execute({ gatewayResourceId });

    expect(payment.getStatus()).toBe(newStatus);
    expect(paymentRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: payment.paymentId,
        getStatus: expect.any(Function),
      })
    );
  });

  it("should handle repository update errors", async () => {
    const payment = Payment.create(orderId, 100);
    const error = new Error("Database error");

    paymentGateway.getPaymentDetails.mockResolvedValue({
      orderId,
      paymentStatus: PaymentStatus.PAID,
    });
    paymentRepository.findByOrderId.mockResolvedValue(payment);
    paymentRepository.update.mockRejectedValue(error);

    await expect(sut.execute({ gatewayResourceId })).rejects.toThrow(error);
  });
});
