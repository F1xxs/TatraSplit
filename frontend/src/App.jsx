import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { GroupsListPage } from '@/pages/GroupsListPage'
import { GroupDetailPage } from '@/pages/GroupDetailPage'
import { AddExpensePage } from '@/pages/AddExpensePage'
import { SettleUpPage } from '@/pages/SettleUpPage'
import { ActivityPage } from '@/pages/ActivityPage'
import { NewGroupPage } from '@/pages/NewGroupPage'
import { JoinGroupPage } from '@/pages/JoinGroupPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="groups" element={<GroupsListPage />} />
        <Route path="groups/new" element={<NewGroupPage />} />
        <Route path="groups/:id" element={<GroupDetailPage />} />
        <Route path="groups/:id/expenses/new" element={<AddExpensePage />} />
        <Route path="groups/:id/settle" element={<SettleUpPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="join/:token" element={<JoinGroupPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
