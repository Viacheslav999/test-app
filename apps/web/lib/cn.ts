export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// совместимость со старым импортом cx
export const cx = cn;
