import * as React from "react";
import { cx } from "@/lib/cn";

type ButtonVariant = "default" | "primary" | "ghost" | "danger";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({
  variant = "default",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx(
        "btn",
        variant === "primary" && "btn-primary",
        variant === "ghost" && "btn-ghost",
        variant === "danger" && "btn-danger",
        className
      )}
      {...props}
    />
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return <input className={cx("input", className)} {...props} />;
}

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return <label className={cx("label", className)} {...props} />;
}

type BadgeProps = React.HTMLAttributes<HTMLSpanElement>;

export function Badge({ className, ...props }: BadgeProps) {
  return <span className={cx("badge", className)} {...props} />;
}

/** ✅ ДОБАВЛЕНО: Card / CardContent (чтобы импорт { Card } работал и next build не падал) */
type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return <div className={cx("card", className)} {...props} />;
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cx("card-content", className)} {...props} />;
}

