import type { PaymentRepository, PaymentGateway } from '@/application/ports'
import { Payment } from '@/domain/entities'
import { ConflictError } from '@/domain/errors'

type Input = {
  orderId: string
  amount: number
}

export class CreatePayment {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentGateway: PaymentGateway
  ) {}

  async execute(input: Input) {
    const { orderId, amount } = input
    const existingPayment = await this.paymentRepository.findByOrderId(orderId)
    if (existingPayment) throw new ConflictError('Payment already exists for this order')
    const payment = Payment.create(orderId, amount)
    await this.paymentRepository.save(payment)
    return this.paymentGateway.generatePaymentQRCode({
      orderId: payment.getOrderId(),
      totalAmount: payment.getAmount()
    })
  }
}
