import LocalizedStrings, { LocalizedStringsMethods } from 'localized-strings';
import en from "./en.json";
import fi from "./fi.json";

/**
 * Interface describing localized strings
 */
export interface Strings extends LocalizedStringsMethods {
  loginScreenHeader: string;
  loginScreenUsernameLabel: string;
  loginScreenPasswordLabel: string;
  loginScreenLoginButton: string;

  errorCommunicatingWithServer: string;
  errorFindingChatThread: string;
  accessTokenExpired: string;

  chatsNavHeader: string;
  questionsNavHeader: string;

  newsFooterLink: string;
  messagingFooterLink: string;
  deliveriesFooterLink: string;
  contractsFooterLink: string;

  noTitleAvailable: string;
  addImage: string;
  cancelButton: string;
  deleteButton: string;

  DeliveryStatusDelivery: string;
  DeliveryStatusPlanned: string;
  DeliveryStatusDone: string;

  freshDeliveries: string;
  frozenDeliveries: string;
  deliveryReception: string;

  fillAreaDetails: string;
  fillAllAreaDetailFields: string;
  insufficientContractAmount: string;

  contractDetailsReadFromContract: string;
  noMessages: string;

  contractRemainer: string;
  contractExceeded: string;
  contractQuantity: string;
  deliveredQuantity: string;

  comment: string;
  newDeliveryLoan: string;
}

const strings: Strings = new LocalizedStrings({ en, fi });

export default strings;
