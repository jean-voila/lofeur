import { useEffect } from "react";
import App from "./App";
import SeoGuide from "./SeoGuide";
import { useI18n } from "./i18n";
import { applySeo } from "./seo";
export default function Site() {
  const { locale } = useI18n();
  useEffect(() => applySeo(locale), [locale]);
  return (
    <>
      <App />
      <SeoGuide />
    </>
  );
}
