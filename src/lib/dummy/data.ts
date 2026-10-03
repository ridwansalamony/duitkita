export type TxType = "income" | "expense" | "transfer";
export type User = {
  id: string;
  familyId: string | null;
  name: string;
  email: string;
  role: "owner" | "member";
  avatarUrl?: string;
};
export type Wallet = {
  id: string;
  familyId: string;
  name: string;
  type: "shared";
  isPrimary?: boolean;
  ownerUserId: string | null;
  color: string;
};
export type Category = {
  monthlyBudget?: number;
  id: string;
  familyId: string;
  name: string;
  type: TxType;
  icon: string;
  color: string;
};
export type Transaction = {
  createdAt?: string;
  id: string;
  familyId: string;
  userId: string;
  walletId: string;
  toWalletId?: string;
  categoryId: string;
  type: TxType;
  amount: number;
  description: string;
  date: string;
  receipt?: string;
  receiptPath?: string;
  receiptOcrData?: {
    merchant: string | null;
    total: number | null;
    date: string | null;
  };
};
export type Goal = {
  walletId: string;
  id: string;
  familyId: string;
  name: string;
  target: number;
  deadline: string;
  icon: string;
  status: "active" | "achieved" | "archived";
};
export type Contribution = {
  id: string;
  goalId: string;
  userId: string;
  walletId: string;
  amount: number;
  date: string;
  note: string;
};
export type Audit = {
  id: string;
  familyId: string;
  userId: string;
  action: "create" | "update" | "delete";
  entity: string;
  entityId: string;
  detail: string;
  date: string;
  privateOwnerId?: string;
};
export const FAMILY_ID = "family-budi-sari";
export const DEMO_TODAY = "2026-09-30";
export const users: User[] = [
  {
    id: "budi",
    familyId: FAMILY_ID,
    name: "Budi Santoso",
    email: "budi@example.com",
    role: "owner",
  },
  {
    id: "sari",
    familyId: FAMILY_ID,
    name: "Sari Wulandari",
    email: "sari@example.com",
    role: "member",
  },
];
export const wallets: Wallet[] = [
  {
    id: "rumah",
    familyId: FAMILY_ID,
    name: "Dompet Keluarga",
    isPrimary: true,
    type: "shared",
    ownerUserId: null,
    color: "#7c3aed",
  },
  {
    id: "budi-wallet",
    familyId: FAMILY_ID,
    name: "Dompet Kendaraan",
    type: "shared",
    ownerUserId: null,
    color: "#2563eb",
  },
  {
    id: "darurat",
    familyId: FAMILY_ID,
    name: "Dana Darurat",
    type: "shared",
    ownerUserId: null,
    color: "#0d9488",
  },
  {
    id: "sari-wallet",
    familyId: FAMILY_ID,
    name: "Dompet Liburan",
    type: "shared",
    ownerUserId: null,
    color: "#db2777",
  },
];
export const categories: Category[] = [
  ["makan", "Makan & Minum", "expense", "utensils", "#f59e0b"],
  ["transport", "Transportasi", "expense", "car", "#3b82f6"],
  ["belanja", "Belanja Bulanan", "expense", "shopping-bag", "#8b5cf6"],
  ["tagihan", "Tagihan & Utilitas", "expense", "zap", "#f43f5e"],
  ["kesehatan", "Kesehatan", "expense", "heart", "#14b8a6"],
  ["hiburan", "Hiburan", "expense", "coffee", "#ec4899"],
  ["gaji", "Gaji", "income", "briefcase", "#10b981"],
  ["bonus", "Bonus", "income", "gift", "#06b6d4"],
  ["freelance", "Freelance", "income", "briefcase", "#6366f1"],
  ["pendidikan", "Pendidikan Anak", "expense", "graduation-cap", "#2563eb"],
  ["donasi", "Zakat & Donasi", "expense", "heart", "#0d9488"],
  ["lainnya", "Lainnya", "expense", "tag", "#64748b"],
].map(([id, name, type, icon, color]) => ({
  id,
  familyId: FAMILY_ID,
  name,
  type: type as TxType,
  monthlyBudget: (
    {
      makan: 2000000,
      transport: 1000000,
      belanja: 2500000,
      tagihan: 1500000,
      hiburan: 750000,
    } as Record<string, number>
  )[id],
  icon,
  color,
}));
const tx = (
  id: string,
  date: string,
  type: TxType,
  amount: number,
  description: string,
  categoryId: string,
  userId = "budi",
  walletId = "rumah",
  toWalletId?: string,
): Transaction => ({
  id,
  familyId: FAMILY_ID,
  date,
  type,
  amount,
  description,
  categoryId,
  userId,
  walletId,
  toWalletId,
});
export const transactions: Transaction[] = [
  tx(
    "trx-awal-rumah",
    "2026-08-01",
    "income",
    55000000,
    "Tabungan bersama sejak awal tahun",
    "gaji",
  ),
  tx(
    "trx-awal-darurat",
    "2026-08-01",
    "income",
    15000000,
    "Tabungan dana darurat",
    "gaji",
    "sari",
    "darurat",
  ),
  tx(
    "trx-gaji-budi",
    "2026-09-01",
    "income",
    8500000,
    "Gaji Budi bulan September",
    "gaji",
    "budi",
    "budi-wallet",
  ),
  tx(
    "trx-gaji-sari",
    "2026-09-01",
    "income",
    7000000,
    "Gaji Sari bulan September",
    "gaji",
    "sari",
    "sari-wallet",
  ),
  tx(
    "trx-setor-budi",
    "2026-09-02",
    "transfer",
    5000000,
    "Untuk kebutuhan rumah bulan ini",
    "",
    "budi",
    "budi-wallet",
    "rumah",
  ),
  tx(
    "trx-setor-sari",
    "2026-09-02",
    "transfer",
    4000000,
    "Patungan kebutuhan rumah",
    "",
    "sari",
    "sari-wallet",
    "rumah",
  ),
  tx(
    "trx-001",
    "2026-09-05",
    "expense",
    450000,
    "Listrik & air September",
    "tagihan",
    "sari",
  ),
  tx(
    "trx-002",
    "2026-09-10",
    "expense",
    1200000,
    "SPP dan buku sekolah Adi",
    "pendidikan",
  ),
  tx(
    "trx-003",
    "2026-09-15",
    "income",
    2500000,
    "Proyek desain katalog UMKM",
    "freelance",
    "sari",
  ),
  tx(
    "trx-004",
    "2026-09-24",
    "expense",
    245000,
    "Belanja sayur dan kebutuhan dapur",
    "belanja",
    "sari",
  ),
  tx(
    "trx-005",
    "2026-09-25",
    "expense",
    150000,
    "Isi bensin untuk akhir pekan",
    "transport",
  ),
  tx(
    "trx-006",
    "2026-09-26",
    "expense",
    120000,
    "Vitamin dan obat keluarga",
    "kesehatan",
    "sari",
  ),
  tx(
    "trx-007",
    "2026-09-27",
    "expense",
    175000,
    "Nonton berdua di akhir pekan",
    "hiburan",
  ),
  tx(
    "trx-008",
    "2026-09-28",
    "expense",
    320000,
    "Belanja mingguan di Superindo",
    "belanja",
    "sari",
  ),
  tx(
    "trx-009",
    "2026-09-29",
    "expense",
    50000,
    "KRL dan ojek ke kantor",
    "transport",
  ),
  {
    ...tx(
      "trx-010",
      "2026-09-30",
      "expense",
      87500,
      "Makan malam di Sate Padang Ajo",
      "makan",
    ),
    receipt: "/receipts/sate-padang.svg",
  },
  tx(
    "trx-011",
    "2026-09-30",
    "expense",
    100000,
    "Sedekah Jumat keluarga",
    "donasi",
    "sari",
  ),
];
export const goals: Goal[] = [
  {
    walletId: "target-rumah",
    id: "rumah-impian",
    familyId: FAMILY_ID,
    name: "DP Rumah Impian",
    target: 150000000,
    deadline: "2027-12-31",
    icon: "home",
    status: "active",
  },
  {
    walletId: "sari-wallet",
    id: "liburan-bali",
    familyId: FAMILY_ID,
    name: "Liburan ke Bali",
    target: 15000000,
    deadline: "2027-06-01",
    icon: "plane",
    status: "active",
  },
  {
    walletId: "target-pendidikan",
    id: "pendidikan-anak",
    familyId: FAMILY_ID,
    name: "Dana Pendidikan Anak",
    target: 50000000,
    deadline: "2028-07-01",
    icon: "graduation-cap",
    status: "active",
  },
];
const oldContributions: Contribution[] = [
  {
    id: "setoran-1",
    goalId: "rumah-impian",
    userId: "budi",
    walletId: "rumah",
    amount: 22500000,
    date: "2026-08-03",
    note: "Selangkah lebih dekat ke rumah kita",
  },
  {
    id: "setoran-2",
    goalId: "rumah-impian",
    userId: "sari",
    walletId: "rumah",
    amount: 18000000,
    date: "2026-08-08",
    note: "Tabungan dari bonus tahunan",
  },
  {
    id: "setoran-3",
    goalId: "rumah-impian",
    userId: "sari",
    walletId: "rumah",
    amount: 2000000,
    date: "2026-09-20",
    note: "Sedikit demi sedikit, jadi rumah",
  },
  {
    id: "setoran-4",
    goalId: "liburan-bali",
    userId: "budi",
    walletId: "rumah",
    amount: 3750000,
    date: "2026-08-10",
    note: "Untuk tiket dan penginapan",
  },
  {
    id: "setoran-5",
    goalId: "liburan-bali",
    userId: "sari",
    walletId: "rumah",
    amount: 3000000,
    date: "2026-08-12",
    note: "Liburan yang kita tunggu",
  },
  {
    id: "setoran-6",
    goalId: "pendidikan-anak",
    userId: "budi",
    walletId: "darurat",
    amount: 12000000,
    date: "2026-08-15",
    note: "Bekal masa depan Adi",
  },
];
wallets.push(
  ...[
    ["target-rumah", "Dompet Rumah Impian"],
    ["target-pendidikan", "Dompet Pendidikan"],
  ].map(([id, name]) => ({
    id,
    name,
    familyId: FAMILY_ID,
    type: "shared" as const,
    ownerUserId: null,
    color: "#f59e0b",
  })),
);
transactions.push(
  ...oldContributions.map((c) => ({
    id: c.id,
    familyId: FAMILY_ID,
    userId: c.userId,
    walletId: c.walletId,
    toWalletId: goals.find((g) => g.id === c.goalId)!.walletId,
    categoryId: "",
    type: "transfer" as const,
    amount: c.amount,
    date: c.date,
    description: c.note,
  })),
);
export const contributions: Contribution[] = [];
export const auditLogs: Audit[] = [
  {
    id: "log-1",
    familyId: FAMILY_ID,
    userId: "budi",
    action: "create",
    entity: "Transaksi",
    entityId: "trx-010",
    detail: "Mencatat makan malam di Sate Padang Ajo sebesar Rp87.500",
    date: "2026-09-30T12:30:00+07:00",
  },
  {
    id: "log-2",
    familyId: FAMILY_ID,
    userId: "sari",
    action: "create",
    entity: "Transaksi",
    entityId: "trx-011",
    detail: "Mencatat sedekah keluarga sebesar Rp100.000",
    date: "2026-09-30T09:15:00+07:00",
  },
  {
    id: "log-3",
    familyId: FAMILY_ID,
    userId: "sari",
    action: "update",
    entity: "Transaksi",
    entityId: "trx-008",
    detail: "Mengubah belanja mingguan: Rp350.000 → Rp320.000",
    date: "2026-09-28T17:00:00+07:00",
  },
  {
    id: "log-4",
    familyId: FAMILY_ID,
    userId: "budi",
    action: "delete",
    entity: "Transaksi",
    entityId: "trx-duplikat",
    detail: "Menghapus catatan bensin yang tercatat dua kali",
    date: "2026-09-25T10:30:00+07:00",
  },
  {
    id: "log-5",
    familyId: FAMILY_ID,
    userId: "sari",
    action: "create",
    entity: "Transaksi",
    entityId: "rumah-impian",
    detail: "Menambahkan Rp2.000.000 ke DP Rumah Impian",
    date: "2026-09-20T08:00:00+07:00",
  },
];
