import Image from "next/image";
import Link from "next/link";
import { MapLink } from "@/components/map-link";
import type { Brewery, BreweryBranch, BreweryEvent, BreweryNewsUpdate, BreweryPhoto } from "@/lib/schema";
import { copy, mapLinkCopy, type Locale } from "@/lib/i18n";
import { placePath } from "@/lib/paths";
import { slugify } from "@/lib/catalog/normalize";

function mediaImage(
  src: string,
  className: string | undefined,
  size: { width: number; height: number },
  priority = false,
  alt = "",
) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size.width}
      height={size.height}
      className={className}
      priority={priority}
      unoptimized={!src.startsWith("/")}
    />
  );
}

export function BreweryMediaImage({
  src,
  className,
  size,
  priority = false,
  alt = "",
}: {
  src: string;
  className?: string;
  size: { width: number; height: number };
  priority?: boolean;
  alt?: string;
}) {
  return mediaImage(src, className, size, priority, alt);
}

function formatStreetLines(address: NonNullable<Brewery["address"]>): string[] {
  const lines: string[] = [];
  if (address.street) lines.push(address.street);
  const cityLine = [address.postalCode, address.locality].filter(Boolean).join(" ");
  if (cityLine) lines.push(cityLine);
  if (address.region) lines.push(address.region);
  return lines;
}

function formatEventWhen(event: BreweryEvent, locale: Locale): string {
  const start = new Date(event.startsAt);
  if (Number.isNaN(start.getTime())) return event.startsAt.slice(0, 10);
  const dateLocale = locale === "nl" ? "nl-NL" : "en-GB";
  const startLabel = start.toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" });
  if (!event.endsAt) return startLabel;
  const end = new Date(event.endsAt);
  if (Number.isNaN(end.getTime())) return startLabel;
  const endLabel = end.toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" });
  return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
}

function AddressBlock({
  address,
  locale,
}: {
  address: NonNullable<Brewery["address"]>;
  locale: Locale;
}) {
  const locality = address.locality?.trim();
  return (
    <address>
      {address.street ? (
        <>
          {address.street}
          <br />
        </>
      ) : null}
      {address.postalCode ? `${address.postalCode} ` : null}
      {locality ? <Link href={placePath(locale, slugify(locality))}>{locality}</Link> : null}
      {address.region ? (
        <>
          <br />
          {address.region}
        </>
      ) : null}
    </address>
  );
}

export function BreweryVisitPanel({ brewery, locale, place }: { brewery: Brewery; locale: Locale; place: string }) {
  const text = copy[locale].brewery;
  const locality = brewery.address?.locality?.trim();
  const streetLines = brewery.address ? formatStreetLines(brewery.address) : [];
  const hasMap = brewery.address?.latitude !== undefined && brewery.address.longitude !== undefined;

  return (
    <aside className="brewery-home-visit">
      <h2>{text.visit}</h2>
      <dl className="fact-list">
        {streetLines.length && brewery.address ? (
          <div>
            <dt>{text.address}</dt>
            <dd>
              <AddressBlock address={brewery.address} locale={locale} />
            </dd>
          </div>
        ) : place ? (
          <div>
            <dt>{text.location}</dt>
            <dd>{locality ? <Link href={placePath(locale, slugify(locality))}>{place}</Link> : place}</dd>
          </div>
        ) : null}
        {brewery.telephone ? (
          <div>
            <dt>{text.telephone}</dt>
            <dd>
              <a href={`tel:${brewery.telephone}`}>{brewery.telephone}</a>
            </dd>
          </div>
        ) : null}
        {brewery.openingHours ? (
          <div>
            <dt>{text.openingHours}</dt>
            <dd>{brewery.openingHours}</dd>
          </div>
        ) : null}
        {brewery.taproom ? (
          <div>
            <dt>{text.taproom}</dt>
            <dd>
              {brewery.taproom.name ? <strong>{brewery.taproom.name}</strong> : null}
              {brewery.taproom.description ? <p>{brewery.taproom.description}</p> : null}
              {brewery.taproom.website ? (
                <a href={brewery.taproom.website} rel="noreferrer">
                  {brewery.taproom.website}
                </a>
              ) : null}
            </dd>
          </div>
        ) : null}
      </dl>
      {hasMap && brewery.address?.latitude !== undefined && brewery.address.longitude !== undefined ? (
        <div className="brewery-map-wrap">
          <iframe
            title={copy[locale].directory.map}
            className="brewery-map"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={osmEmbed(brewery.address.latitude, brewery.address.longitude)}
          />
          <MapLink
            latitude={brewery.address.latitude}
            longitude={brewery.address.longitude}
            name={brewery.name}
            copy={mapLinkCopy(locale)}
          />
        </div>
      ) : null}
    </aside>
  );
}

