import { makeCreatePaymentController, makePaymentWebhookController } from '@/infrastructure/factories/controllers'
import { errorResponseSchema } from '@/infrastructure/swagger/error-response-schema'
import { ErrorCodes } from '@/domain/enums'
import type { HttpRoute } from '@/infrastructure/http/interfaces'

export const paymentRoutes = [
  {
    method: 'post',
    url: '/',
    handler: makeCreatePaymentController,
    schema: {
      tags: ['Payments'],
      summary: 'Create payment',
      body: {
        type: 'object',
        properties: {
          orderId: { type: 'string', format: 'uuid' },
          amount: { type: 'number' }
        },
        required: ['orderId']
      },
      response: {
        200: {
          type: 'string'
        },
        400: errorResponseSchema(400, ErrorCodes.BAD_REQUEST),
        422: errorResponseSchema(422, ErrorCodes.UNPROCESSABLE_ENTITY),
        500: errorResponseSchema(500, ErrorCodes.INTERNAL_SERVER_ERROR)
      }
    }
  },
  {
    method: 'post',
    url: '/webhook',
    handler: makePaymentWebhookController,
    schema: {
      tags: ['Payments'],
      summary: 'Process payment webhook',
      body: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              id: { type: 'string' }
            }
          },
          type: { type: 'string', enum: ['payment'] }
        }
      },
      response: {
        204: {
          type: 'null'
        },
        400: errorResponseSchema(400, ErrorCodes.BAD_REQUEST),
        422: errorResponseSchema(422, ErrorCodes.UNPROCESSABLE_ENTITY),
        500: errorResponseSchema(500, ErrorCodes.INTERNAL_SERVER_ERROR)
      }
    }
  }
] as HttpRoute[]
