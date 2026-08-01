"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COUNTRIES } from "@/lib/countries";
import { VISIT_PURPOSES } from "@/lib/auth/onboarding";
import { submitOnboarding, type OnboardingState } from "@/app/onboarding/actions";

const initial: OnboardingState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="gold" size="lg" className="w-full" disabled={pending}>
      {pending ? "Saving…" : "Continue"}
      {!pending && <ArrowRight className="size-4" />}
    </Button>
  );
}

export function OnboardingForm({
  defaultName,
  next,
}: {
  defaultName: string;
  next: string;
}) {
  const [state, formAction] = useActionState(submitOnboarding, initial);
  const [hasJob, setHasJob] = React.useState(true);

  const labelCls = "mb-1.5 block text-sm font-medium text-charcoal";

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={next} />

      {/* Name */}
      <div>
        <label htmlFor="full_name" className={labelCls}>
          Full legal name
        </label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={defaultName}
          placeholder="Your name as on your ID"
          autoComplete="name"
          required
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Enter your full name exactly as it appears on your national ID or
          passport. This is the name printed on your certificate.
        </p>
        <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-lg border border-gold/20 px-3 py-2.5 text-sm text-charcoal hover:bg-gold/5 has-[:checked]:border-gold has-[:checked]:bg-gold/10">
          <input
            type="checkbox"
            name="name_confirmed"
            value="yes"
            className="mt-0.5 size-4 accent-gold"
            required
          />
          <span>
            I confirm this is my real full name, identical to my national ID or
            passport.
          </span>
        </label>
      </div>

      {/* Date of birth */}
      <div>
        <label htmlFor="date_of_birth" className={labelCls}>
          Date of birth
        </label>
        <Input id="date_of_birth" name="date_of_birth" type="date" required />
      </div>

      {/* Current job / target job */}
      <div>
        <span className={labelCls}>Do you currently have a job?</span>
        <input type="hidden" name="has_job" value={hasJob ? "yes" : "no"} />
        <div className="mb-3 flex overflow-hidden rounded-lg border border-gold/25">
          <button
            type="button"
            onClick={() => setHasJob(true)}
            aria-pressed={hasJob}
            className={
              "flex-1 px-3 py-2 text-sm font-medium transition-colors " +
              (hasJob ? "bg-gold/15 text-charcoal" : "text-muted-foreground hover:bg-gold/8")
            }
          >
            Yes, I have a job
          </button>
          <button
            type="button"
            onClick={() => setHasJob(false)}
            aria-pressed={!hasJob}
            className={
              "flex-1 border-l border-gold/25 px-3 py-2 text-sm font-medium transition-colors " +
              (!hasJob ? "bg-gold/15 text-charcoal" : "text-muted-foreground hover:bg-gold/8")
            }
          >
            No, not yet
          </button>
        </div>
        {hasJob ? (
          <Input
            key="current_job"
            name="current_job"
            aria-label="Current job"
            placeholder="Your current job title"
            required
          />
        ) : (
          <Input
            key="target_job"
            name="target_job"
            aria-label="Target job"
            placeholder="The job you're aiming for"
            required
          />
        )}
      </div>

      {/* Purpose of visiting */}
      <fieldset>
        <legend className={labelCls}>Why are you here?</legend>
        <div className="space-y-2">
          {VISIT_PURPOSES.map((p, i) => (
            <label
              key={p.value}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-gold/20 px-3 py-2.5 text-sm text-charcoal hover:bg-gold/5 has-[:checked]:border-gold has-[:checked]:bg-gold/10"
            >
              <input
                type="radio"
                name="visit_purpose"
                value={p.value}
                defaultChecked={i === 0}
                className="size-4 accent-gold"
                required
              />
              {p.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Country of origin — searchable dropdown */}
      <div>
        <label htmlFor="country_of_origin" className={labelCls}>
          Country of origin
        </label>
        <Input
          id="country_of_origin"
          name="country_of_origin"
          list="countries"
          placeholder="Start typing your country…"
          autoComplete="off"
          required
        />
        <datalist id="countries">
          {COUNTRIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg border border-red-300/60 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <Submit />
    </form>
  );
}
