import { CreatePaymentController, PaymentWebhookController } from '@/infrastructure/controllers/payment-controller'
import type { Controller } from '@/infrastructure/controllers/interfaces'
import { makeCreatePayment, makeProcessPaymentWebhook } from '@/infrastructure/factories/usecases/payment'

export const makeCreatePaymentController = (): Controller => {
  return new CreatePaymentController(makeCreatePayment())
}

export const makePaymentWebhookController = (): Controller => {
  return new PaymentWebhookController(makeProcessPaymentWebhook())
}
