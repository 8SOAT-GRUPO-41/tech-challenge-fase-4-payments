import type { Payment } from '@/domain/entities'

export interface PaymentRepository {
  save: (payment: Payment) => Promise<void>
  findByOrderId: (orderId: string) => Promise<Payment | null>
  update: (payment: Payment) => Promise<void>
}
