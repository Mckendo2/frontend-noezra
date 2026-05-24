import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import MainLayout from '@/components/shared/MainLayout'

// Pages (lazy-loaded in the future)
import LoginPage from '@/features/auth/LoginPage'
import DashboardPage from '@/features/dashboard/DashboardPage'
import SalesPage from '@/features/sales/SalesPage'
import QuotationsPage from '@/features/quotations/QuotationsPage'
import ProductsPage from '@/features/products/ProductsPage'
import CategoriesPage from '@/features/categories/CategoriesPage'
import CustomersPage from '@/features/customers/CustomersPage'
import SuppliersPage from '@/features/suppliers/SuppliersPage'
import PurchasesPage from '@/features/purchases/PurchasesPage'
import ReportsPage from '@/features/reports/ReportsPage'
import CreditsPage from '@/features/credits/CreditsPage'
import ExpensesPage from '@/features/expenses/ExpensesPage'
import UsersPage from '@/features/users/UsersPage'
import ProfilePage from '@/features/profile/ProfilePage'
import LandingPage from '@/features/public/LandingPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role_id !== 1 && (user as any)?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="quotations" element={<QuotationsPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="credits" element={<CreditsPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route
            path="users"
            element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            }
          />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
