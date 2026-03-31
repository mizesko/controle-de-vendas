export interface Account {
  id: string
  user_id: string
  name: string
  type: string
  balance: number
  icon: string
  color: string
  created_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  type: 'receita' | 'despesa'
  icon: string
  color: string
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  description: string
  amount: number
  type: 'receita' | 'despesa'
  category_id: string
  account_id: string
  date: string
  notes: string | null
  is_paid: boolean
  transaction_type: 'unico' | 'recorrente'
  product_id: string | null
  created_at: string
  category?: Category
  account?: Account
}

export interface Product {
  id: string
  user_id: string
  name: string
  category: string
  cost_price: number
  sell_price: number
  quantity: number
  min_stock_alert: number
  created_at: string
}

export interface MonthYear {
  month: number
  year: number
}
