import { lazy, Suspense, ReactElement } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/skeleton";

const ContactsPage = lazy(() =>
  import("@/pages/ContactsPage").then((m) => ({ default: m.ContactsPage })),
);
const GroupsListPage = lazy(() =>
  import("@/pages/GroupsListPage").then((m) => ({ default: m.GroupsListPage })),
);
const NewGroupPage = lazy(() =>
  import("@/pages/NewGroupPage").then((m) => ({ default: m.NewGroupPage })),
);
const GroupDetailPage = lazy(() =>
  import("@/pages/GroupDetailPage").then((m) => ({
    default: m.GroupDetailPage,
  })),
);
const AddExpensePage = lazy(() =>
  import("@/pages/AddExpensePage").then((m) => ({ default: m.AddExpensePage })),
);
const EditExpensePage = lazy(() =>
  import("@/pages/EditExpensePage").then((m) => ({
    default: m.EditExpensePage,
  })),
);
const AddReceiptPage = lazy(() =>
  import("@/pages/AddReceiptPage").then((m) => ({ default: m.AddReceiptPage })),
);
const EditReceiptPage = lazy(() =>
  import("@/pages/EditReceiptPage").then((m) => ({
    default: m.EditReceiptPage,
  })),
);
const AdminPage = lazy(() =>
  import("@/pages/AdminPage").then((m) => ({ default: m.AdminPage })),
);

function PageFallback(): ReactElement {
  return (
    <div className="space-y-4 p-4">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-16 w-full rounded-2xl" />
      ))}
    </div>
  );
}

const page = (el: ReactElement): ReactElement => (
  <Suspense fallback={<PageFallback />}>{el}</Suspense>
);

export default function App(): ReactElement {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/groups" replace />} />
        <Route path="contacts" element={page(<ContactsPage />)} />
        <Route path="groups" element={page(<GroupsListPage />)} />
        <Route path="groups/new" element={page(<NewGroupPage />)} />
        <Route path="groups/:id" element={page(<GroupDetailPage />)} />
        <Route
          path="groups/:id/expenses/new"
          element={page(<AddExpensePage />)}
        />
        <Route
          path="groups/:id/expenses/:expId/edit"
          element={page(<EditExpensePage />)}
        />
        <Route
          path="groups/:id/receipts/new"
          element={page(<AddReceiptPage />)}
        />
        <Route
          path="groups/:id/receipts/:receiptId/edit"
          element={page(<EditReceiptPage />)}
        />
        <Route path="admin" element={page(<AdminPage />)} />
        <Route path="*" element={<Navigate to="/groups" replace />} />
      </Route>
    </Routes>
  );
}
