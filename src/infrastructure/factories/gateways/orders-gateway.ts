import type { OrdersGateway } from '@/application/ports'
import { OrdersGatewayMS } from '@/infrastructure/gateways'

export const makeOrdersGateway = (): OrdersGateway => {
  return new OrdersGatewayMS()
}
