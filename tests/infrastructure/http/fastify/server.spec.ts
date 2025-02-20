import { FastifyHttpServer } from "@/infrastructure/http/fastify/server";
import { paymentRoutes } from "@/infrastructure/http/routes";
import fastify from "fastify";

// Criando um mock mais específico
const mockPost = jest.fn();
const mockRegister = jest.fn().mockReturnThis();
const mockReady = jest.fn().mockResolvedValue(undefined);
const mockListen = jest.fn().mockResolvedValue(undefined);

const mockFastifyInstance = {
  register: mockRegister,
  ready: mockReady,
  listen: mockListen,
  post: mockPost,
};

// Mockando o fastify com tipo correto
jest.mock("fastify", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockFastifyInstance),
}));

jest.mock("@fastify/swagger", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@fastify/swagger-ui", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("FastifyHttpServer", () => {
  let sut: FastifyHttpServer;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = "development";
    sut = new FastifyHttpServer();
  });

  it("should create server with development logger when NODE_ENV is development", () => {
    expect(fastify).toHaveBeenCalledWith({
      logger: {
        transport: {
          target: "pino-pretty",
        },
        level: "debug",
      },
    });
  });

  it("should create server with production logger when NODE_ENV is production", () => {
    process.env.NODE_ENV = "production";
    sut = new FastifyHttpServer();
    expect(fastify).toHaveBeenCalledWith({
      logger: true,
    });
  });

  it("should register routes with prefix", async () => {
    await sut.listen(3000);

    paymentRoutes.forEach((route) => {
      expect(mockPost).toHaveBeenCalledWith(
        `/payments${route.url}`,
        { schema: route.schema },
        expect.any(Function)
      );
    });
  });

  it("should register swagger documentation", async () => {
    await sut.listen(3000);

    expect(mockRegister).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        openapi: expect.any(Object),
      })
    );

    expect(mockRegister).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        routePrefix: "/payments-docs",
      })
    );
  });

  it("should listen on specified port and host", async () => {
    await sut.listen(3000);

    expect(mockListen).toHaveBeenCalledWith({
      port: 3000,
      host: "0.0.0.0",
    });
  });
});