function osmEmbed(latitude: number, longitude: number): string {
  const delta = 0.012;
  const bbox = `${longitude - delta},${latitude - delta},${longitude + delta},${latitude + delta}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}

export function BreweryAboutExtras({ brewery, locale }: { brewery: Brewery; locale: Locale }) {
  const text = copy[locale].brewery;
  if (!brewery.foundedYear && !brewery.founder && !brewery.tours) return null;

  return (
    <div className="brewery-about-extras">
      {brewery.foundedYear ? (
        <p className="brewery-founded">{text.foundedIn.replace("{year}", String(brewery.foundedYear))}</p>
      ) : null}
      {brewery.founder ? (
        <div className="brewery-founder">
          <h2>{text.founder}</h2>
          <div className="brewery-founder-body">
            {brewery.founder.image
              ? mediaImage(brewery.founder.image, "brewery-founder-image", { width: 96, height: 96 }, false, brewery.founder.name)
              : null}
            <div>
              <strong>{brewery.founder.name}</strong>
              {brewery.founder.role ? <p className="brewery-founder-role">{brewery.founder.role}</p> : null}
              {brewery.founder.bio ? <p>{brewery.founder.bio}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
      {brewery.tours && (brewery.tours.description || brewery.tours.schedule || brewery.tours.bookingUrl) ? (
        <div className="brewery-tours">
          <h2>{text.tours}</h2>
          {brewery.tours.description ? <p>{brewery.tours.description}</p> : null}
          {brewery.tours.schedule ? <p className="brewery-tour-schedule">{brewery.tours.schedule}</p> : null}
          {brewery.tours.bookingUrl ? (
            <a className="button button-quiet" href={brewery.tours.bookingUrl} rel="noreferrer">
              {text.bookTour}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function BranchCard({ branch, locale }: { branch: BreweryBranch; locale: Locale }) {
  const text = copy[locale].brewery;
  const kindLabel = branch.kind ? text.branchKinds[branch.kind] : null;
  return (
    <li className="brewery-branch">
      <div className="brewery-branch-head">
        <strong>{branch.name}</strong>
        {kindLabel ? <span>{kindLabel}</span> : null}
      </div>
      {branch.address ? <AddressBlock address={branch.address} locale={locale} /> : null}
      {branch.openingHours ? <p>{branch.openingHours}</p> : null}
      {branch.telephone ? (
        <p>
          <a href={`tel:${branch.telephone}`}>{branch.telephone}</a>
        </p>
      ) : null}
      {branch.website ? (
        <p>
          <a href={branch.website} rel="noreferrer">
            {branch.website}
          </a>
        </p>
      ) : null}
    </li>
  );
}

export function BreweryBranches({ branches, locale }: { branches: BreweryBranch[]; locale: Locale }) {
  const text = copy[locale].brewery;
  return (
    <section className="brewery-section">
      <h2>{text.branches}</h2>
      <ul className="brewery-branch-list">
        {branches.map((branch) => (
          <BranchCard key={`${branch.name}-${branch.address?.street ?? branch.website ?? ""}`} branch={branch} locale={locale} />
        ))}
      </ul>
    </section>
  );
}

export function BreweryEvents({ events, locale }: { events: BreweryEvent[]; locale: Locale }) {
  const text = copy[locale].brewery;
  return (
    <section className="brewery-section">
      <h2>{text.events}</h2>
      <ul className="brewery-event-list">
        {events.map((event) => (
          <li key={`${event.title}-${event.startsAt}`}>
            <time dateTime={event.startsAt}>{formatEventWhen(event, locale)}</time>
            <div>
              {event.url ? (
                <a href={event.url} rel="noreferrer">
                  <strong>{event.title}</strong>
                </a>
              ) : (
                <strong>{event.title}</strong>
              )}
              {event.location ? <span className="brewery-event-place">{event.location}</span> : null}
              {event.description ? <p>{event.description}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function BreweryNews({ news, locale }: { news: BreweryNewsUpdate[]; locale: Locale }) {
  const text = copy[locale].brewery;
  const dateLocale = locale === "nl" ? "nl-NL" : "en-GB";
  return (
    <section className="brewery-section">
      <h2>{text.news}</h2>
      <ul className="brewery-news-list">
        {news.map((item) => {
          const when = new Date(item.publishedAt);
          const label = Number.isNaN(when.getTime())
            ? item.publishedAt.slice(0, 10)
            : when.toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" });
          return (
            <li key={`${item.title}-${item.publishedAt}`}>
              <time dateTime={item.publishedAt}>{label}</time>
              <div>
                {item.url ? (
                  <a href={item.url} rel="noreferrer">
                    <strong>{item.title}</strong>
                  </a>
                ) : (
                  <strong>{item.title}</strong>
                )}
                {item.body ? <p>{item.body}</p> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function BreweryPhotos({ photos, locale }: { photos: BreweryPhoto[]; locale: Locale }) {
  const text = copy[locale].brewery;
  return (
    <section className="brewery-section">
      <h2>{text.photos}</h2>
      <ul className="brewery-photo-grid">
        {photos.map((photo) => (
          <li key={photo.src}>
            <figure>
              {mediaImage(photo.src, undefined, { width: 640, height: 480 }, false, photo.alt ?? "")}
              {photo.caption ? <figcaption>{photo.caption}</figcaption> : null}
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
