import LocalizedStrings, { LocalizedStringsMethods } from 'localized-strings';
import { LocalizedEntry } from "famifarm-typescript-models";

/**
 * Helper class for using localized values
 */
export default class LocalizedUtils {

  /**
   * Returns localized value
   * 
   * @param entry localized entry 
   * @param locale Locale
   * @returns value
   */
  public static getLocalizedValue(entry?: LocalizedEntry, locale?: string): string {
    if (!entry) {
      return "";
    }

    if (!locale) {
      locale = "en";
    }

    // TODO: autodetect language

    for (let i = 0; i < entry.length; i++) {
      if (locale === entry[i].language) {
        return entry[i].value;
      }
    }

    if (locale != "fi") {
      return this.getLocalizedValue(entry, "fi");
    }
    
    return "";
  }

}

