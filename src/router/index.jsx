import { createBrowserRouter, Navigate, useRouteError, Link } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AlertTriangle } from 'lucide-react'

// Pages — each module has its own page
import { DashboardPage }   from '@/modules/dashboard/pages/DashboardPage'
import { AnalysisPage }    from '@/modules/analysis/pages/AnalysisPage'
import { CustomersPage }   from '@/modules/crm/customers/pages/CustomersPage'
import { ContactsPage }    from '@/modules/crm/contacts/pages/ContactsPage'
import { LeadsPage }       from '@/modules/crm/leads/pages/LeadsPage'
import { FollowupsPage }   from '@/modules/crm/followups/pages/FollowupsPage'
import { BuyingNowPage }   from '@/modules/crm/buyingnow/pages/BuyingNowPage'
import { QuotationsPage }  from '@/modules/sales/quotations/pages/QuotationsPage'
import { OrdersPage }      from '@/modules/sales/orders/pages/OrdersPage'
import { PaymentsPage }    from '@/modules/sales/payments/pages/PaymentsPage'
import { BillingPage }     from '@/modules/sales/billing/pages/BillingPage'
import { ProductsPage }    from '@/modules/inventory/products/pages/ProductsPage'
import { StockPage }       from '@/modules/inventory/stock/pages/StockPage'
import { SettingsPage }    from '@/modules/settings/pages/SettingsPage'
import { PurchasePage }    from '@/modules/inventory/purchase/pages/PurchasePage'
import { ReturnsPage }     from '@/modules/inventory/returns/pages/ReturnsPage'
import { PriceCategoriesPage } from '@/modules/inventory/price-categories/pages/PriceCategoriesPage'
import { StaffPage }           from '@/modules/staff/pages/StaffPage'
import { ChatPage }            from '@/modules/chat/pages/ChatPage'
import { MarketingPage }       from '@/modules/marketing/pages/MarketingPage'
import { ReferralPage }        from '@/modules/referral/pages/ReferralPage'
import { LetterPadPage }       from '@/modules/letterpad/pages/LetterPadPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      // Default redirect to dashboard
      { index: true, element: <Navigate to="/dashboard" replace /> },

      // Core
      { path: 'dashboard',  element: <DashboardPage /> },
      { path: 'analysis',   element: <AnalysisPage /> },
      { path: 'chat',       element: <ChatPage /> },
      { path: 'letter-pad', element: <LetterPadPage /> },
      { path: 'settings',   element: <SettingsPage /> },

      // CRM module
      { path: 'customers',  element: <CustomersPage /> },
      { path: 'contacts',   element: <ContactsPage /> },
      { path: 'leads',      element: <LeadsPage /> },
      { path: 'followups',   element: <FollowupsPage /> },
      { path: 'buying-now',  element: <BuyingNowPage /> },

      // Sales module
      { path: 'quotations', element: <QuotationsPage /> },
      { path: 'orders',     element: <OrdersPage /> },
      { path: 'payments',   element: <PaymentsPage /> },
      { path: 'billing',    element: <BillingPage /> },

      // Marketing module
      { path: 'marketing',  element: <MarketingPage /> },
      { path: 'referral',   element: <ReferralPage /> },

      // Inventory module
      { path: 'products',   element: <ProductsPage /> },
      { path: 'stock',      element: <StockPage /> },
      { path: 'purchase-invoices', element: <PurchasePage /> },
      { path: 'returns',    element: <ReturnsPage /> },
      { path: 'price-categories', element: <PriceCategoriesPage /> },

      // Operations module
      { path: 'delivery',   element: <ComingSoon title="Delivery" /> },
      { path: 'staff',      element: <StaffPage /> },

      // Aliases & fallback
      { path: 'quotation-planner', element: <Navigate to="/quotations" replace /> },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
])

// Custom graceful Error Boundary for React Router
function RouteErrorBoundary() {
  const error = useRouteError()
  console.error('Route error captured:', error)

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-500 mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Page Not Found or Encountered Error</h2>
        <p className="text-sm text-slate-500 mb-6">
          {error?.statusText || error?.message || 'The requested page could not be loaded.'}
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            to="/dashboard"
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
          >
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  )
}

// Temporary placeholder for future modules
function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
      <p className="text-lg font-medium">{title}</p>
      <p className="text-sm mt-1">Coming in Phase 3</p>
    </div>
  )
}
