import Image from "next/image";

/** Official STIVA NIX18 diapositive mark (for dark backgrounds). */
export function Nix18Mark({ className }: { className?: string }) {
  return (
    <a
      className={className}
      href="https://nix18.nl"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="NIX18 - Niet roken, niet drinken onder de 18"
    >
      <Image
        src="/brand/nix18-diap.png"
        alt=""
        width={1660}
        height={449}
        className="footer-nix18-img"
        style={{ width: 52, height: "auto" }}
        priority={false}
      />
    </a>
  );
}
