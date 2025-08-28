import { OrderSide } from '@grofit/contracts'
import type { ItemInSet } from './items'
import type { UserInfo } from './common'

export type OrderType = OrderSide

/** Common order details returned by the API. */
export interface OrderDetails {
  id: string
  platinum: number
  quantity: number
  visible: boolean
  order_type: OrderSide
  platform: string
  region: string
  creation_date: string
  last_update: string
  subtype: string
  item: ItemInSet
}

/** Order with user information. */
export interface OrderWithUser extends OrderDetails {
  user: UserInfo
}

/** Payload structure for order endpoints. */
export interface OrderPayload {
  orders: OrderWithUser[]
}

/** Response structure for orders endpoints. */
export interface OrdersResponse {
  payload: OrderPayload
}

/** Payload structure for user orders endpoints. */
export interface UserOrdersPayload {
  sell_orders: OrderDetails[]
  buy_orders: OrderDetails[]
}

/** Response structure for user orders endpoints. */
export interface UserOrdersResponse {
  payload: UserOrdersPayload
}

/** Payload for create/update order response. */
export interface OrderCreateUpdatePayload {
  order: OrderDetails
}

/** Response structure for create/update order endpoints. */
export interface OrderCreateUpdateResponse {
  payload: OrderCreateUpdatePayload
}

/** Response structure for delete order endpoint. */
export interface OrderDeleteResponse {
  payload: Record<string, any> // Typically empty or with status info
}
