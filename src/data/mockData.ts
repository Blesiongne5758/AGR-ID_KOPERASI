// Mock data untuk aplikasi koperasi

export interface Member {
  id: string;
  member_id: string;
  full_name: string;
  phone: string;
  email: string;
  photo?: string;
  join_date: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  cooperative_id: string;
  role: 'MEMBER' | 'ADMIN' | 'MANAGER';
  savings: {
    pokok: number;
    wajib: number;
    sukarela: number;
  };
}

export interface Loan {
  id: string;
  member_id: string;
  member_name: string;
  type: 'MODAL_USAHA' | 'DARURAT' | 'PAYLATER';
  amount: number;
  remaining: number;
  interest_rate: number;
  status: 'PENDING' | 'VERIFIED' | 'APPROVED' | 'DISBURSED' | 'COMPLETED' | 'OVERDUE';
  applied_date: string;
  due_date: string;
  installments: number;
  paid_installments: number;
  next_payment_date: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'LOAN_PAYMENT' | 'LOAN_DISBURSEMENT';
  category: string;
  amount: number;
  balance_after: number;
  description: string;
}

export const coopCodeMap: Record<string, string> = {
  'AGR': 'Koperasi AGRID Sejahtera',
  'KPM': 'Koperasi Maju Bersama',
  'SPR': 'Koperasi Sumber Rejeki',
  'BKR': 'Koperasi Berkah Rakyat',
};

export const detectCooperative = (memberId: string): string | null => {
  const prefix = memberId.substring(0, 3).toUpperCase();
  return coopCodeMap[prefix] || null;
};

export const adminStats = {
  total_assets: 2_450_000_000,
  npl_ratio: 2.3,
  active_members: 1_247,
  total_members: 1_580,
  running_shu: 185_000_000,
  total_savings: 1_890_000_000,
  total_loans: 560_000_000,
  pending_loans: 12,
  monthly_revenue: 45_000_000,
};

export const members: Member[] = [
  {
    id: 'u1',
    member_id: 'AGR001',
    full_name: 'Ahmad Suryadi',
    phone: '081234567890',
    email: 'ahmad@example.com',
    join_date: '2023-01-15',
    status: 'ACTIVE',
    cooperative_id: 'c1',
    role: 'MEMBER',
    savings: { pokok: 500_000, wajib: 2_400_000, sukarela: 15_750_000 },
  },
  {
    id: 'u2',
    member_id: 'AGR002',
    full_name: 'Siti Nurhaliza',
    phone: '081234567891',
    email: 'siti@example.com',
    join_date: '2023-03-20',
    status: 'ACTIVE',
    cooperative_id: 'c1',
    role: 'MEMBER',
    savings: { pokok: 500_000, wajib: 1_800_000, sukarela: 8_200_000 },
  },
  {
    id: 'u3',
    member_id: 'AGR003',
    full_name: 'Budi Santoso',
    phone: '081234567892',
    email: 'budi@example.com',
    join_date: '2023-05-10',
    status: 'ACTIVE',
    cooperative_id: 'c1',
    role: 'MEMBER',
    savings: { pokok: 500_000, wajib: 3_000_000, sukarela: 22_500_000 },
  },
  {
    id: 'u4',
    member_id: 'AGR004',
    full_name: 'Dewi Lestari',
    phone: '081234567893',
    email: 'dewi@example.com',
    join_date: '2023-07-01',
    status: 'PENDING',
    cooperative_id: 'c1',
    role: 'MEMBER',
    savings: { pokok: 0, wajib: 0, sukarela: 0 },
  },
];

export const loans: Loan[] = [
  {
    id: 'l1',
    member_id: 'AGR001',
    member_name: 'Ahmad Suryadi',
    type: 'MODAL_USAHA',
    amount: 25_000_000,
    remaining: 18_500_000,
    interest_rate: 1.5,
    status: 'DISBURSED',
    applied_date: '2024-06-01',
    due_date: '2025-06-01',
    installments: 12,
    paid_installments: 5,
    next_payment_date: '2025-02-01',
  },
  {
    id: 'l2',
    member_id: 'AGR002',
    member_name: 'Siti Nurhaliza',
    type: 'DARURAT',
    amount: 5_000_000,
    remaining: 3_750_000,
    interest_rate: 1.0,
    status: 'DISBURSED',
    applied_date: '2024-09-15',
    due_date: '2025-03-15',
    installments: 6,
    paid_installments: 3,
    next_payment_date: '2025-01-15',
  },
  {
    id: 'l3',
    member_id: 'AGR003',
    member_name: 'Budi Santoso',
    type: 'PAYLATER',
    amount: 10_000_000,
    remaining: 10_000_000,
    interest_rate: 0,
    status: 'PENDING',
    applied_date: '2025-01-10',
    due_date: '2025-04-10',
    installments: 3,
    paid_installments: 0,
    next_payment_date: '2025-02-10',
  },
];

export const transactions: Transaction[] = [
  {
    id: 't1',
    date: '2025-01-10',
    type: 'DEPOSIT',
    category: 'Sukarela',
    amount: 500_000,
    balance_after: 15_750_000,
    description: 'Setoran simpanan sukarela',
  },
  {
    id: 't2',
    date: '2025-01-05',
    type: 'LOAN_PAYMENT',
    category: 'Modal Usaha',
    amount: 2_291_667,
    balance_after: 15_250_000,
    description: 'Angsuran ke-5 pinjaman modal usaha',
  },
  {
    id: 't3',
    date: '2024-12-28',
    type: 'DEPOSIT',
    category: 'Wajib',
    amount: 200_000,
    balance_after: 15_250_000,
    description: 'Setoran simpanan wajib Desember',
  },
  {
    id: 't4',
    date: '2024-12-15',
    type: 'WITHDRAWAL',
    category: 'Sukarela',
    amount: 1_000_000,
    balance_after: 15_050_000,
    description: 'Penarikan simpanan sukarela',
  },
  {
    id: 't5',
    date: '2024-12-05',
    type: 'LOAN_PAYMENT',
    category: 'Modal Usaha',
    amount: 2_291_667,
    balance_after: 16_050_000,
    description: 'Angsuran ke-4 pinjaman modal usaha',
  },
];

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};
