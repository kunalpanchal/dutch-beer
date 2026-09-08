import type { Locale } from "@/lib/i18n";

const copy = {
  en: {
    title: "Subscribe to the newsletter",
    hint: "Notes on Dutch beer, via Substack.",
  },
  nl: {
    title: "Schrijf je in voor de nieuwsbrief",
    hint: "Notities over Nederlands bier, via Substack.",
  },
} as const;

export function SubstackSubscribe({ locale }: { locale: Locale }) {
  const text = copy[locale];
  return (
    <div
      className="footer-newsletter"
      style={{ flex: "1 1 18rem", minWidth: "min(100%, 280px)", display: "grid", gap: 8 }}
    >
      <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: "0.02em" }}>{text.title}</h2>
      <p style={{ margin: 0 }}>{text.hint}</p>
      <iframe
        src="https://dutchbeer.substack.com/embed"
        title={text.title}
        width={480}
        height={150}
        style={{
          display: "block",
          width: "100%",
          maxWidth: 480,
          height: 150,
          border: "1px solid rgba(251, 244, 228, 0.18)",
          borderRadius: 10,
          background: "transparent",
        }}
        frameBorder={0}
        scrolling="no"
        loading="lazy"
      />
    </div>
  );
}
