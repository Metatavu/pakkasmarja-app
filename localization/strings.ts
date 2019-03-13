import LocalizedStrings, { LocalizedStringsMethods } from 'localized-strings';

export interface Strings extends LocalizedStringsMethods {
  loginScreenHeader: string
  loginScreenUsernameLabel: string
  loginScreenPasswordLabel: string
  loginScreenLoginButton: string

  errorCommunicatingWithServer: string
  errorFindingChatThread: string

  chatsNavHeader: string
  questionsNavHeader: string

  newsFooterLink: string
  messagingFooterLink: string
  deliveriesFooterLink: string
  contractsFooterLink: string

}

const strings: Strings = new LocalizedStrings({
  en: require("./en.json"),
  fi: require("./fi.json")
});

export default strings;