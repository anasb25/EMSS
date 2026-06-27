export function formatEmssNumber(sequence: number, year: number): string {
  return `EMSS/${sequence}/${year}`;
}

export function getCurrentEmssYear(): number {
  return new Date().getFullYear();
}
