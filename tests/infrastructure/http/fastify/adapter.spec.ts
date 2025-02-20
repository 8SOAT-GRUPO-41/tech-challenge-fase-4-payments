import { adaptFastifyRoute } from "@/infrastructure/http/fastify/adapter";
import type { Controller } from "@/infrastructure/controllers/interfaces";
import type { FastifyReply, FastifyRequest, FastifyInstance } from "fastify";
import { mock } from "jest-mock-extended";

describe("FastifyAdapter", () => {
  const controller = mock<Controller>();
  const request = {
    body: { data: "test" },
    params: { id: "123" },
    query: { filter: "active" },
    log: {
      error: jest.fn(),
    },
  } as unknown as FastifyRequest;

  const reply = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  } as unknown as FastifyReply;

  const fastifyInstance = {
    server: {},
    pluginName: "test",
    prefix: "",
    version: "",
    // ... outras propriedades necessárias
  } as unknown as FastifyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should adapt controller successfully", async () => {
    const httpResponse = {
      statusCode: 200,
      body: { success: true },
    };
    controller.handle.mockResolvedValue(httpResponse);

    const handler = adaptFastifyRoute(controller);
    await handler.bind(fastifyInstance)(request, reply);

    expect(controller.handle).toHaveBeenCalledWith({
      body: request.body,
      params: request.params,
      query: request.query,
    });
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({ success: true });
  });

  it("should handle errors properly", async () => {
    const error = new Error("Test error");
    controller.handle.mockRejectedValue(error);

    const handler = adaptFastifyRoute(controller);
    await handler.bind(fastifyInstance)(request, reply);

    expect(request.log.error).toHaveBeenCalledWith(error);
    expect(reply.status).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "error",
      })
    );
  });
});
