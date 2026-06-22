import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const DEFAULT_CATEGORIES = [
  { name: 'Transporte', icon: '🚗', color: '#8B6914' },
  { name: 'Alimentação', icon: '🍽️', color: '#C17F24' },
  { name: 'Contas do Mês', icon: '📋', color: '#5C3D11' },
  { name: 'Compras', icon: '🛍️', color: '#A0522D' },
]

async function main() {
  const pedroPassword = await bcrypt.hash('pedro123', 10)
  const pedro = await prisma.user.upsert({
    where: { email: 'pedro@finance.com' },
    update: {},
    create: { name: 'Pedro', email: 'pedro@finance.com', password: pedroPassword },
  })

  const sabrinaPassword = await bcrypt.hash('sabrina123', 10)
  const sabrina = await prisma.user.upsert({
    where: { email: 'sabrina@finance.com' },
    update: {},
    create: { name: 'Sabrina', email: 'sabrina@finance.com', password: sabrinaPassword },
  })

  for (const user of [pedro, sabrina]) {
    for (const cat of DEFAULT_CATEGORIES) {
      const existing = await prisma.category.findFirst({
        where: { name: cat.name, userId: user.id },
      })
      if (!existing) {
        await prisma.category.create({
          data: { ...cat, userId: user.id },
        })
      }
    }
  }
  console.log('✅ Seed completo:', { pedro: pedro.email, sabrina: sabrina.email })
}

main().catch(console.error).finally(() => prisma.$disconnect())
