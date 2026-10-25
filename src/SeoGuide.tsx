import { Info, X } from "lucide-react";
import { useI18n, locales } from "./i18n";
import { seoCopy } from "./seo-content";
import { localePath } from "./locale-routing";
export default function SeoGuide() {
  const { locale, setLocale } = useI18n();
  const copy = seoCopy[locale];
  return (
    <details className="site-guide">
      <summary
        className="glass icon-button"
        title={copy.guide}
        aria-label={copy.guide}
      >
        <Info />
        <span className="sr-only">{copy.guide}</span>
      </summary>
      <article className="guide-article glass" aria-labelledby="site-heading">
        <button
          className="guide-close icon-button"
          aria-label={copy.close}
          onClick={(e) => {
            const details = e.currentTarget.closest("details");
            if (details) {
              details.open = false;
              details.querySelector("summary")?.focus();
            }
          }}
        >
          <X />
        </button>
        <h1 id="site-heading">{copy.heading}</h1>
        <p>{copy.intro}</p>
        <h2>{copy.featuresTitle}</h2>
        <ul>
          {copy.features.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
        <h2>{copy.howTitle}</h2>
        <p>{copy.how}</p>
        <h2>{copy.faqTitle}</h2>
        <dl>
          {copy.faq.map(([q, a]) => (
            <div key={q}>
              <dt>{q}</dt>
              <dd>{a}</dd>
            </div>
          ))}
        </dl>
        <p className="guide-credits">{copy.credits}</p>
        <nav aria-label={copy.languages}>
          {locales.map((l) => (
            <a
              key={l.code}
              href={localePath(l.code)}
              lang={l.code === "zh" ? "zh-Hans" : l.code}
              hrefLang={l.code === "zh" ? "zh-Hans" : l.code}
              aria-current={l.code === locale ? "page" : undefined}
              onClick={(e) => {
                if (
                  e.button === 0 &&
                  !e.metaKey &&
                  !e.ctrlKey &&
                  !e.shiftKey &&
                  !e.altKey
                ) {
                  e.preventDefault();
                  setLocale(l.code);
                }
              }}
            >
              {l.name}
            </a>
          ))}
        </nav>
        <a
          className="guide-source"
          href="https://github.com/jean-voila/lofeur"
          target="_blank"
          rel="noreferrer"
        >
          GitHub · lofeur
        </a>
      </article>
    </details>
  );
}
