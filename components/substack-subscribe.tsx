export function SubstackSubscribe({ title }: { title: string }) {
  return (
    <iframe
      src="https://dutchbeer.substack.com/embed"
      title={title}
      width={480}
      height={150}
      style={{ border: "1px solid rgba(251, 244, 228, 0.18)", background: "transparent" }}
      frameBorder={0}
      scrolling="no"
      loading="lazy"
    />
  );
}
