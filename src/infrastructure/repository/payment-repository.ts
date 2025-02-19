import type { PaymentRepository } from '@/application/ports'
import { Payment } from '@/domain/entities'
import type { PaymentStatus } from '@/domain/enums'
import type { DatabaseConnection } from '@/infrastructure/database/database-connection'

export class PaymentRepositoryDatabase implements PaymentRepository {
  constructor(private readonly databaseConnection: DatabaseConnection) {}

  async save(payment: Payment): Promise<void> {
    const sql = 'INSERT INTO payments (payment_id, order_id, status, amount, created_at) VALUES ($1, $2, $3, $4, $5)'
    const params = [
      payment.paymentId,
      payment.getOrderId(),
      payment.getStatus(),
      payment.getAmount(),
      payment.getCreatedAt()
    ]
    await this.databaseConnection.query(sql, params)
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    const sql = 'SELECT payment_id, order_id, status, amount, created_at FROM payments WHERE order_id = $1'
    const params = [orderId]
    const result = await this.databaseConnection.query<{
      payment_id: string
      order_id: string
      status: string
      amount: number
      created_at: Date
    }>(sql, params)
    const paymentQueryResult = result?.shift()
    if (!paymentQueryResult) return null
    return Payment.restore(
      paymentQueryResult.payment_id,
      paymentQueryResult.order_id,
      paymentQueryResult.status as PaymentStatus,
      paymentQueryResult.amount,
      paymentQueryResult.created_at
    )
  }

  async update(payment: Payment): Promise<void> {
    const sql = 'UPDATE payments SET status = $1 WHERE payment_id = $2'
    const params = [payment.getStatus(), payment.paymentId]
    await this.databaseConnection.query(sql, params)
  }
}
