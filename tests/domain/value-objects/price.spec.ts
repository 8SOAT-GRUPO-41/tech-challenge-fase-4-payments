import { Price } from "@/domain/value-objects";
import { InvalidParamError } from "@/domain/errors";

describe("Price Value Object", () => {
  it("should create a price with valid value", () => {
    const price = new Price(100);
    expect(price.getValue()).toBe(100);
  });

  it("should throw if price is negative", () => {
    expect(() => new Price(-1)).toThrow(InvalidParamError);
  });

  it("should throw InvalidParamError with custom message for negative price", () => {
    expect(() => new Price(-10)).toThrow("Invalid price");
  });

  it("should create price with zero value", () => {
    const price = new Price(0);
    expect(price.getValue()).toBe(0);
  });

  describe("applyDiscountPercentage", () => {
    it("should apply valid discount correctly", () => {
      const price = new Price(100);
      const discountedPrice = price.applyDiscountPercentage(0.1); // 10% discount
      expect(discountedPrice.getValue()).toBe(90);
    });

    it("should throw if discount is negative", () => {
      const price = new Price(100);
      expect(() => price.applyDiscountPercentage(-0.1)).toThrow(
        InvalidParamError
      );
    });

    it("should throw if discount is greater than 1", () => {
      const price = new Price(100);
      expect(() => price.applyDiscountPercentage(1.1)).toThrow(
        InvalidParamError
      );
    });
  });
});
