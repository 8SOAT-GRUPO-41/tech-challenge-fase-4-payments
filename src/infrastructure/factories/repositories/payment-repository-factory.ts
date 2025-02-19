import { PaymentRepositoryDatabase } from '@/infrastructure/repository'
import { PostgresDatabaseConnection } from '@/infrastructure/database/postgres-connection'
import type { PaymentRepository } from '@/application/ports'

export const makePaymentRepository = (): PaymentRepository => {
  return new PaymentRepositoryDatabase(PostgresDatabaseConnection.getInstance())
}
