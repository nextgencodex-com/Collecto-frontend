export type Freq = "weekly" | "monthly";
export type Status = "PAID" | "DUE" | "OVERDUE" | "UPCOMING" | "DONE";
export type Role = "owner" | "rider";

export interface Shop {
  name: string;
  phone: string;
  address: string;
}

export interface Owner {
  name: string;
  email: string;
  username: string;
  photo: string;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  area: string;
  username: string;
  active: boolean;
  photo?: string;
}

export interface Product {
  code: string;
  name: string;
  purchase: number;
  cash: number;
  price: number;
  freq: Freq;
  amount: number;
  period: number;
  stock: number;
  sold: number;
}

export interface Customer {
  id: string;
  name: string;
  nic: string;
  phone: string;
  address: string;
  city: string;
  riderId: string;
  lat: number;
  lng: number;
  notes: string;
  photo: string;
  since: string;
}

export interface Item {
  id: string;
  customerId: string;
  riderId: string;
  code: string;
  name: string;
  price: number;
  freq: Freq;
  amount: number;
  period: number;
  start: string;
  /**
   * Total of this item's payments dated before `AppData.paymentsFrom` (those payments are not sent
   * individually). 0 when the server sends the whole history.
   */
  priorPaid?: number;
}

export interface Payment {
  id: string;
  txn: string;
  itemId: string;
  customerId: string;
  riderId: string;
  amount: number;
  date: string;
  time: string;
  status: "completed" | "corrected";
}

export interface AuditEntry {
  id: string;
  date: string;
  time: string;
  user: string;
  action: string;
  txn: string;
  ref: string;
  old: string;
  nw: string;
  reason: string;
}

export interface Notification {
  id: string;
  type: "payment" | "overdue" | "closing" | "system";
  title: string;
  text: string;
  date: string;
  time: string;
  read: boolean;
}

export interface Closing {
  id: string;
  riderId: string;
  date: string;
  time: string;
  expected: number;
  collected: number;
  pending: number;
  cash: number;
  count: number;
  note: string;
}

/** A rider-granted payment extension (customer promised to pay on `until`). */
export interface Extension {
  id: string;
  customerId: string;
  riderId: string;
  date: string;
  time: string;
  until: string;
  reason: string;
}

/** The GET /bootstrap payload (role-scoped by the server). */
export interface AppData {
  /** The server's date (shop time zone), YYYY-MM-DD. All due-date maths is relative to it. */
  today: string;
  /** Individual payments are only included from this date on (earlier ones are summed in `Item.priorPaid`). */
  paymentsFrom: string | null;
  shop: Shop;
  owner: Owner;
  riders: Rider[];
  products: Product[];
  customers: Customer[];
  items: Item[];
  payments: Payment[];
  audit: AuditEntry[];
  notifs: Notification[];
  closings: Closing[];
  extensions: Extension[];
}

export interface Session {
  role: Role;
  riderId?: string | null;
}

/** Item enriched with schedule / balance calculations. */
export interface CalcItem extends Item {
  dates: string[];
  paid: number;
  balance: number;
  overdue: number;
  dueNow: number;
  dueToday: number;
  expectedToday: number;
  next: string | null;
  status: Status;
  missed: number;
  oldest: string | null;
  n: number;
  last: string;
}

/** Customer enriched with aggregate figures. */
export interface CalcCustomer extends Customer {
  its: CalcItem[];
  act: CalcItem[];
  status: Status;
  dueNow: number;
  overdue: number;
  expectedToday: number;
  balance: number;
  paid: number;
  total: number;
  missed: number;
  paidToday: number;
  riderName: string;
}

/** A receipt for the last payment(s) a rider recorded. */
export interface LastTx {
  cust: string;
  custId: string;
  phone: string;
  total: number;
  time: string;
  date: string;
  rider: string;
  lines: { txn: string; item: string; amount: number }[];
}
