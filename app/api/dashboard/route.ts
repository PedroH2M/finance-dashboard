import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

  const [expenses, salary, categories] = await Promise.all([
    prisma.expense.findMany({
      where: { userId: session.userId, month, year },
      include: { category: true },
      orderBy: { date: 'desc' },
    }),
    prisma.salary.findUnique({
      where: { userId_month_year: { userId: session.userId, month, year } },
    }),
    prisma.category.findMany({ where: { userId: session.userId } }),
  ])

  const totalExpenses = expenses.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0)
  const salaryAmount = salary?.amount || 0
  const balance = salaryAmount - totalExpenses

  const byCategory = categories.map((cat: { id: string; name: string; icon: string; color: string }) => {
    const catExpenses = expenses.filter((e: { categoryId: string }) => e.categoryId === cat.id)
    const total = catExpenses.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0)
    return { category: cat, total, count: catExpenses.length }
  }).filter((c: { count: number }) => c.count > 0)

  const byPayment: Record<string, number> = {}
  expenses.forEach((e: { paymentMethod: string; amount: number }) => {
    byPayment[e.paymentMethod] = (byPayment[e.paymentMethod] || 0) + e.amount
  })

  const dailyMap: Record<string, number> = {}
  expenses.forEach((e: { date: string | Date; amount: number }) => {
    const day = new Date(e.date).toISOString().split('T')[0]
    dailyMap[day] = (dailyMap[day] || 0) + e.amount
  })

  const dailySpending = Object.entries(dailyMap)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return NextResponse.json({
    totalExpenses, salary: salaryAmount, balance,
    byCategory, byPayment, dailySpending, expenses, month, year,
  })
}
