import { ExternalApiError } from "@/domain/errors";

describe("ExternalApiError", () => {
  it("should create error with correct properties", () => {
    const error = new ExternalApiError("Test error", "/test", "GET", 500);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Test error");
    expect(error.name).toBe("ExternalApiError");
    expect(error).toHaveProperty("endpoint", "/test");
    expect(error).toHaveProperty("method", "GET");
    expect(error).toHaveProperty("status", 500);
  });

  it("should handle different status codes", () => {
    const error = new ExternalApiError(
      "Service unavailable",
      "/api/service",
      "POST",
      503
    );

    expect(error.message).toBe("Service unavailable");
    expect(error).toHaveProperty("endpoint", "/api/service");
    expect(error).toHaveProperty("method", "POST");
    expect(error).toHaveProperty("status", 503);
  });
});
