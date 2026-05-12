export interface RevenueReport {
  months: string[];
  series: RevenueSeries[];
  totalsByMethod: RevenueTotal[];
}

export interface RevenueSeries {
  name: string;
  data: number[];
}

export interface RevenueTotal {
  method: string;
  total: number;
}
