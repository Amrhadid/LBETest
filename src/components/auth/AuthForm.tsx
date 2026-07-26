"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Mail, KeyRound, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleButton } from "@/components/auth/GoogleButton";
import {
  signInWithPassword,
  signUpWithPassword,
  signInWithMagicLink,
  type AuthState,
} from "@/app/login/actions";

type Mode = "signin" | "signup" | "magic";

const TABS: { id: Mode; label: string }[] = [
  { id: "signin", label: "Sign in" },
  { id: "signup", label: "Create account" },
  { id: "magic", label: "Magic link" },
];

const initialState: AuthState = {};

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="gold" size="lg" className="w-full" disabled={pending}>
      {pending ? "Please wait…" : children}
    </Button>
  );
}

/** Feedback + honeypot-free auth form shared across the three modes. */
function FormShell({
  action,
  submitLabel,
  children,
}: {
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  submitLabel: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, initialState);
  return (
    <form action={formAction} className="space-y-4">
      {children}
      {state.error && (
        <p role="alert" className="rounded-lg border border-red-300/60 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="rounded-lg border border-gold/40 bg-gold/8 px-4 py-2.5 text-sm text-charcoal">
          {state.message}
        </p>
      )}
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}

export function AuthForm() {
  const [mode, setMode] = React.useState<Mode>("signin");

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-gold/25 bg-card p-6 shadow-card sm:p-8">
        {/* Mode tabs */}
        <div
          role="tablist"
          aria-label="Authentication method"
          className="mb-6 grid grid-cols-3 gap-1 rounded-xl border border-gold/20 bg-gold/5 p-1"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={mode === tab.id}
              onClick={() => setMode(tab.id)}
              className={cn(
                "rounded-lg px-2 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:text-sm",
                mode === tab.id
                  ? "gold-foil text-white shadow-gold"
                  : "text-charcoal/70 hover:text-gold",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {mode === "signin" && (
          <FormShell action={signInWithPassword} submitLabel="Sign in">
            <Field id="email" label="Email" type="email" icon={Mail} autoComplete="email" required />
            <Field
              id="password"
              label="Password"
              type="password"
              icon={KeyRound}
              autoComplete="current-password"
              required
            />
          </FormShell>
        )}

        {mode === "signup" && (
          <FormShell action={signUpWithPassword} submitLabel="Create account">
            <Field id="full_name" name="full_name" label="Full name" type="text" autoComplete="name" />
            <Field id="email" label="Email" type="email" icon={Mail} autoComplete="email" required />
            <Field
              id="password"
              label="Password"
              type="password"
              icon={KeyRound}
              autoComplete="new-password"
              required
              hint="At least 8 characters."
            />
          </FormShell>
        )}

        {mode === "magic" && (
          <FormShell action={signInWithMagicLink} submitLabel="Send magic link">
            <Field id="email" label="Email" type="email" icon={Sparkles} autoComplete="email" required />
            <p className="text-sm text-muted-foreground">
              We&rsquo;ll email you a secure link — no password needed.
            </p>
          </FormShell>
        )}

        {/* Google OAuth — available on the sign-in and sign-up tabs. Reuses the
            /auth/callback route (same PKCE exchange as magic-link). */}
        {mode !== "magic" && (
          <div className="mt-6">
            <div className="relative my-5" role="separator" aria-label="or">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gold/15" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-3 text-xs uppercase tracking-wide text-muted-foreground">
                  or
                </span>
              </div>
            </div>
            <GoogleButton
              label={
                mode === "signup"
                  ? "Sign up with Google"
                  : "Continue with Google"
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  id,
  name,
  label,
  type,
  icon: Icon,
  autoComplete,
  required,
  hint,
}: {
  id: string;
  name?: string;
  label: string;
  type: string;
  icon?: React.ComponentType<{ className?: string }>;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-charcoal">
        {label}
        {!required && <span className="ml-1 text-muted-foreground">(optional)</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gold" />
        )}
        <Input
          id={id}
          name={name ?? id}
          type={type}
          autoComplete={autoComplete}
          required={required}
          className={cn(Icon && "pl-10")}
        />
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
