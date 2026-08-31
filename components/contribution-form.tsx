"use client";

import { useState, type FormEvent } from "react";
import {
  claimDomainError,
  contributionKinds,
  githubNewEntryUrls,
  githubPullRequestUrl,
  payloadFromForm,
  type ContributionKind,
} from "@/lib/contribute";
import { copy, type Locale } from "@/lib/i18n";

export function ContributionForm({
  locale,
  initialKind = "brewery",
  claimPrefill,
  initialEntity,
}: {
  locale: Locale;
  initialKind?: ContributionKind;
  claimPrefill?: { slug: string; name: string; website?: string };
  initialEntity?: string;
}) {
  const [kind, setKind] = useState<ContributionKind>(initialKind);
  const [error, setError] = useState<string>();
  const text = copy[locale].contribute;
  const type = text.types[kind];

  function submitPullRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = payloadFromForm(kind, new FormData(event.currentTarget));
    if (kind === "claim") {
      const mismatch = claimDomainError(payload);
      if (mismatch === "email") {
        setError(text.domainEmail);
        return;
      }
      if (mismatch === "evidence") {
        setError(text.domainEvidence);
        return;
      }
    }
    window.location.assign(githubPullRequestUrl(payload));
  }

  return (
    <form className="contribute-form" onSubmit={submitPullRequest}>
      <div className="kind-switch" role="group" aria-label={text.eyebrow}>
        {contributionKinds.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={kind === value}
            className={kind === value ? "is-active" : undefined}
            onClick={() => {
              setKind(value);
              setError(undefined);
            }}
          >
            {text.types[value].label}
          </button>
        ))}
      </div>

      <div className="form-intro">
        <h2>{type.title}</h2>
        <p>{type.description}</p>
      </div>

      {kind === "brewery" ? (
        <div className="form-grid">
          <label>
            {text.fields.breweryName}
            <input name="breweryName" required autoComplete="organization" placeholder={text.placeholders.breweryName} />
          </label>
          <label>
            {text.fields.website}
            <input name="website" type="url" required placeholder={text.placeholders.website} />
          </label>
          <label>
            {text.fields.locality}
            <input name="locality" required placeholder={text.placeholders.locality} />
          </label>
          <label>
            {text.fields.region} <span>{text.optional}</span>
            <input name="region" placeholder={text.placeholders.region} />
          </label>
        </div>
      ) : null}

      {kind === "beer" ? (
        <div className="form-grid">
          <label>
            {text.fields.beerName}
            <input name="beerName" required placeholder={text.placeholders.beerName} />
          </label>
          <label>
            {text.fields.breweryName}
            <input name="breweryName" required placeholder={text.placeholders.breweryName} />
          </label>
          <label>
            {text.fields.style} <span>{text.optional}</span>
            <input name="style" placeholder={text.placeholders.style} />
          </label>
          <label>
            {text.fields.abv} <span>{text.optional}</span>
            <input name="abv" inputMode="decimal" placeholder={text.placeholders.abv} />
          </label>
          <label>
            {text.fields.availability} <span>{text.optional}</span>
            <select name="availability" defaultValue="unknown">
              <option value="year_round">{text.availability.year_round}</option>
              <option value="seasonal">{text.availability.seasonal}</option>
              <option value="one_off">{text.availability.one_off}</option>
              <option value="unknown">{text.availability.unknown}</option>
            </select>
          </label>
        </div>
      ) : null}

      {kind === "correction" ? (
        <div className="form-grid">
          <label>
            {text.fields.entity}
            <input
              name="entity"
              required
              defaultValue={initialEntity || claimPrefill?.name}
              placeholder={text.placeholders.entity}
            />
          </label>
        </div>
      ) : null}

      {kind === "claim" ? (
        <div className="form-grid">
          {claimPrefill ? <input type="hidden" name="brewerySlug" value={claimPrefill.slug} /> : null}
          <label>
            {text.fields.breweryName}
            <input
              name="breweryName"
              required
              autoComplete="organization"
              defaultValue={claimPrefill?.name}
              readOnly={Boolean(claimPrefill)}
              placeholder={text.placeholders.breweryName}
            />
          </label>
          <label>
            {text.fields.website}
            <input
              name="website"
              type="url"
              required
              defaultValue={claimPrefill?.website}
              placeholder={text.placeholders.website}
            />
          </label>
          <label>
            {text.fields.contact}
            <input name="contact" required autoComplete="name" placeholder={text.placeholders.contact} />
          </label>
          <label>
            {text.fields.email}
            <input name="email" type="email" required autoComplete="email" placeholder={text.placeholders.email} />
          </label>
        </div>
      ) : null}

      {kind === "claim" ? (
        <div className="form-grid">
          <label>
            {text.fields.description} <span>{text.optional}</span>
            <textarea name="description" rows={3} placeholder={text.placeholders.description} />
          </label>
          <label>
            {text.fields.coverImage} <span>{text.optional}</span>
            <input name="coverImage" type="url" placeholder={text.placeholders.coverImage} />
          </label>
          <label>
            {text.fields.logo} <span>{text.optional}</span>
            <input name="logo" type="url" placeholder={text.placeholders.logo} />
          </label>
          <label>
            {text.fields.instagram} <span>{text.optional}</span>
            <input name="instagram" type="url" placeholder={text.placeholders.instagram} />
          </label>
          <label>
            {text.fields.facebook} <span>{text.optional}</span>
            <input name="facebook" type="url" placeholder={text.placeholders.facebook} />
          </label>
        </div>
      ) : null}

      <div className="form-grid form-grid-wide">
        <label>
          {text.fields[kind === "claim" ? "evidence" : "source"]}
          <input
            name="source"
            type="url"
            required
            placeholder={kind === "claim" ? text.placeholders.claimSource : text.placeholders.source}
          />
        </label>
        <label>
          {text.fields.notes} {kind === "correction" ? null : <span>{text.optional}</span>}
          <textarea
            name="notes"
            rows={4}
            required={kind === "correction"}
            placeholder={kind === "claim" ? text.placeholders.claimNotes : text.placeholders.notes}
          />
        </label>
      </div>

      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <div className="form-actions">
        <button className="button button-ale" type="submit">
          {text.submit}
        </button>
        <p>{text.submitHint}</p>
      </div>
    </form>
  );
}

export function GithubTemplateLinks({ locale }: { locale: Locale }) {
  const text = copy[locale].contribute;
  return (
    <aside className="github-templates">
      <strong>{text.githubTemplatesTitle}</strong>
      <p>{text.githubTemplatesCopy}</p>
      <div>
        <a href={githubNewEntryUrls.brewery}>{text.githubBrewery}</a>
        <a href={githubNewEntryUrls.beer}>{text.githubBeer}</a>
        <a href={githubNewEntryUrls.correction}>{text.githubCorrection}</a>
        <a href={githubNewEntryUrls.claim}>{text.githubClaim}</a>
      </div>
    </aside>
  );
}
