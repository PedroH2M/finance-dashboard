import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

  const expenses = await prisma.expense.findMany({
    where: { userId: session.userId, month, year },
    include: { category: true },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json({ expenses })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await request.json()
    const { description, amount, date, paymentMethod, categoryId } = body

    if (!description || !amount || !date || !paymentMethod || !categoryId) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 })
    }

    const expenseDate = new Date(date)
    const isCredit = paymentMethod === 'CREDIT'

    // Credit card: push to next month
    let month = expenseDate.getMonth() + 1
    let year = expenseDate.getFullYear()

    if (isCredit) {
      month = month + 1
      if (month > 12) {
        month = 1
        year = year + 1
      }
    }

    const expense = await prisma.expense.create({
      data: {
        description,
        amount: parseFloat(amount),
        date: expenseDate,
        paymentMethod,
        categoryId,
        userId: session.userId,
        isPending: isCredit,
        month,
        year,
      },
      include: { category: true },
    })

    return NextResponse.json({ expense }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao criar despesa' }, { status: 500 })
  }
}
