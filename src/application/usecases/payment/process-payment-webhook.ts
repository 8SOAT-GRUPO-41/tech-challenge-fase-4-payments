import type { PaymentGateway, PaymentRepository } from '@/application/ports'
import { NotFoundError } from '@/domain/errors'

type Input = {
  gatewayResourceId: string
}

export class ProcessPaymentWebhook {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentGateway: PaymentGateway
  ) {}

  async execute({ gatewayResourceId }: Input): Promise<void> {
    const paymentDetails = await this.paymentGateway.getPaymentDetails(gatewayResourceId)
    const payment = await this.paymentRepository.findByOrderId(paymentDetails.orderId)
    if (!payment) throw new NotFoundError('Payment not found')
    payment.setStatus(paymentDetails.paymentStatus)
    await this.paymentRepository.update(payment)
  }
}
