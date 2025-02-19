import { randomUUID } from 'node:crypto'
import { PaymentStatus } from '@/domain/enums'
import { DomainError } from '@/domain/errors'
import { Price } from '@/domain/value-objects'

export class Payment {
  private constructor(
    readonly paymentId: string,
    private orderId: string,
    private status: PaymentStatus,
    private amount: Price,
    private createdAt: Date = new Date()
  ) {
    if (amount.getValue() <= 0) {
      throw new DomainError('Payment amount must be greater than zero')
    }
  }

  static create(orderId: string, amount: number): Payment {
    const paymentId = randomUUID()
    return new Payment(paymentId, orderId, PaymentStatus.PENDING, new Price(amount))
  }

  static restore(paymentId: string, orderId: string, status: PaymentStatus, amount: number, createdAt: Date): Payment {
    return new Payment(paymentId, orderId, status, new Price(amount), createdAt)
  }

  getStatus = () => this.status

  getAmount = () => this.amount.getValue()

  getOrderId = () => this.orderId

  getCreatedAt = () => this.createdAt

  setStatus = (status: PaymentStatus) => {
    if (!this.canTransitionTo(status)) {
      throw new DomainError(`Can't transition from ${this.status} to ${status}`)
    }
    this.status = status
  }

  private canTransitionTo(status: PaymentStatus): boolean {
    const transitions: Record<PaymentStatus, PaymentStatus[]> = {
      [PaymentStatus.PENDING]: [PaymentStatus.PAID, PaymentStatus.CANCELED],
      [PaymentStatus.PAID]: [],
      [PaymentStatus.CANCELED]: []
    }
    return transitions[this.status].includes(status)
  }

  markAsPaid() {
    this.setStatus(PaymentStatus.PAID)
  }

  cancel() {
    this.setStatus(PaymentStatus.CANCELED)
  }

  toJSON() {
    return {
      paymentId: this.paymentId,
      orderId: this.orderId,
      status: this.status,
      amount: this.amount.getValue(),
      createdAt: this.createdAt.toISOString()
    }
  }
}
