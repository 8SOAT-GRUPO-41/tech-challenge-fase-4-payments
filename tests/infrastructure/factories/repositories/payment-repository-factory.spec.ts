import { makePaymentRepository } from "@/infrastructure/factories/repositories";
import { PaymentRepositoryDatabase } from "@/infrastructure/repository";

describe("PaymentRepositoryFactory", () => {
  it("should create PaymentRepositoryDatabase instance", () => {
    const repository = makePaymentRepository();

    expect(repository).toBeInstanceOf(PaymentRepositoryDatabase);
  });
});
