import { paymentRoutes } from "@/infrastructure/http/routes";
import {
  makeCreatePaymentController,
  makePaymentWebhookController,
} from "@/infrastructure/factories/controllers";

jest.mock("@/infrastructure/factories/controllers", () => ({
  makeCreatePaymentController: jest.fn(),
  makePaymentWebhookController: jest.fn(),
}));

describe("Payment Routes", () => {
  it("should define correct routes", () => {
    expect(paymentRoutes).toHaveLength(2);

    const [createRoute, webhookRoute] = paymentRoutes;

    expect(createRoute).toEqual({
      method: "post",
      url: "/",
      schema: expect.any(Object),
      handler: makeCreatePaymentController,
    });

    expect(webhookRoute).toEqual({
      method: "post",
      url: "/webhook",
      schema: expect.any(Object),
      handler: makePaymentWebhookController,
    });
  });

  it("should have correct schema for create payment route", () => {
    const [createRoute] = paymentRoutes;

    expect(createRoute.schema).toEqual({
      tags: ["Payments"],
      summary: "Create payment",
      body: {
        type: "object",
        properties: {
          orderId: { type: "string", format: "uuid" },
          amount: { type: "number" },
        },
        required: ["orderId"],
      },
      response: {
        200: {
          type: "string",
        },
        400: expect.objectContaining({
          properties: expect.objectContaining({
            code: { type: "string", example: "BAD_REQUEST_ERROR" },
          }),
        }),
        422: expect.objectContaining({
          properties: expect.objectContaining({
            code: { type: "string", example: "UNPROCESSABLE_ENTITY_ERROR" },
          }),
        }),
        500: expect.objectContaining({
          properties: expect.objectContaining({
            code: { type: "string", example: "INTERNAL_SERVER_ERROR" },
          }),
        }),
      },
    });
  });

  it("should have correct schema for webhook route", () => {
    const [, webhookRoute] = paymentRoutes;

    expect(webhookRoute.schema).toEqual({
      tags: ["Payments"],
      summary: "Process payment webhook",
      body: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              id: { type: "string" },
            },
          },
          type: { type: "string", enum: ["payment"] },
        },
      },
      response: {
        204: {
          type: "null",
        },
        400: expect.objectContaining({
          properties: expect.objectContaining({
            code: { type: "string", example: "BAD_REQUEST_ERROR" },
          }),
        }),
        422: expect.objectContaining({
          properties: expect.objectContaining({
            code: { type: "string", example: "UNPROCESSABLE_ENTITY_ERROR" },
          }),
        }),
        500: expect.objectContaining({
          properties: expect.objectContaining({
            code: { type: "string", example: "INTERNAL_SERVER_ERROR" },
          }),
        }),
      },
    });
  });
});
