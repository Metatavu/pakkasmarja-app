import LocalizedStrings, { LocalizedStringsMethods } from 'localized-strings';

export interface Strings extends LocalizedStringsMethods {
  loginScreenHeader: string,
  loginScreenUsernameLabel: string,
  loginScreenPasswordLabel: string,
  loginScreenLoginButton: string
}

const strings: Strings = new LocalizedStrings({
  en: require("./en.json"),
  fi: require("./fi.json")
});

export default strings;