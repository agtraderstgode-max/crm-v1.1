import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'

// Pages — each module has its own page
import { DashboardPage }   from '@/modules/dashboard/pages/DashboardPage'
import { AnalysisPage }    from '@/modules/analysis/pages/AnalysisPage'
import { CustomersPage }   from '@/modules/crm/customers/pages/CustomersPage'
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
import { PriceCategoriesPage } from '@/modules/inventory/price-categories/pages/PriceCategoriesPage'
import { StaffPage }           from '@/modules/staff/pages/StaffPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      // Default redirect to dashboard
      { index: true, element: <Navigate to="/dashboard" replace /> },

      // Core
      { path: 'dashboard',  element: <DashboardPage /> },
      { path: 'analysis',   element: <AnalysisPage /> },
      { path: 'settings',   element: <SettingsPage /> },

      // CRM module
      { path: 'customers',  element: <CustomersPage /> },
      { path: 'leads',      element: <LeadsPage /> },
      { path: 'followups',   element: <FollowupsPage /> },
      { path: 'buying-now',  element: <BuyingNowPage /> },

      // Sales module
      { path: 'quotations', element: <QuotationsPage /> },
      { path: 'orders',     element: <OrdersPage /> },
      { path: 'payments',   element: <PaymentsPage /> },
      { path: 'billing',    element: <BillingPage /> },

      // Inventory module
      { path: 'products',   element: <ProductsPage /> },
      { path: 'stock',      element: <StockPage /> },
      { path: 'purchase-invoices', element: <PurchasePage /> },
      { path: 'price-categories', element: <PriceCategoriesPage /> },

      // Operations module
      { path: 'delivery',   element: <ComingSoon title="Delivery" /> },
      { path: 'staff',      element: <StaffPage /> },
    ],
  },
])

// Temporary placeholder for future modules
function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
      <p className="text-lg font-medium">{title}</p>
      <p className="text-sm mt-1">Coming in Phase 3</p>
    </div>
  )
}
