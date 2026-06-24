import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  
  const { id } = await params

  const expense = await prisma.expense.findFirst({
    where: { id, userId: session.userId },
  })

  if (!expense) return NextResponse.json({ error: 'Despesa não encontrada' }, { status: 404 })

  await prisma.expense.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { description, amount, date, paymentMethod, categoryId } = body

  const expense = await prisma.expense.findFirst({
    where: { id, userId: session.userId },
  })
  if (!expense) return NextResponse.json({ error: 'Despesa não encontrada' }, { status: 404 })

  const expenseDate = new Date(date)
  const isCredit = paymentMethod === 'CREDIT'
  let month = expenseDate.getMonth() + 1
  let year = expenseDate.getFullYear()

  if (isCredit) {
    month = month + 1
    if (month > 12) { month = 1; year = year + 1 }
  }

  const updated = await prisma.expense.update({
    where: { id },
    data: { description, amount: parseFloat(amount), date: expenseDate, paymentMethod, categoryId, isPending: isCredit, month, year },
    include: { category: true },
  })

  return NextResponse.json({ expense: updated })
}
