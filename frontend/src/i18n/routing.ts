import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ja", "es", "zh", "pt"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});
