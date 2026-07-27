"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { KeyRound, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { redeemAccessCode, type ActionState } from "@/app/start/actions";

const initial: ActionState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="gold" size="md" disabled={pending}>
      {pending ? "Checking…" : "Redeem code"}
    </Button>
  );
}

/** Redeem an access code from the dashboard, reusing the existing flow. */
export function RedeemCard() {
  const [state, action] = useActionState(redeemAccessCode, initial);
  const redeemed = !!state.message;

  return (
    <div className="rounded-2xl border border-gold/25 bg-card p-6 shadow-card">
      <div className="mb-3 flex items-center gap-2 text-gold">
        <KeyRound className="size-5" />
        <h3 className="text-lg font-semibold text-charcoal">Start a new test</h3>
      </div>

      {redeemed ? (
        <div>
          <p className="text-sm text-charcoal">
            Code accepted. You&rsquo;re ready to begin.
          </p>
          <Link href="/start" className="mt-4 inline-block">
            <Button variant="gold" size="md">
              Go to your exam <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            Enter the access code you were given to unlock a new attempt.
          </p>
          <form action={action} className="flex flex-col gap-3 sm:flex-row">
            <Input name="code" aria-label="Access code" placeholder="Your access code" autoComplete="off" required className="flex-1" />
            <Submit />
          </form>
          {state.error && (
            <p role="alert" className="mt-3 text-sm text-red-700">{state.error}</p>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Don&rsquo;t have a code? Access codes are purchased directly with our
            team — contact us, then redeem here.
          </p>
        </>
      )}
    </div>
  );
}
