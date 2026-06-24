import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const categories = await prisma.category.findMany({
    where: { userId: session.userId },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ categories })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { name, icon, color } = await request.json()
  if (!name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })

  const category = await prisma.category.create({
    data: { name, icon: icon || '📦', color: color || '#8B6914', userId: session.userId },
  })

  return NextResponse.json({ category }, { status: 201 })
}

export async function DELETE(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const cat = await prisma.category.findFirst({ where: { id, userId: session.userId } })
  if (!cat) return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })

  await prisma.category.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
