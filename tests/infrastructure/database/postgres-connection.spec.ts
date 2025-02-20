import { PostgresDatabaseConnection } from "@/infrastructure/database/postgres-connection";
import { Pool } from "pg";

const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockClient = {
  query: mockQuery,
  release: jest.fn(),
};

jest.mock("pg", () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: mockConnect.mockResolvedValue(mockClient),
  })),
}));

describe("PostgresDatabaseConnection", () => {
  let connection: PostgresDatabaseConnection;
  let originalConsoleError: typeof console.error;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv };
    jest.clearAllMocks();
    PostgresDatabaseConnection["instance"] = null;
    originalConsoleError = console.error;
    console.error = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    console.error = originalConsoleError;
  });

  it("should create singleton instance", () => {
    const instance1 = PostgresDatabaseConnection.getInstance();
    const instance2 = PostgresDatabaseConnection.getInstance();
    expect(instance1).toBe(instance2);
  });

  it("should create pool with correct config", () => {
    process.env.DB_USER = "testuser";
    process.env.DB_PASSWORD = "testpass";
    process.env.DB_NAME = "testdb";
    process.env.DB_HOST = "testhost";
    process.env.DB_PORT = "5432";

    PostgresDatabaseConnection.getInstance();

    expect(Pool).toHaveBeenCalledWith({
      user: "testuser",
      password: "testpass",
      database: "testdb",
      host: "testhost",
      port: 5432,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  });

  it("should execute query successfully", async () => {
    const mockResult = { rows: [{ id: 1 }] };
    mockQuery.mockResolvedValue(mockResult);

    connection = PostgresDatabaseConnection.getInstance();
    const result = await connection.query("SELECT * FROM test", []);

    expect(mockConnect).toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalledWith("SELECT * FROM test", []);
    expect(result).toEqual([{ id: 1 }]);
    expect(mockClient.release).toHaveBeenCalled();
  });

  it("should handle query errors", async () => {
    const dbError = new Error("Database error");
    mockQuery.mockRejectedValue(dbError);

    connection = PostgresDatabaseConnection.getInstance();
    await expect(connection.query("SELECT * FROM test", [])).rejects.toThrow(
      "Error executing query"
    );
    expect(console.error).toHaveBeenCalledWith("Query error:", dbError);
    expect(mockClient.release).toHaveBeenCalled();
  });

  it("should handle missing environment variables", () => {
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_NAME;
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;

    const instance = PostgresDatabaseConnection.getInstance();
    expect(instance).toBeDefined();
    expect(Pool).toHaveBeenCalledWith({
      user: undefined,
      password: undefined,
      database: undefined,
      host: undefined,
      port: NaN,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  });

  it("should handle client connection errors", async () => {
    const connectionError = new Error("Connection failed");
    mockConnect.mockRejectedValueOnce(connectionError);

    connection = PostgresDatabaseConnection.getInstance();
    await expect(connection.query("SELECT 1", [])).rejects.toThrow(
      connectionError.message
    );
  });

  it("should handle null query results", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    connection = PostgresDatabaseConnection.getInstance();
    const result = await connection.query("SELECT 1", []);
    expect(result).toEqual([]);
  });
});
