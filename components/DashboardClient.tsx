'use client'

import { useState, useEffect, useCallback, CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts'

interface User { id: string; name: string; email: string }
interface Category { id: string; name: string; icon: string; color: string }
interface Expense {
  id: string; description: string; amount: number; date: string;
  paymentMethod: string; categoryId: string; category: Category;
  isPending: boolean; month: number; year: number;
}
interface DashboardData {
  totalExpenses: number; salary: number; balance: number;
  byCategory: Array<{ category: Category; total: number; count: number }>;
  byPayment: Record<string, number>;
  dailySpending: Array<{ date: string; amount: number }>;
  expenses: Expense[];
  month: number; year: number;
}

const PAYMENT_LABELS: Record<string, string> = { PIX: 'PIX', DEBIT: 'Débito', CREDIT: 'Crédito' }
const PAYMENT_ICONS: Record<string, string> = { PIX: '📱', DEBIT: '💳', CREDIT: '🏦' }
const MONTHS_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const PIE_COLORS = ['#C17F24','#8B6914','#5C3D11','#A0522D','#D4956A','#6B4226']

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

// Style helpers
const card: CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border-light)',
  borderRadius: '12px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)',
}
const modal: CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
}
const modalBox: CSSProperties = {
  background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem',
  width: '100%', maxWidth: '480px', boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto',
}

function btn(variant: 'primary' | 'secondary' | 'ghost' | 'danger', extra?: CSSProperties): CSSProperties {
  return {
    padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontWeight: 500, fontSize: '0.875rem', transition: 'all 0.2s',
    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
    background: variant === 'primary' ? 'linear-gradient(135deg, var(--accent-gold), var(--accent-amber))'
      : variant === 'danger' ? 'rgba(179,58,58,0.15)' : variant === 'ghost' ? 'transparent' : 'var(--bg-secondary)',
    color: variant === 'primary' ? 'white' : variant === 'danger' ? 'var(--danger)' : 'var(--text-primary)',
    ...extra,
  }
}

function navItem(active: boolean): CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.625rem 1rem', borderRadius: '8px', cursor: 'pointer',
    border: 'none', width: '100%', textAlign: 'left', fontSize: '0.875rem',
    fontWeight: active ? 600 : 400,
    background: active ? 'linear-gradient(135deg, rgba(193,127,36,0.15), rgba(139,105,20,0.1))' : 'transparent',
    color: active ? 'var(--accent-gold)' : 'var(--text-secondary)',
    borderLeft: active ? '3px solid var(--accent-gold)' : '3px solid transparent',
  }
}

function statCard(color: string): CSSProperties {
  return {
    background: 'var(--bg-card)', border: '1px solid var(--border-light)',
    borderRadius: '12px', padding: '1.25rem', borderTop: `3px solid ${color}`, boxShadow: 'var(--shadow-sm)',
  }
}

