/**
 * Rounds price to 2 decimal precision
 *
 * @param num number
 */
export const roundPrice = (num: number) => {
  return +(Math.round(parseFloat(`${num}` + "e+2")) + "e-2");
}