import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import DashboardClient from '@/components/DashboardClient'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/auth')

  return <DashboardClient user={{ id: session.userId, name: session.name, email: session.email }} />
}
