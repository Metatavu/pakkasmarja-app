import { DeliveryPlace, ItemGroupCategory } from "pakkasmarja-client";

const SUONENJOKI_DELIVERY_PLACE_ID = "e1b8f10b-eb0c-4647-bf73-773e74f7ed7e";

/**
 * Rounds price to 2 decimal precision
 *
 * @param num number
 */
export const roundPrice = (num: number) => {
  return +(Math.round(parseFloat(`${num}` + "e+2")) + "e-2");
}

/**
 * Returns possible delivery places by category
 *
 * @param deliveryPlaces delivery places
 * @param category category
 */
export const filterPossibleDeliveryPlaces = (deliveryPlaces: DeliveryPlace[], category: ItemGroupCategory) => {
  return deliveryPlaces.filter(deliveryPlace =>
    deliveryPlace.id !== "OTHER" &&
    (category !== "FRESH" || deliveryPlace.id === SUONENJOKI_DELIVERY_PLACE_ID)
  );
}