export enum Currency {
  UAH = 'UAH',
  USD = 'USD',
  EUR = 'EUR',
}

export enum Source {
  CASH = 'CASH',
  FUND_ACCOUNT = 'FUND_ACCOUNT',
}

export enum Category {
  PARTS = 'PARTS',
  TOOLS = 'TOOLS',
  REPAIR = 'REPAIR',
  CHARITY_TRANSFER = 'CHARITY_TRANSFER',
  DELIVERY = 'DELIVERY',
}

export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  amount: number
  currency: Currency
  exchange_rate: number | null
  rate_date: string | null
  amount_uah: number
  date: string
  source: Source
  category: Category
  description: string
  user_id: string
  parent_expense_id: string | null
  receipt_id: string | null
  children?: Expense[]
  created_at: string
  updated_at: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  access_token: string
}

export interface ExpenseFilters {
  page?: number
  limit?: number
  dateFrom?: string | null
  dateTo?: string | null
  category?: Category | null
  source?: Source | null
}

export interface PaginatedExpenseResponse {
  data: Expense[]
  total: number
  page: number
  limit: number
}
