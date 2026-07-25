"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:translate-y-px [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Solid gold — primary CTA.
        gold: "bg-gold text-white shadow-gold hover:brightness-[1.06] hover:-translate-y-0.5",
        // Gold hairline outline — secondary gold action.
        outline:
          "border border-gold/45 bg-transparent text-charcoal hover:bg-gold/8",
        // Dark charcoal — used on light sections for contrast.
        dark: "bg-charcoal-dark text-white hover:bg-charcoal-dark/90 hover:-translate-y-0.5",
        // On dark sections.
        onDark:
          "bg-white/10 text-white ring-1 ring-inset ring-white/25 hover:bg-white/16",
        ghost: "bg-transparent text-charcoal hover:bg-gold/8",
        link: "text-gold underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-5",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "gold",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
