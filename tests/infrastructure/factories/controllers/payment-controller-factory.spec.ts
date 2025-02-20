import {
  makeCreatePaymentController,
  makePaymentWebhookController,
} from "@/infrastructure/factories/controllers";
import {
  CreatePaymentController,
  PaymentWebhookController,
} from "@/infrastructure/controllers/payment-controller";

describe("PaymentControllerFactory", () => {
  it("should create CreatePaymentController with correct dependencies", () => {
    const controller = makeCreatePaymentController();

    expect(controller).toBeInstanceOf(CreatePaymentController);
  });

  it("should create PaymentWebhookController with correct dependencies", () => {
    const controller = makePaymentWebhookController();

    expect(controller).toBeInstanceOf(PaymentWebhookController);
  });
});
