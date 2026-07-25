"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { routes } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Intent = "individual" | "team";

export function RegistrationCard() {
  const router = useRouter();
  const [intent, setIntent] = React.useState<Intent>("individual");
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const emailId = React.useId();
  const errorId = `${emailId}-error`;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    // Accessible client-side validation only. No email is sent anywhere here.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    // TODO(backend): the booking flow should capture this email securely.
    // For now we hand off to the correct existing route with the address as a
    // prefill hint — "Test my team" -> business flow, otherwise booking.
    const base = intent === "team" ? routes.businesses : routes.book;
    router.push(`${base}?email=${encodeURIComponent(value)}`);
  }

  const options: { id: Intent; label: string }[] = [
    { id: "individual", label: "Take the test" },
    { id: "team", label: "Test my team" },
  ];

  return (
    <div className="rounded-2xl border border-gold/25 bg-card p-6 shadow-lift sm:p-8">
      <p className="eyebrow">Start here</p>
      <h2 className="font-serif-display mt-2 text-2xl text-charcoal">
        What would you like to do?
      </h2>

      {/* Segmented control */}
      <div
        role="tablist"
        aria-label="What would you like to do?"
        className="mt-5 grid grid-cols-2 gap-1 rounded-xl border border-gold/25 bg-muted/60 p-1"
      >
        {options.map((opt) => {
          const active = intent === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setIntent(opt.id)}
              className={cn(
                "rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                active
                  ? "bg-card text-charcoal shadow-card"
                  : "text-muted-foreground hover:text-charcoal",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-5">
        <label
          htmlFor={emailId}
          className="mb-1.5 block text-sm font-medium text-charcoal"
        >
          Email address
        </label>
        <Input
          id={emailId}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        {error && (
          <p id={errorId} role="alert" className="mt-1.5 text-sm text-[rgb(181_60_45)]">
            {error}
          </p>
        )}

        <Button type="submit" variant="gold" className="mt-4 w-full">
          Continue
          <ArrowRight className="size-4" />
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-gold/20" />
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Already booked?
        </span>
        <span className="h-px flex-1 bg-gold/20" />
      </div>

      <Button asChild variant="outline" className="w-full">
        <a href={routes.goToMyTest}>Go to my test</a>
      </Button>

      <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
        <span>Takes less than a minute.</span>
        <span className="inline-flex items-center gap-1.5">
          <Lock className="size-3.5 text-gold" />
          Secure registration
        </span>
      </div>
    </div>
  );
}
