export function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function currentMonthKey() {
  return todayISO().slice(0, 7);
}

export function monthOf(dateString: string) {
  return dateString.slice(0, 7);
}

export function monthStart(month: string) {
  return `${month}-01`;
}

export function addMonths(month: string, delta: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + delta, 1);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

export function formatMonth(month: string, style: "long" | "short" = "long") {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-AE", {
    month: style,
    year: "numeric",
  }).format(new Date(year, monthNumber - 1, 1));
}

export function formatMonthYear(month: string) {
  return formatMonth(month, "long");
}

export function formatDate(dateString: string, style: "short" | "long" = "short") {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("en-AE", {
    day: "numeric",
    month: style === "long" ? "long" : "short",
    year: style === "long" ? "numeric" : undefined,
  }).format(date);
}

export function formatWeekday(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Intl.DateTimeFormat("en-AE", { weekday: "short" }).format(
    new Date(year, month - 1, day),
  );
}

export function daysInMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber, 0).getDate();
}

export function dayOfMonth(dateString = todayISO()) {
  return Number(dateString.slice(8, 10));
}

export function monthRange(count: number, endMonth = currentMonthKey()) {
  return Array.from({ length: count }, (_, index) =>
    addMonths(endMonth, index - (count - 1)),
  );
}

export function isToday(dateString: string) {
  return dateString === todayISO();
}

export function relativeDayLabel(dateString: string) {
  const today = todayISO();
  if (dateString === today) return "Today";
  const yesterday = toISODate(new Date(Date.now() - 86_400_000));
  if (dateString === yesterday) return "Yesterday";
  return formatDate(dateString);
}
