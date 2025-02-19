import type { PaymentGateway } from '@/application/ports'
import { MercadoPagoGateway } from '@/infrastructure/gateways/mercado-pago-gateway'

export const makePaymentGateway = (): PaymentGateway => {
  return new MercadoPagoGateway()
}
