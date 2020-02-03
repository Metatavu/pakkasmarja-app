import LocalizedStrings, { LocalizedStringsMethods } from 'localized-strings';

export interface Strings extends LocalizedStringsMethods {
  loginScreenHeader: string
  loginScreenUsernameLabel: string
  loginScreenPasswordLabel: string
  loginScreenLoginButton: string

  errorCommunicatingWithServer: string
  errorFindingChatThread: string
  accessTokenExpired: string

  chatsNavHeader: string
  questionsNavHeader: string

  newsFooterLink: string
  messagingFooterLink: string
  deliveriesFooterLink: string
  contractsFooterLink: string

  noTitleAvailable: string
  addImage: string
  cancelButton: string

  DeliveryStatusDelivery: string
  DeliveryStatusPlanned: string
  DeliveryStatusDone: string
}

const strings: Strings = new LocalizedStrings({
  en: require("./en.json"),
  fi: require("./fi.json")
});

export default strings;