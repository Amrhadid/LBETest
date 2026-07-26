"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, Rocket, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { redeemAccessCode, startAttemptAction, type ActionState } from "@/app/start/actions";

const initial: ActionState = {};

function Pending({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="gold" size="lg" className="w-full" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

/**
 * Entitlement gate for the exam.
 * - `canStart`: the user has a redeemed code ready → show the Start button.
 * - Otherwise: show the access-code redemption form + purchase guidance.
 */
export function StartGate({ canStart }: { canStart: boolean }) {
  const [redeemState, redeemFormAction] = useActionState(redeemAccessCode, initial);
  const [startState, startFormAction] = useActionState(startAttemptAction, initial);

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      {canStart ? (
        <div className="rounded-2xl border border-gold/25 bg-card p-6 text-center shadow-card sm:p-8">
          <span className="inline-flex size-14 items-center justify-center rounded-2xl border border-gold/30 bg-gold/8 text-gold">
            <Rocket className="size-7" strokeWidth={1.5} />
          </span>
          <h2 className="font-serif-display mt-5 text-2xl text-charcoal">
            You&rsquo;re ready to begin
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The exam has 5 sections, each timed. Once you move on from a section
            you can&rsquo;t return to it, and all 5 must be completed. Find a quiet
            place before you start.
          </p>
          <form action={startFormAction} className="mt-6">
            <Pending label="Start the exam" pendingLabel="Starting…" />
          </form>
          {startState.error && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {startState.error}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-gold/25 bg-card p-6 shadow-card sm:p-8">
            <div className="mb-4 flex items-center gap-2 text-gold">
              <KeyRound className="size-5" />
              <h2 className="text-lg font-semibold text-charcoal">
                Enter your access code
              </h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Access to the LBET is unlocked with a code. Enter the code you were
              given to begin.
            </p>
            <form action={redeemFormAction} className="space-y-4">
              <Input
                name="code"
                aria-label="Access code"
                placeholder="Your access code"
                autoComplete="off"
                required
              />
              {redeemState.error && (
                <p role="alert" className="rounded-lg border border-red-300/60 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                  {redeemState.error}
                </p>
              )}
              <Pending label="Redeem code" pendingLabel="Checking…" />
            </form>
          </div>

          <div className="rounded-2xl border border-gold/20 bg-gold/5 p-5 text-center">
            <Mail className="mx-auto size-5 text-gold" />
            <p className="mt-2 text-sm text-charcoal">
              Don&rsquo;t have a code yet?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Access codes are purchased directly with our team — there&rsquo;s no
              online checkout. Contact us to buy a code, then return here to
              redeem it.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
