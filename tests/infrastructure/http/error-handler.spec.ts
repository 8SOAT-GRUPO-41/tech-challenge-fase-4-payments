import { HttpErrorHandler } from "@/infrastructure/http/error-handler";
import { HttpStatusCode } from "@/infrastructure/http/helper";
import {
  DomainError,
  NotFoundError,
  InvalidParamError,
  ConflictError,
  ExternalApiError,
} from "@/domain/errors";
import { ErrorCodes } from "@/domain/enums";
import type { HttpResponse } from "@/infrastructure/http/interfaces";

describe("HttpErrorHandler", () => {
  const sut = new HttpErrorHandler();

  it("should handle NotFoundError", () => {
    const error = new NotFoundError("Resource not found");
    const response = sut.handle(error) as HttpResponse;

    expect(response.statusCode).toBe(HttpStatusCode.NOT_FOUND);
    expect(response.body).toEqual({
      status: "error",
      statusCode: HttpStatusCode.NOT_FOUND,
      code: ErrorCodes.NOT_FOUND,
      message: "Resource not found",
    });
  });

  it("should handle DomainError with default code", () => {
    const error = new DomainError("Domain error");
    const response = sut.handle(error) as HttpResponse;

    expect(response.statusCode).toBe(HttpStatusCode.UNPROCESSABLE_ENTITY);
    expect(response.body).toEqual({
      status: "error",
      statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY,
      code: ErrorCodes.DOMAIN_ERROR,
      message: "Domain error",
    });
  });

  it("should handle DomainError with custom code", () => {
    const error = new DomainError("Custom error");
    const response = sut.handle(error) as HttpResponse;

    expect(response.statusCode).toBe(HttpStatusCode.UNPROCESSABLE_ENTITY);
    expect(response.body).toEqual({
      status: "error",
      statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY,
      code: ErrorCodes.DOMAIN_ERROR,
      message: "Custom error",
    });
  });

  it("should handle validation error", () => {
    const error = { code: "FST_ERR_VALIDATION", message: "Validation failed" };
    const response = sut.handle(error) as HttpResponse;

    expect(response.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
    expect(response.body).toEqual({
      status: "error",
      statusCode: HttpStatusCode.BAD_REQUEST,
      code: ErrorCodes.BAD_REQUEST,
      message: "Validation failed",
    });
  });

  it("should handle InvalidParamError", () => {
    const error = new InvalidParamError("Invalid parameter");
    const response = sut.handle(error) as HttpResponse;

    expect(response.statusCode).toBe(HttpStatusCode.UNPROCESSABLE_ENTITY);
    expect(response.body).toEqual({
      status: "error",
      statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY,
      code: ErrorCodes.INVALID_PARAM,
      message: "Invalid param: Invalid parameter",
    });
  });

  it("should handle ConflictError", () => {
    const error = new ConflictError("Resource already exists");
    const response = sut.handle(error) as HttpResponse;

    expect(response.statusCode).toBe(HttpStatusCode.CONFLICT);
    expect(response.body).toEqual({
      status: "error",
      statusCode: HttpStatusCode.CONFLICT,
      code: ErrorCodes.CONFLICT_ERROR,
      message: "Resource already exists",
    });
  });

  it("should handle ExternalApiError", () => {
    const error = new ExternalApiError("API error", "/endpoint", "GET", 500);
    const response = sut.handle(error) as HttpResponse;

    expect(response.statusCode).toBe(HttpStatusCode.SERVER_ERROR);
    expect(response.body).toEqual({
      status: "error",
      statusCode: HttpStatusCode.SERVER_ERROR,
      code: ErrorCodes.EXTERNAL_API_ERROR,
      message: "API error",
    });
  });

  it("should handle unknown errors", () => {
    const error = new Error("Unknown error");
    const response = sut.handle(error) as HttpResponse;

    expect(response.statusCode).toBe(HttpStatusCode.SERVER_ERROR);
    expect(response.body).toEqual({
      status: "error",
      statusCode: HttpStatusCode.SERVER_ERROR,
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      message: "Unknown error",
    });
  });

  it("should handle ExternalApiError with custom status code", () => {
    const error = new ExternalApiError(
      "Service unavailable",
      "/api",
      "POST",
      500
    );
    const response = sut.handle(error) as HttpResponse;

    expect(response.statusCode).toBe(HttpStatusCode.SERVER_ERROR);
    expect(response.body).toEqual({
      status: "error",
      statusCode: HttpStatusCode.SERVER_ERROR,
      code: ErrorCodes.EXTERNAL_API_ERROR,
      message: "Service unavailable",
    });
  });

  it("should handle DomainError with custom message", () => {
    const error = new DomainError("Custom domain error");
    const response = sut.handle(error);

    expect(response.body).toEqual({
      status: "error",
      statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY,
      code: ErrorCodes.DOMAIN_ERROR,
      message: "Custom domain error",
    });
  });

  it("should handle unknown error with stack trace in development", () => {
    process.env.NODE_ENV = "development";
    const error = new Error("Unknown error");
    const response = sut.handle(error) as HttpResponse;

    expect(response.body).toEqual({
      status: "error",
      statusCode: HttpStatusCode.SERVER_ERROR,
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      message: "Unknown error",
    });
  });

  it("should handle unknown error without stack trace in production", () => {
    process.env.NODE_ENV = "production";
    const error = new Error("Unknown error");
    error.stack = "Error stack trace";
    const response = sut.handle(error) as HttpResponse;

    expect(response.body).toEqual({
      status: "error",
      statusCode: HttpStatusCode.SERVER_ERROR,
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      message: "Unknown error",
    });
  });

  it("should handle validation error with custom message", () => {
    const error = {
      code: "FST_ERR_VALIDATION",
      message: "body/orderId must be a valid UUID",
    };
    const response = sut.handle(error) as HttpResponse;

    expect(response.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
    expect(response.body).toEqual({
      status: "error",
      statusCode: HttpStatusCode.BAD_REQUEST,
      code: ErrorCodes.BAD_REQUEST,
      message: "body/orderId must be a valid UUID",
    });
  });

  it("should handle error with custom code", () => {
    const error = new Error("Custom error");
    (error as any).code = "CUSTOM_ERROR";
    const response = sut.handle(error) as HttpResponse;

    expect(response.statusCode).toBe(HttpStatusCode.SERVER_ERROR);
    expect(response.body).toEqual({
      status: "error",
      statusCode: HttpStatusCode.SERVER_ERROR,
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      message: "Custom error",
    });
  });

  it("should handle error with undefined message", () => {
    const error = new Error();
    const response = sut.handle(error) as HttpResponse;

    expect(response.statusCode).toBe(HttpStatusCode.SERVER_ERROR);
    expect(response.body).toEqual({
      status: "error",
      statusCode: HttpStatusCode.SERVER_ERROR,
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      message: "Something unexpected happened",
    });
  });
});
