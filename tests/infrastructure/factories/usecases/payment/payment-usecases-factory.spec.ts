import {
  makeCreatePayment,
  makeProcessPaymentWebhook,
} from "@/infrastructure/factories/usecases/payment";
import {
  CreatePayment,
  ProcessPaymentWebhook,
} from "@/application/usecases/payment";

describe("Payment UseCases Factory", () => {
  it("should create CreatePayment with correct dependencies", () => {
    const useCase = makeCreatePayment();

    expect(useCase).toBeInstanceOf(CreatePayment);
  });

  it("should create ProcessPaymentWebhook with correct dependencies", () => {
    const useCase = makeProcessPaymentWebhook();

    expect(useCase).toBeInstanceOf(ProcessPaymentWebhook);
  });
});
