/** Convert shop-local wall time to UTC; reject invalid or ambiguous DST inputs. */
export function shopTimeToIso(value: string, timezone: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
    throw new Error("Data inválida");
  const desired = Date.parse(`${value}:00Z`);
  if (
    !Number.isFinite(desired) ||
    new Date(desired).toISOString().slice(0, 16) !== value
  )
    throw new Error("Data inválida");
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  function wall(timestamp: number) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(timestamp))
        .map((p) => [p.type, p.value]),
    );
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  }
  // The offsets surrounding the requested date cover both sides of a DST change.
  const offsets = new Set<number>();
  for (const hours of [-36, 0, 36]) {
    const timestamp = desired + hours * 3600000;
    offsets.add(Date.parse(`${wall(timestamp)}:00Z`) - timestamp);
  }
  const candidates = [...offsets]
    .map((offset) => desired - offset)
    .filter((t) => wall(t) === value);
  if (candidates.length !== 1)
    throw new Error("Horário inexistente ou ambíguo no fuso da barbearia");
  return new Date(candidates[0]).toISOString();
}
