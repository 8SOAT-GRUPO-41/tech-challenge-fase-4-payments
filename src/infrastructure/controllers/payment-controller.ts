import { HttpStatusCode } from '@/infrastructure/http/helper'
import type { HttpRequest, HttpResponse } from '@/infrastructure/http/interfaces'
import type { Controller } from '@/infrastructure/controllers/interfaces'
import type { CreatePayment, ProcessPaymentWebhook } from '@/application/usecases/payment'

interface CreatePaymentInput {
  orderId: string
  amount: number
}

export class CreatePaymentController implements Controller {
  constructor(private readonly createPaymentUseCase: CreatePayment) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const input = request.body as CreatePaymentInput
    const qrCode = await this.createPaymentUseCase.execute(input)
    return {
      statusCode: HttpStatusCode.OK,
      body: qrCode
    }
  }
}

export class PaymentWebhookController implements Controller {
  constructor(private readonly processPaymentWebhookUseCase: ProcessPaymentWebhook) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const input = request.body as { data: { id: string }; type?: string }
    if (!input.data?.id && input.type !== 'payment') {
      return {
        statusCode: HttpStatusCode.NO_CONTENT,
        body: null
      }
    }
    await this.processPaymentWebhookUseCase.execute({
      gatewayResourceId: input.data.id
    })
    return {
      statusCode: HttpStatusCode.NO_CONTENT,
      body: null
    }
  }
}
