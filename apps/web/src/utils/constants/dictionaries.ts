export interface Dictionary {
  id: string;
  name: string;
  languages: string[];
  websiteUrl: string;
  getUrl: (vocab: string, sl: string, tl: string) => string;
}

const _getGoogleTranslateUrl = (
  text: string,
  sl: string,
  tl: string,
  op = "translate",
) => {
  const url = new URL("https://translate.google.com");
  url.search = new URLSearchParams({
    sl,
    tl,
    text,
    op,
  }).toString();
  return url.href;
};

const SeznamLanguageMap: Record<string, string> = {
  en: "anglicky",
  de: "nemecky",
  fr: "francouzsky",
  it: "italsky",
  es: "spanelsky",
  ru: "rusky",
  uk: "ukrajinsky",
  sk: "slovensky",
  pl: "polsky",
  cs: "chorvatsky",
};
const _getSeznamUrl = (text: string, tl: string) => {
  const lang = SeznamLanguageMap[tl] ?? "anglicky";
  return `https://slovnik.seznam.cz/preklad/${lang}/${text}`;
};

export const DICTIONARIES: Dictionary[] = [
  {
    id: "wiktionary",
    name: "Wiktionary",
    websiteUrl: "https://www.wiktionary.org",
    languages: ["bg", "cz", "de", "en", "es", "fr", "it", "uk"],
    getUrl: (vocab, _, tl) => `https://${tl}.wiktionary.org/wiki/${vocab}`,
  },
  {
    id: "google-translate",
    name: "Google Translate",
    websiteUrl: "https://translate.google.com",
    languages: ["bg", "cz", "de", "en", "es", "fr", "it", "uk"],
    getUrl: (vocab, sl, tl) => _getGoogleTranslateUrl(vocab, sl, tl),
  },
  {
    id: "seznam",
    name: "Seznam",
    websiteUrl: "https://slovnik.seznam.cz",
    languages: Object.keys(SeznamLanguageMap),
    getUrl: (vocab, sl, tl) => _getSeznamUrl(vocab, tl),
  },
];
