import type { OrdersGateway } from '@/application/ports'
import axios, { type AxiosInstance } from 'axios'

export class OrdersGatewayMS implements OrdersGateway {
  private readonly ordersServiceInstance: AxiosInstance

  constructor() {
    this.ordersServiceInstance = axios.create({
      baseURL: process.env.ORDERS_SERVICE_URL
    })
  }

  async setOrderAsPaid(orderId: string): Promise<void> {
    await this.ordersServiceInstance.put(`/orders/${orderId}/status`, {
      status: 'PAID'
    })
  }
}
