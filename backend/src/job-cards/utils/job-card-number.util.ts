const JOB_CARD_NUMBER_PATTERN = /^EMSS\/(\d+)\/(\d{4})$/;

export function formatJobCardNumber(sequence: number, year: number): string {
  return `EMSS/${sequence}/${year}`;
}

export function parseJobCardNumber(jobCardNumber: string): {
  sequence: number;
  year: number;
} | null {
  const match = JOB_CARD_NUMBER_PATTERN.exec(jobCardNumber);
  if (!match) return null;

  return {
    sequence: Number(match[1]),
    year: Number(match[2]),
  };
}

export function getCurrentJobCardYear(): number {
  return new Date().getFullYear();
}
