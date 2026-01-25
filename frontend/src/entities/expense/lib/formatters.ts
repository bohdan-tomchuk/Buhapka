import { Currency, Category, Source } from '../../../shared/types'

export function formatCurrency(amount: number, currency: Currency): string {
  const formatted = new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

  return `${formatted} ${currency}`
}

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  return new Intl.DateTimeFormat('uk-UA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj)
}

export function formatCategory(category: Category): string {
  const categoryLabels: Record<Category, string> = {
    [Category.PARTS]: 'Parts',
    [Category.TOOLS]: 'Tools',
    [Category.REPAIR]: 'Repair',
    [Category.CHARITY_TRANSFER]: 'Charity Transfer',
    [Category.DELIVERY]: 'Delivery',
  }

  return categoryLabels[category] || category
}

export function formatSource(source: Source): string {
  const sourceLabels: Record<Source, string> = {
    [Source.CASH]: 'Cash',
    [Source.FUND_ACCOUNT]: 'Fund Account',
  }

  return sourceLabels[source] || source
}

export function formatExchangeRate(
  rate: number,
  currency: Currency,
  rateDate: string | Date | null
): string {
  const formattedRate = new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(rate)

  const dateStr = rateDate ? ` on ${formatDate(rateDate)}` : ''
  return `1 ${currency} = ${formattedRate} UAH${dateStr}`
}
