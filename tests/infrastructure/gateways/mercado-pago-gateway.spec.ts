import { MercadoPagoGateway } from "@/infrastructure/gateways/mercado-pago-gateway";
import { PaymentStatus } from "@/domain/enums";
import { ExternalApiError } from "@/domain/errors";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("MercadoPagoGateway", () => {
  let sut: MercadoPagoGateway;
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    originalConsoleError = console.error;
    console.error = jest.fn();
    process.env.MERCADO_PAGO_API_URL = "http://api.mp.com";
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "token";
    process.env.MERCADO_PAGO_USER_ID = "user-123";
    process.env.MERCADO_PAGO_EXTERNAL_POS_ID = "pos-123";
    process.env.PAYMENT_WEBHOOK_URL = "http://webhook.url";

    mockedAxios.create.mockReturnValue(mockedAxios);
    sut = new MercadoPagoGateway();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe("constructor", () => {
    it("should handle missing environment variables", () => {
      delete process.env.MERCADO_PAGO_USER_ID;
      delete process.env.MERCADO_PAGO_EXTERNAL_POS_ID;

      const gateway = new MercadoPagoGateway();
      expect(gateway).toBeDefined();
    });
  });

  describe("generatePaymentQRCode", () => {
    const input = {
      orderId: "order-123",
      totalAmount: 100,
    };

    it("should generate QR code successfully", async () => {
      const qrData = "qr-code-data";
      mockedAxios.post.mockResolvedValue({ data: { qr_data: qrData } });

      const result = await sut.generatePaymentQRCode(input);

      expect(result).toBe(qrData);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("/qrs"),
        expect.objectContaining({
          external_reference: input.orderId,
          total_amount: input.totalAmount,
        })
      );
    });

    it("should handle axios error without response", async () => {
      const error = new Error("Network error");
      mockedAxios.post.mockRejectedValue(error);

      await expect(sut.generatePaymentQRCode(input)).rejects.toThrow(
        ExternalApiError
      );
      expect(mockedAxios.post).toHaveBeenCalled();
    });
  });

  describe("getPaymentDetails", () => {
    const gatewayResourceId = "payment-123";

    it("should get payment details successfully", async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          external_reference: "order-123",
          status: "approved",
        },
      });

      const result = await sut.getPaymentDetails(gatewayResourceId);

      expect(result).toEqual({
        orderId: "order-123",
        paymentStatus: PaymentStatus.PAID,
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(gatewayResourceId)
      );
    });

    it("should handle axios error without response", async () => {
      const error = new Error("Network error");
      mockedAxios.get.mockRejectedValue(error);

      await expect(sut.getPaymentDetails("payment-123")).rejects.toThrow(
        ExternalApiError
      );
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    it.each([
      ["approved", PaymentStatus.PAID],
      ["pending", PaymentStatus.PENDING],
      ["rejected", PaymentStatus.CANCELED],
      ["cancelled", PaymentStatus.CANCELED],
      ["in_process", PaymentStatus.CANCELED],
    ])("should convert %s status to %s", async (mpStatus, expectedStatus) => {
      mockedAxios.get.mockResolvedValue({
        data: {
          external_reference: "order-123",
          status: mpStatus,
        },
      });

      const result = await sut.getPaymentDetails(gatewayResourceId);
      expect(result.paymentStatus).toBe(expectedStatus);
    });
  });
});
