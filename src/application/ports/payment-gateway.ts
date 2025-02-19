import type { PaymentStatus } from '@/domain/enums'

export interface PaymentGateway {
  generatePaymentQRCode: (input: {
    totalAmount: number
    orderId: string
  }) => Promise<string>
  getPaymentDetails: (gatewayResourceId: string) => Promise<GetPaymentDetailsOutput>
}

export interface GetPaymentDetailsOutput {
  orderId: string
  paymentStatus: PaymentStatus
}
