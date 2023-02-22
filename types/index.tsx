import { Contract, ItemGroup, AreaDetail, WeekDeliveryPrediction, Delivery, Product, ItemGroupCategory, Unread, Contact } from "pakkasmarja-client";

export interface StoreState {
  accessToken?: AccessToken,
  deliveries?: DeliveriesState,
  itemGroupCategory?: ItemGroupCategory,
  unreads: Unread[]
}

export interface AppConfigDeliveryOptions {
  "fresh-delivery-place-id": string
}

export interface AppConfigContractsOptions {
  visible: boolean,
  except: string[]
}

export interface AppConfigItemGroupOptions {
  "allow-delivery-all"?: boolean,
  "require-area-details": boolean
}

export interface AppConfigOptions {
  "delivery": AppConfigDeliveryOptions,
  "contracts-question-group": number,
  "contracts": AppConfigContractsOptions,
  "item-groups": { [key: string]: AppConfigItemGroupOptions }
}

export interface DeliveriesState {
  freshDeliveryData: DeliveryProduct[];
  frozenDeliveryData: DeliveryProduct[];
}

export interface AuthConfig {
  url: string
  realmId: string
  clientId: string
  username: string
  password: string
}

export interface AccessToken {
  realmRoles: string[],
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
  userId: string,
  receiveFromPlaceCode?: string
}

/**
 * Interface for contract table data
 */
export interface ContractTableData {
  contract: Contract,
  itemGroup?: ItemGroup
}

/**
 * Interface for contract table data
 */
export interface WeekDeliveryPredictionTableData {
  weekDeliveryPrediction: WeekDeliveryPrediction,
  itemGroup: ItemGroup
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
  proposedDeliveryPlaceId: string,
  deliveryPlaceComment: string
}

/**
 * Type for contract data key
 */
export type ContractDataKey = "rejectComment" | "proposedQuantity" | "deliverAllChecked" | "quantityComment" | "areaDetailValues" | "deliveryPlaceId" |  "proposedDeliveryPlaceId" |"deliveryPlaceComment";

/**
 * Type for delivery data key
 */
export type DeliveryDataKey = "amount" | "deliveryPlaceId" | "deliveryTimeValue" | "selectedTime";

/**
 * Type for box key
 */
export type BoxKey = "redBoxesLoaned" | "redBoxesReturned" | "grayBoxesLoaned" | "grayBoxesReturned" | "orangeBoxesLoaned" | "orangeBoxesReturned";

/**
 * Type for manage contact key
 */
export type ManageContactKey =
  "firstName" |
  "lastName" |
  "companyName" |
  "phoneNumber1" |
  "phoneNumber2" |
  "email" |
  "audit" |
  "sapId" |
  "BIC" |
  "IBAN" |
  "taxCode" |
  "alv" |
  "postNumber" |
  "postAddress" |
  "city" |
  "farmPostNumber" |
  "farmPostAddress" |
  "farmCity" |
  "vatLiable";

/**
  * Interface for manage contact inputs
  */
export interface ManageContactInput {
  label: string,
  key: ManageContactKey,
  isDisabled?: boolean
}

/**
 * Interface for modal buttons
 */
export interface ModalButton {
  text: string,
  onPress: () => void
}

/**
 * Interface for Week day object
 */
export interface WeekDay {
  name: Day;
  displayName: string;
  value: boolean;
};

/**
 * Type for day
 */
type Day = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

/**
 * Interface for delivery and product
 */
export interface DeliveryProduct {
  delivery: Delivery;
  product?: Product;
}

/**
 * Interface for delivery with contact
 */
export interface DeliveryListItem {
  delivery: Delivery,
  product?: Product,
  contact?: Contact
}

/**
 * Type for delivery note data keys
 */
export type DeliveryNoteDataKeys = "imageUri" | "imageType" | "text";

/**
 * Interface for delivery note data
 */
export interface DeliveryNoteData {
  imageUri: string;
  imageType: string;
  text: string;
}

/**
 * Type representing chat conversation type
 */
export type ConversationType = "CHAT" | "QUESTION";