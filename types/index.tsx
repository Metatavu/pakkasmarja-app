import { Contract, ItemGroup, AreaDetail } from "pakkasmarja-client";

export interface StoreState {
  accessToken?: AccessToken,
}

export interface AuthConfig {
  url: string
  realmId: string
  clientId: string
  username: string
  password: string
}

export interface AccessToken {
  created: Date
  access_token: string
  expires_in: number
  refresh_token: number
  refresh_expires_in: number
  url: string
  client_id: string
  realmId: string,
  firstName: string,
  lastName: string,
  userId: string
}

/**
 * Interface for contract table data
 */
export interface ContractTableData {
  contract: Contract,
  itemGroup?: ItemGroup
}

/**
 * Type for input keyboard
 */
export type KeyboardType = "default" | "email-address" | "numeric" | "phone-pad" | "visible-password" | "ascii-capable" | "numbers-and-punctuation" | "url" | "number-pad" | "name-phone-pad" | "decimal-pad" | "twitter" | "web-search" | undefined;

/**
 * Interface for contract data
 */
export interface ContractData {
  rejectComment: string,
  proposedQuantity: number,
  deliverAllChecked: boolean,
  quantityComment: string,
  areaDetailValues: AreaDetail[],
  deliveryPlaceId: string,
  deliveryPlaceComment: string
}

/**
 * POISTA MYÖHEMMIN
 */
export interface DeliveryData {

    product: string,
    mainVariety: string,
    quantity: number,
    deliveryDate: Date,
    deliveryTime: string,
    packingWish: string,
    comment: string,
    status : string

}

/**
 * Type for contract data key
 */
export type ContractDataKey = "rejectComment" | "proposedQuantity" | "deliverAllChecked" | "quantityComment" | "areaDetailValues" | "deliveryPlaceId" | "deliveryPlaceComment";

/**
 * Interface for modal buttons
 */
export interface ModalButton {
  text: string,
  onPress: () => void
}