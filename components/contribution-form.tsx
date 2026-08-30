"use client";

import { useState, type FormEvent } from "react";
import {
  contributionKinds,
  githubNewEntryUrls,
  githubPullRequestUrl,
  payloadFromForm,
  type ContributionKind,
} from "@/lib/contribute";
import { copy, type Locale } from "@/lib/i18n";

export function ContributionForm({ locale }: { locale: Locale }) {
  const [kind, setKind] = useState<ContributionKind>("brewery");
  const text = copy[locale].contribute;
  const type = text.types[kind];

  function submitPullRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.location.assign(githubPullRequestUrl(payloadFromForm(kind, new FormData(event.currentTarget))));
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
            onClick={() => setKind(value)}
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
            <input name="entity" required placeholder={text.placeholders.entity} />
          </label>
        </div>
      ) : null}

      <div className="form-grid form-grid-wide">
        <label>
          {text.fields.source}
          <input name="source" type="url" required placeholder={text.placeholders.source} />
        </label>
        <label>
          {text.fields.notes} {kind === "correction" ? null : <span>{text.optional}</span>}
          <textarea name="notes" rows={4} required={kind === "correction"} placeholder={text.placeholders.notes} />
        </label>
      </div>

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
      </div>
    </aside>
  );
}
