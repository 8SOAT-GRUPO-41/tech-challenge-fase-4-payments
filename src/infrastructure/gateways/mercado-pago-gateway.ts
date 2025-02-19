import type { GetPaymentDetailsOutput, PaymentGateway } from '@/application/ports'
import { PaymentStatus } from '@/domain/enums'
import { ExternalApiError } from '@/domain/errors'
import axios, { type AxiosError, type AxiosInstance } from 'axios'

interface MercadoPagoCreatePaymentResponse {
  qr_data: string
}

type MercadoPagoPaymentStatus =
  | 'approved'
  | 'pending'
  | 'authorized'
  | 'in_process'
  | 'in_mediation'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'charged_back'

interface MercadoPagoPaymentDetailsResponse {
  external_reference: string
  status: MercadoPagoPaymentStatus
}

export class MercadoPagoGateway implements PaymentGateway {
  private readonly mercadoPagoInstance: AxiosInstance
  private readonly mercadoPagoUserId: string
  private readonly mercadoPagoExternalPosId: string

  constructor() {
    this.mercadoPagoInstance = axios.create({
      baseURL: process.env.MERCADO_PAGO_API_URL,
      headers: {
        Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
      }
    })
    this.mercadoPagoUserId = process.env.MERCADO_PAGO_USER_ID || ''
    this.mercadoPagoExternalPosId = process.env.MERCADO_PAGO_EXTERNAL_POS_ID || ''
  }

  async generatePaymentQRCode(input: {
    totalAmount: number
    orderId: string
  }): Promise<string> {
    try {
      const response = await this.mercadoPagoInstance.post<MercadoPagoCreatePaymentResponse>(
        `/instore/orders/qr/seller/collectors/${this.mercadoPagoUserId}/pos/${this.mercadoPagoExternalPosId}/qrs`,
        {
          external_reference: input.orderId,
          title: 'LG41-Combo',
          description: 'Combo LG41',
          notification_url: process.env.PAYMENT_WEBHOOK_URL,
          total_amount: input.totalAmount,
          items: [
            {
              sku_number: '1234',
              category: 'FOOD',
              title: 'Combo LG41',
              unit_price: input.totalAmount,
              quantity: 1,
              total_amount: input.totalAmount,
              unit_measure: 'unit'
            }
          ]
        }
      )
      return response.data.qr_data
    } catch (error) {
      console.error(error)
      throw new ExternalApiError(
        'Error generating payment QR code with Mercado Pago',
        `/instore/orders/qr/seller/collectors/${this.mercadoPagoUserId}/pos/${this.mercadoPagoExternalPosId}/qrs`,
        'POST',
        (error as AxiosError).response?.status || 500
      )
    }
  }

  async getPaymentDetails(gatewayResourceId: string): Promise<GetPaymentDetailsOutput> {
    try {
      const response = await this.mercadoPagoInstance.get<MercadoPagoPaymentDetailsResponse>(
        `/v1/payments/${gatewayResourceId}`
      )
      return {
        orderId: response.data.external_reference,
        paymentStatus: this.convertPaymentStatus(response.data.status)
      }
    } catch (error) {
      console.error(error)
      throw new ExternalApiError(
        'Error getting payment details from Mercado Pago',
        `/v1/payments/${gatewayResourceId}`,
        'GET',
        (error as AxiosError).response?.status || 500
      )
    }
  }

  private convertPaymentStatus(mercadoPagoPaymentStatus: MercadoPagoPaymentStatus): PaymentStatus {
    switch (mercadoPagoPaymentStatus) {
      case 'approved':
        return PaymentStatus.PAID
      case 'pending':
        return PaymentStatus.PENDING
      case 'rejected':
      case 'cancelled':
        return PaymentStatus.CANCELED
      default:
        return PaymentStatus.CANCELED
    }
  }
}
