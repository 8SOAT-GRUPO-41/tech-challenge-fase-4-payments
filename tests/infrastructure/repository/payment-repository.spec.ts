import { PaymentRepositoryDatabase } from "@/infrastructure/repository";
import { Payment } from "@/domain/entities";
import { PaymentStatus } from "@/domain/enums";
import type { DatabaseConnection } from "@/infrastructure/database/database-connection";
import { mock } from "jest-mock-extended";

describe("PaymentRepository", () => {
  const databaseConnection = mock<DatabaseConnection>();
  const sut = new PaymentRepositoryDatabase(databaseConnection);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("save", () => {
    it("should save payment successfully", async () => {
      const payment = Payment.create("order-123", 100);
      databaseConnection.query.mockResolvedValue([]);

      await sut.save(payment);

      expect(databaseConnection.query).toHaveBeenCalledWith(
        "INSERT INTO payments (payment_id, order_id, status, amount, created_at) VALUES ($1, $2, $3, $4, $5)",
        [
          payment.paymentId,
          payment.getOrderId(),
          payment.getStatus(),
          payment.getAmount(),
          payment.getCreatedAt(),
        ]
      );
    });
  });

  describe("findByOrderId", () => {
    it("should find payment by order id", async () => {
      const paymentData = {
        payment_id: "payment-123",
        order_id: "order-123",
        status: PaymentStatus.PENDING,
        amount: 100,
        created_at: new Date(),
      };
      databaseConnection.query.mockResolvedValue([paymentData]);

      const payment = await sut.findByOrderId("order-123");

      expect(payment).toBeDefined();
      expect(payment?.paymentId).toBe(paymentData.payment_id);
      expect(payment?.getOrderId()).toBe(paymentData.order_id);
      expect(databaseConnection.query).toHaveBeenCalledWith(
        "SELECT payment_id, order_id, status, amount, created_at FROM payments WHERE order_id = $1",
        ["order-123"]
      );
    });

    it("should return null when payment is not found", async () => {
      databaseConnection.query.mockResolvedValue([]);

      const payment = await sut.findByOrderId("order-123");

      expect(payment).toBeNull();
    });
  });

  describe("update", () => {
    it("should update payment status", async () => {
      const payment = Payment.create("order-123", 100);
      payment.markAsPaid();
      databaseConnection.query.mockResolvedValue([]);

      await sut.update(payment);

      expect(databaseConnection.query).toHaveBeenCalledWith(
        "UPDATE payments SET status = $1 WHERE payment_id = $2",
        [payment.getStatus(), payment.paymentId]
      );
    });
  });
});