export default function DashboardClient({ user }: { user: User }) {
  const router = useRouter()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'categories'>('dashboard')
  const [data, setData] = useState<DashboardData | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [expenseForm, setExpenseForm] = useState({
    description: '', amount: '', date: now.toISOString().split('T')[0], paymentMethod: 'PIX', categoryId: '',
  })
  const [showSalaryForm, setShowSalaryForm] = useState(false)
  const [salaryAmount, setSalaryAmount] = useState('')
  const [showCatForm, setShowCatForm] = useState(false)
  const [catForm, setCatForm] = useState({ name: '', icon: '📦', color: '#8B6914' })

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [dashRes, catRes] = await Promise.all([
        fetch(`/api/dashboard?month=${month}&year=${year}`),
        fetch('/api/categories'),
      ])
      const dash = await dashRes.json()
      const cat = await catRes.json()
      setData(dash)
      setCategories(cat.categories || [])
      if (dash.salary && !salaryAmount) setSalaryAmount(String(dash.salary))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year])

  useEffect(() => { fetchData() }, [fetchData])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/auth')
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingExpense ? 'PUT' : 'POST'
    const url = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses'
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...expenseForm, amount: parseFloat(expenseForm.amount) }),
    })
    if (res.ok) {
      setShowExpenseForm(false); setEditingExpense(null)
      setExpenseForm({ description: '', amount: '', date: now.toISOString().split('T')[0], paymentMethod: 'PIX', categoryId: categories[0]?.id || '' })
      fetchData()
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Excluir esta despesa?')) return
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const handleSalary = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/salary', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(salaryAmount), month, year }),
    })
    setShowSalaryForm(false); fetchData()
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/categories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(catForm),
    })
    setShowCatForm(false); setCatForm({ name: '', icon: '📦', color: '#8B6914' }); fetchData()
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Excluir esta categoria?')) return
    await fetch(`/api/categories?id=${id}`, { method: 'DELETE' })
    fetchData()
  }

  const openEditExpense = (exp: Expense) => {
    setEditingExpense(exp)
    setExpenseForm({
      description: exp.description, amount: String(exp.amount),
      date: new Date(exp.date).toISOString().split('T')[0],
      paymentMethod: exp.paymentMethod, categoryId: exp.categoryId,
    })
    setShowExpenseForm(true)
  }

  const SidebarContent = () => (
    <>
      <div style={{ padding: '1.5rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-brown))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0,
          }}>💰</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>FinançasMes</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Controle financeiro</div>
          </div>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {[
            { id: 'dashboard', icon: '📊', label: 'Visão Geral' },
            { id: 'expenses', icon: '📝', label: 'Despesas' },
            { id: 'categories', icon: '🏷️', label: 'Categorias' },
          ].map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id as typeof activeTab); setSidebarOpen(false) }}
              style={navItem(activeTab === item.id)}>
              <span>{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
      <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>PERÍODO</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
              style={{ fontSize: '0.8125rem', padding: '0.375rem 0.5rem' }}>
              {MONTHS_FULL.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))}
              style={{ fontSize: '0.8125rem', padding: '0.375rem 0.5rem', width: '80px' }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'var(--accent-gold)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0,
          }}>{user.name[0].toUpperCase()}</div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.name}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={toggleTheme} style={btn('ghost', { padding: '0.5rem', border: '1px solid var(--border-light)', borderRadius: '8px' })}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button onClick={handleLogout} style={btn('secondary', { flex: 1, justifyContent: 'center' })}>Sair</button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 49 }} />}

      {/* Mobile Sidebar */}
      <aside style={{
        position: 'fixed', top: 0, left: sidebarOpen ? 0 : '-260px', width: '260px', height: '100vh',
        background: 'var(--bg-card)', borderRight: '1px solid var(--border-light)', zIndex: 50,
        transition: 'left 0.3s ease', display: 'flex', flexDirection: 'column',
        boxShadow: sidebarOpen ? 'var(--shadow-lg)' : 'none', overflowY: 'auto',
      }}>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="desktop-sidebar" style={{
        position: 'fixed', top: 0, left: 0, width: '240px', height: '100vh',
        background: 'var(--bg-card)', borderRight: '1px solid var(--border-light)',
        zIndex: 40, display: 'none', flexDirection: 'column', overflowY: 'auto',
      }}>
        <SidebarContent />
      </aside>

      <style>{`
        @media(min-width:768px){
          .desktop-sidebar{display:flex!important}
          .main-content{margin-left:240px!important}
          .mobile-only{display:none!important}
        }
        @media(max-width:480px){.hide-xs{display:none!important}}
      `}</style>

      {/* Main */}
      <main className="main-content" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <header style={{
          background: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)',
          padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="mobile-only"
              style={btn('ghost', { padding: '0.375rem', border: '1px solid var(--border-light)', borderRadius: '8px' })}>
              ☰
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {activeTab === 'dashboard' ? '📊 Visão Geral' : activeTab === 'expenses' ? '📝 Despesas' : '🏷️ Categorias'}
              </h1>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                {MONTHS_FULL[month-1]} de {year}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setShowSalaryForm(true)} style={btn('secondary')}>
              💼 <span className="hide-xs">Salário</span>
            </button>
            <button onClick={() => {
              setEditingExpense(null)
              setExpenseForm({ description: '', amount: '', date: now.toISOString().split('T')[0], paymentMethod: 'PIX', categoryId: categories[0]?.id || '' })
              setShowExpenseForm(true)
            }} style={btn('primary')}>
              + <span className="hide-xs">Despesa</span>
            </button>
          </div>
        </header>

        <div style={{ padding: '1.5rem' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-muted)', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '2rem' }}>⏳</div><div>Carregando...</div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && data && <DashboardTab data={data} />}
              {activeTab === 'expenses' && data && <ExpensesTab expenses={data.expenses} onEdit={openEditExpense} onDelete={handleDeleteExpense} />}
              {activeTab === 'categories' && <CategoriesTab categories={categories} onAdd={() => setShowCatForm(true)} onDelete={handleDeleteCategory} />}
            </>
          )}
        </div>
      </main>

      {/* Expense Modal */}
      {showExpenseForm && (
        <div style={modal} onClick={e => e.target === e.currentTarget && setShowExpenseForm(false)}>
          <div style={modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{editingExpense ? '✏️ Editar Despesa' : '➕ Nova Despesa'}</h3>
              <button onClick={() => { setShowExpenseForm(false); setEditingExpense(null) }}
                style={btn('ghost', { padding: '0.25rem 0.5rem', fontSize: '1.25rem' })}>×</button>
            </div>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label>Descrição</label>
                <input type="text" placeholder="Ex: Almoço, Uber, Conta de luz..."
                  value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Valor (R$)</label>
                  <input type="number" step="0.01" min="0" placeholder="0,00"
                    value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} required />
                </div>
                <div>
                  <label>Data</label>
                  <input type="date" value={expenseForm.date} onChange={e => setExpenseForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label>Categoria</label>
                <select value={expenseForm.categoryId} onChange={e => setExpenseForm(f => ({ ...f, categoryId: e.target.value }))} required>
                  <option value="">Selecione...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label>Forma de Pagamento</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(['PIX', 'DEBIT', 'CREDIT'] as const).map(pm => (
                    <button key={pm} type="button" onClick={() => setExpenseForm(f => ({ ...f, paymentMethod: pm }))}
                      style={{
                        flex: 1, padding: '0.625rem', borderRadius: '8px', border: '2px solid',
                        borderColor: expenseForm.paymentMethod === pm ? 'var(--accent-gold)' : 'var(--border-light)',
                        background: expenseForm.paymentMethod === pm ? 'rgba(193,127,36,0.1)' : 'var(--bg-secondary)',
                        color: expenseForm.paymentMethod === pm ? 'var(--accent-gold)' : 'var(--text-muted)',
                        cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500, transition: 'all 0.2s',
                      }}>
                      {PAYMENT_ICONS[pm]} {PAYMENT_LABELS[pm]}
                    </button>
                  ))}
                </div>
                {expenseForm.paymentMethod === 'CREDIT' && (
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.8125rem', color: 'var(--warning)' }}>
                    ⚠️ Lançado no próximo mês (fatura do cartão)
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button type="button" onClick={() => { setShowExpenseForm(false); setEditingExpense(null) }}
                  style={btn('secondary', { flex: 1, justifyContent: 'center', padding: '0.75rem' })}>Cancelar</button>
                <button type="submit"
                  style={btn('primary', { flex: 2, justifyContent: 'center', padding: '0.75rem' })}>
                  {editingExpense ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Modal */}
      {showSalaryForm && (
        <div style={modal} onClick={e => e.target === e.currentTarget && setShowSalaryForm(false)}>
          <div style={{ ...modalBox, maxWidth: '360px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0 }}>💼 Definir Salário</h3>
              <button onClick={() => setShowSalaryForm(false)} style={btn('ghost', { padding: '0.25rem 0.5rem', fontSize: '1.25rem' })}>×</button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 0 }}>Para {MONTHS_FULL[month-1]} de {year}</p>
            <form onSubmit={handleSalary} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label>Valor do salário (R$)</label>
                <input type="number" step="0.01" min="0" placeholder="Ex: 3500,00"
                  value={salaryAmount} onChange={e => setSalaryAmount(e.target.value)} required autoFocus />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowSalaryForm(false)}
                  style={btn('secondary', { flex: 1, justifyContent: 'center', padding: '0.75rem' })}>Cancelar</button>
                <button type="submit" style={btn('primary', { flex: 2, justifyContent: 'center', padding: '0.75rem' })}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatForm && (
        <div style={modal} onClick={e => e.target === e.currentTarget && setShowCatForm(false)}>
          <div style={{ ...modalBox, maxWidth: '380px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0 }}>🏷️ Nova Categoria</h3>
              <button onClick={() => setShowCatForm(false)} style={btn('ghost', { padding: '0.25rem 0.5rem', fontSize: '1.25rem' })}>×</button>
            </div>
            <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label>Nome</label>
                <input type="text" placeholder="Ex: Saúde, Lazer..."
                  value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Ícone (emoji)</label>
                  <input type="text" placeholder="🏷️" maxLength={2}
                    value={catForm.icon} onChange={e => setCatForm(f => ({ ...f, icon: e.target.value }))} />
                </div>
                <div>
                  <label>Cor</label>
                  <input type="color" value={catForm.color} onChange={e => setCatForm(f => ({ ...f, color: e.target.value }))}
                    style={{ height: '42px', padding: '4px', cursor: 'pointer' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowCatForm(false)}
                  style={btn('secondary', { flex: 1, justifyContent: 'center', padding: '0.75rem' })}>Cancelar</button>
                <button type="submit" style={btn('primary', { flex: 2, justifyContent: 'center', padding: '0.75rem' })}>Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function DashboardTab({ data }: { data: DashboardData }) {
  const balanceColor = data.balance >= 0 ? 'var(--success)' : 'var(--danger)'
  const pieData = data.byCategory.map((c, i) => ({
    name: `${c.category.icon} ${c.category.name}`,
    value: c.total,
    color: c.category.color || PIE_COLORS[i % PIE_COLORS.length],
  }))
  const paymentData = Object.entries(data.byPayment).map(([method, amount]) => ({
    name: { PIX: '📱 PIX', DEBIT: '💳 Débito', CREDIT: '🏦 Crédito' }[method] || method,
    value: amount,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        <div style={statCard('var(--success)')}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>💼 SALÁRIO</div>
          <div style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--success)' }}>{fmt(data.salary)}</div>
        </div>
        <div style={statCard('var(--danger)')}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>💸 TOTAL GASTO</div>
          <div style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--danger)' }}>{fmt(data.totalExpenses)}</div>
        </div>
        <div style={statCard(balanceColor)}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>{data.balance >= 0 ? '✅' : '⚠️'} SALDO</div>
          <div style={{ fontSize: '1.375rem', fontWeight: 700, color: balanceColor }}>{fmt(data.balance)}</div>
        </div>
        <div style={statCard('var(--accent-gold)')}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>📋 DESPESAS</div>
          <div style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--accent-gold)' }}>{data.expenses.length}</div>
        </div>
      </div>

      {/* Progress */}
      {data.salary > 0 && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Consumo do salário</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{Math.min(100, Math.round((data.totalExpenses / data.salary) * 100))}%</span>
          </div>
          <div style={{ height: '12px', background: 'var(--bg-secondary)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '999px',
              width: `${Math.min(100, (data.totalExpenses / data.salary) * 100)}%`,
              background: data.totalExpenses > data.salary
                ? 'linear-gradient(90deg, var(--danger), #cc4444)'
                : 'linear-gradient(90deg, var(--accent-gold), var(--accent-amber))',
              transition: 'width 0.8s ease',
            }} />
          </div>
        </div>
      )}

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {data.dailySpending.length > 0 && (
          <div style={card}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.9375rem', color: 'var(--text-primary)' }}>📈 Gastos por Dia</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.dailySpending.map(d => ({ day: new Date(d.date).getDate(), valor: d.amount }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={v => `R$${v}`} />
                <Tooltip formatter={(v) => [fmt(Number(v ?? 0)), 'Gasto']}
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="valor" stroke="var(--accent-gold)" strokeWidth={2.5}
                  dot={{ fill: 'var(--accent-gold)', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {pieData.length > 0 && (
          <div style={card}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.9375rem', color: 'var(--text-primary)' }}>🥧 Por Categoria</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value"
                  label={({ percent }) => percent ? `${(percent * 100).toFixed(0)}%` : ''}
                  labelLine={false}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [fmt(Number(v ?? 0)), '']}
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {paymentData.length > 0 && (
          <div style={card}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.9375rem', color: 'var(--text-primary)' }}>💳 Por Pagamento</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={paymentData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={v => `R$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={85} />
                <Tooltip formatter={(v) => [fmt(Number(v ?? 0)), 'Total']}
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '8px' }} />
                <Bar dataKey="value" fill="var(--accent-amber)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Category breakdown */}
      {data.byCategory.length > 0 && (
        <div style={card}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.9375rem', color: 'var(--text-primary)' }}>🏷️ Detalhamento por Categoria</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[...data.byCategory].sort((a, b) => b.total - a.total).map(item => (
              <div key={item.category.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem', fontSize: '0.875rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                    <span>{item.category.icon}</span><span>{item.category.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({item.count}x)</span>
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{fmt(item.total)}</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '999px' }}>
                  <div style={{
                    height: '100%', borderRadius: '999px',
                    width: `${data.totalExpenses > 0 ? (item.total / data.totalExpenses) * 100 : 0}%`,
                    background: item.category.color || 'var(--accent-gold)', transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.expenses.length === 0 && (
        <div style={{ ...card, textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Nenhuma despesa este mês</h3>
          <p style={{ margin: 0 }}>Clique em &quot;+ Despesa&quot; para começar a registrar seus gastos.</p>
        </div>
      )}
    </div>
  )
}

function ExpensesTab({ expenses, onEdit, onDelete }: {
  expenses: Expense[]; onEdit: (e: Expense) => void; onDelete: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  const filtered = expenses.filter(e =>
    e.description.toLowerCase().includes(search.toLowerCase()) ||
    e.category.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <input placeholder="🔍 Buscar despesas..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '320px' }} />
      {filtered.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <p style={{ margin: 0 }}>{search ? 'Nenhum resultado' : 'Nenhuma despesa registrada'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map(exp => (
            <div key={exp.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
                background: `${exp.category.color || 'var(--accent-gold)'}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem',
              }}>{exp.category.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {exp.description}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: '999px',
                    background: `${exp.category.color || 'var(--accent-gold)'}15`, color: 'var(--text-muted)' }}>
                    {exp.category.name}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(exp.date).toLocaleDateString('pt-BR')}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: exp.paymentMethod === 'CREDIT' ? 'var(--warning)' : 'var(--text-muted)' }}>
                    {PAYMENT_ICONS[exp.paymentMethod]} {PAYMENT_LABELS[exp.paymentMethod]}
                    {exp.isPending && ' • Próx. mês'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--danger)' }}>{fmt(exp.amount)}</span>
                <button onClick={() => onEdit(exp)} style={btn('ghost', { padding: '0.375rem', border: '1px solid var(--border-light)', borderRadius: '6px' })}>✏️</button>
                <button onClick={() => onDelete(exp.id)} style={btn('danger', { padding: '0.375rem' })}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {filtered.length} despesa{filtered.length !== 1 ? 's' : ''} •{' '}
            <strong style={{ color: 'var(--text-secondary)' }}>{fmt(filtered.reduce((s, e) => s + e.amount, 0))}</strong>
          </span>
        </div>
      )}
    </div>
  )
}

function CategoriesTab({ categories, onAdd, onDelete }: {
  categories: Category[]; onAdd: () => void; onDelete: (id: string) => void
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button onClick={onAdd} style={btn('primary')}>+ Nova Categoria</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {categories.map(cat => (
          <div key={cat.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem',
                background: `${cat.color}20`, border: `2px solid ${cat.color}40`,
              }}>{cat.icon}</div>
              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{cat.name}</span>
            </div>
            <button onClick={() => onDelete(cat.id)} style={btn('danger', { padding: '0.375rem' })}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  )
}
