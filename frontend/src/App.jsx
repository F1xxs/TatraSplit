import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Skeleton } from '@/components/ui/skeleton'

const DashboardPage  = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const GroupsListPage = lazy(() => import('@/pages/GroupsListPage').then((m) => ({ default: m.GroupsListPage })))
const GroupDetailPage = lazy(() => import('@/pages/GroupDetailPage').then((m) => ({ default: m.GroupDetailPage })))
const AddExpensePage  = lazy(() => import('@/pages/AddExpensePage').then((m) => ({ default: m.AddExpensePage })))
const SettleUpPage   = lazy(() => import('@/pages/SettleUpPage').then((m) => ({ default: m.SettleUpPage })))
const ActivityPage   = lazy(() => import('@/pages/ActivityPage').then((m) => ({ default: m.ActivityPage })))
const NewGroupPage   = lazy(() => import('@/pages/NewGroupPage').then((m) => ({ default: m.NewGroupPage })))
const JoinGroupPage  = lazy(() => import('@/pages/JoinGroupPage').then((m) => ({ default: m.JoinGroupPage })))
const PaymentPage    = lazy(() => import('@/pages/PaymentPage').then((m) => ({ default: m.PaymentPage })))

function PageFallback() {
  return (
    <div className="space-y-4 p-4">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-16 w-full rounded-2xl" />
      ))}
    </div>
  )
}

const page = (el) => <Suspense fallback={<PageFallback />}>{el}</Suspense>

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index                               element={page(<DashboardPage />)} />
        <Route path="groups"                       element={page(<GroupsListPage />)} />
        <Route path="groups/new"                   element={page(<NewGroupPage />)} />
        <Route path="groups/:id"                   element={page(<GroupDetailPage />)} />
        <Route path="groups/:id/expenses/new"      element={page(<AddExpensePage />)} />
        <Route path="groups/:id/settle"            element={page(<SettleUpPage />)} />
        <Route path="activity"                     element={page(<ActivityPage />)} />
        <Route path="payment"                      element={page(<PaymentPage />)} />
        <Route path="join/:token"                  element={page(<JoinGroupPage />)} />
        <Route path="*"                            element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
