import { CreatePayment } from '@/application/usecases/payment'
import { makePaymentGateway } from '@/infrastructure/factories/gateways'
import { makePaymentRepository } from '@/infrastructure/factories/repositories'

export const makeCreatePayment = (): CreatePayment => {
  return new CreatePayment(makePaymentRepository(), makePaymentGateway())
}
