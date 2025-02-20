import {
  CreatePaymentController,
  PaymentWebhookController,
} from "@/infrastructure/controllers/payment-controller";
import {
  CreatePayment,
  ProcessPaymentWebhook,
} from "@/application/usecases/payment";
import { HttpStatusCode } from "@/infrastructure/http/helper";
import { mock } from "jest-mock-extended";
import { ConflictError, InvalidParamError } from "@/domain/errors";
import type { HttpRequest } from "@/infrastructure/http/interfaces";
import { ErrorCodes } from "@/domain/enums";
import { DomainError } from "@/domain/errors";

describe("PaymentController", () => {
  describe("CreatePaymentController", () => {
    const createPaymentUseCase = mock<CreatePayment>();
    const sut = new CreatePaymentController(createPaymentUseCase);

    it("should create payment successfully", async () => {
      const qrCode = "qr-code-data";
      const request: HttpRequest = {
        body: {
          orderId: "123",
          amount: 100,
        },
        query: {},
        params: {},
      };
      createPaymentUseCase.execute.mockResolvedValue(qrCode);

      const response = await sut.handle(request);

      expect(response.statusCode).toBe(HttpStatusCode.OK);
      expect(response.body).toBe(qrCode);
    });

    it("should handle conflict errors", async () => {
      const request: HttpRequest = {
        body: {
          orderId: "123",
          amount: 100,
        },
        query: {},
        params: {},
      };

      createPaymentUseCase.execute.mockRejectedValue(
        new ConflictError("Payment already exists for this order")
      );

      try {
        await sut.handle(request);
        fail("Should have thrown an error");
      } catch (err) {
        const error = err as ConflictError;
        expect(error).toBeInstanceOf(ConflictError);
        expect(error.message).toBe("Payment already exists for this order");
      }
    });

    it("should handle domain errors", async () => {
      const request: HttpRequest = {
        body: {
          orderId: "123",
          amount: 0,
        },
        query: {},
        params: {},
      };

      createPaymentUseCase.execute.mockRejectedValue(
        new DomainError("Payment amount must be greater than zero")
      );

      try {
        await sut.handle(request);
        fail("Should have thrown an error");
      } catch (err) {
        const error = err as DomainError;
        expect(error).toBeInstanceOf(DomainError);
        expect(error.message).toBe("Payment amount must be greater than zero");
      }
    });
  });

  describe("PaymentWebhookController", () => {
    const processPaymentWebhookUseCase = mock<ProcessPaymentWebhook>();
    const sut = new PaymentWebhookController(processPaymentWebhookUseCase);

    it("should process webhook successfully", async () => {
      const request: HttpRequest = {
        body: {
          type: "payment",
          data: { id: "123" },
        },
        query: {},
        params: {},
      };

      processPaymentWebhookUseCase.execute.mockResolvedValue(undefined);

      const response = await sut.handle(request);

      expect(response.statusCode).toBe(HttpStatusCode.NO_CONTENT);
      expect(processPaymentWebhookUseCase.execute).toHaveBeenCalledWith({
        gatewayResourceId: "123",
      });
    });

    it("should return no content for non-payment webhooks", async () => {
      const request: HttpRequest = {
        body: {
          type: "other",
          data: null,
        },
        query: {},
        params: {},
      };

      const response = await sut.handle(request);

      expect(response.statusCode).toBe(HttpStatusCode.NO_CONTENT);
    });

    it("should handle domain errors", async () => {
      const request: HttpRequest = {
        body: {
          type: "payment",
          data: { id: "123" },
        },
        query: {},
        params: {},
      };

      processPaymentWebhookUseCase.execute.mockRejectedValue(
        new DomainError("Invalid webhook payload")
      );

      try {
        await sut.handle(request);
        fail("Should have thrown an error");
      } catch (err) {
        const error = err as DomainError;
        expect(error).toBeInstanceOf(DomainError);
        expect(error.message).toBe("Invalid webhook payload");
      }
    });

    it("should handle unexpected errors", async () => {
      const request: HttpRequest = {
        body: {
          type: "payment",
          data: { id: "123" },
        },
        query: {},
        params: {},
      };

      processPaymentWebhookUseCase.execute.mockRejectedValue(
        new Error("Processing error")
      );

      try {
        await sut.handle(request);
        fail("Should have thrown an error");
      } catch (err) {
        const error = err as Error;
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("Processing error");
      }
    });
  });
});
