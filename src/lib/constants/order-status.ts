export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Pendiente',
  [ORDER_STATUS.PAID]: 'Pagado',
  [ORDER_STATUS.DELIVERED]: 'Entregado',
  [ORDER_STATUS.FAILED]: 'Fallido',
  [ORDER_STATUS.REFUNDED]: 'Reembolsado',
} as const;

export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [ORDER_STATUS.PAID]: 'bg-blue-100 text-blue-800',
  [ORDER_STATUS.DELIVERED]: 'bg-green-100 text-green-800',
  [ORDER_STATUS.FAILED]: 'bg-red-100 text-red-800',
  [ORDER_STATUS.REFUNDED]: 'bg-gray-100 text-gray-800',
} as const;

export const VALID_ORDER_STATUS = Object.values(ORDER_STATUS);
