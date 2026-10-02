export const MINIMUM_ORDER_VALUE = 299;
export const FREE_DELIVERY_VALUE = 499;
export const DELIVERY_CHARGE = 49;

export const getDeliveryCharge = subtotal =>
  subtotal === 0 || subtotal >= FREE_DELIVERY_VALUE ? 0 : DELIVERY_CHARGE;

export const getFreeDeliveryRemaining = subtotal =>
  Math.max(0, FREE_DELIVERY_VALUE - subtotal);

export const getMinimumOrderRemaining = subtotal =>
  Math.max(0, MINIMUM_ORDER_VALUE - subtotal);
