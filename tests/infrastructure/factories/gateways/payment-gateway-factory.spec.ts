import { makePaymentGateway } from "@/infrastructure/factories/gateways";
import { MercadoPagoGateway } from "@/infrastructure/gateways/mercado-pago-gateway";

describe("PaymentGatewayFactory", () => {
  it("should create MercadoPagoGateway instance", () => {
    const gateway = makePaymentGateway();

    expect(gateway).toBeInstanceOf(MercadoPagoGateway);
  });
});
