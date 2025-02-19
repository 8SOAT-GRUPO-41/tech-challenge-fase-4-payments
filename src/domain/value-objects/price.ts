import { InvalidParamError } from '../errors/invalid-param-error'

export class Price {
  constructor(private readonly price: number) {
    if (price < 0) {
      throw new InvalidParamError('Invalid price')
    }
  }

  getValue(): number {
    return this.price
  }

  applyDiscountPercentage(discount: number): Price {
    if (discount < 0 || discount > 1) {
      throw new InvalidParamError('Invalid discount')
    }
    const discountedPrice = this.price - this.price * discount
    return new Price(discountedPrice)
  }
}
