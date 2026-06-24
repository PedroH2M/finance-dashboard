import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

  const salary = await prisma.salary.findUnique({
    where: { userId_month_year: { userId: session.userId, month, year } },
  })

  return NextResponse.json({ salary })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { amount, month, year } = await request.json()
  if (!amount || !month || !year) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  }

  const salary = await prisma.salary.upsert({
    where: { userId_month_year: { userId: session.userId, month, year } },
    update: { amount: parseFloat(amount) },
    create: { amount: parseFloat(amount), month, year, userId: session.userId },
  })

  return NextResponse.json({ salary })
}
