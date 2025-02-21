export interface OrdersGateway {
  setOrderAsPaid(orderId: string): Promise<void>
}
