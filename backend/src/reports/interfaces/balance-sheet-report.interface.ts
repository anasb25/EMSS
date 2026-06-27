export interface BalanceSheetLine {
  key: string;
  label: string;
  amount: number;
  indent: number;
  isTotal?: boolean;
  isSection?: boolean;
}

export interface BalanceSheetColumn {
  title: string;
  lines: BalanceSheetLine[];
  total: number;
}

export interface BalanceSheetReport {
  asOfDate: string;
  assets: BalanceSheetColumn;
  liabilitiesAndEquity: BalanceSheetColumn;
  balanced: boolean;
}
