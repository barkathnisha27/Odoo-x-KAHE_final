import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Landing from "@/pages/Landing";
import CustomerDashboard from "@/pages/customer/Dashboard";
import CustomerMenu from "@/pages/customer/Menu";
import CustomerOrders from "@/pages/customer/Orders";
import CustomerRewards from "@/pages/customer/Rewards";
import AdminDashboard from "@/pages/admin/Dashboard";
import Products from "@/pages/admin/Products";
import Categories from "@/pages/admin/Categories";
import Tables from "@/pages/admin/Tables";
import Payments from "@/pages/admin/Payments";
import Coupons from "@/pages/admin/Coupons";
import Employees from "@/pages/admin/Employees";
import Bookings from "@/pages/admin/Bookings";
import Ingredients from "@/pages/admin/Ingredients";
import Predictions from "@/pages/admin/Predictions";
import Simulation from "@/pages/admin/Simulation";
import MapIntelligence from "@/pages/admin/MapIntelligence";
import Reports from "@/pages/admin/Reports";
import Dataset from "@/pages/admin/Dataset";
import Settings from "@/pages/admin/Settings";
import AIAssistant from "@/pages/admin/AIAssistant";
import POSTerminal from "@/pages/pos/POS";
import POSOrders from "@/pages/pos/Orders";
import KDS from "@/pages/kitchen/KDS";
import Payment from "@/pages/Payment";
import Receipt from "@/pages/Receipt";
import CustomerDisplay from "@/pages/CustomerDisplay";
import QrOrder from "@/pages/QrOrder";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster richColors closeButton position="top-right" />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Landing />} />

              {/* Public */}
              <Route path="/s/:token" element={<QrOrder />} />
              <Route path="/customer-display/:orderId" element={<CustomerDisplay />} />
              <Route path="/pay/:orderId" element={<Payment />} />
              <Route path="/receipt/:orderId" element={<Receipt />} />

              {/* Customer */}
              <Route path="/customer" element={<ProtectedRoute allow={["customer"]}><CustomerDashboard /></ProtectedRoute>} />
              <Route path="/customer/menu" element={<ProtectedRoute allow={["customer"]}><CustomerMenu /></ProtectedRoute>} />
              <Route path="/customer/orders" element={<ProtectedRoute allow={["customer"]}><CustomerOrders /></ProtectedRoute>} />
              <Route path="/customer/rewards" element={<ProtectedRoute allow={["customer"]}><CustomerRewards /></ProtectedRoute>} />

              {/* Admin */}
              <Route path="/admin" element={<ProtectedRoute allow={["admin"]}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/products" element={<ProtectedRoute allow={["admin"]}><Products /></ProtectedRoute>} />
              <Route path="/admin/categories" element={<ProtectedRoute allow={["admin"]}><Categories /></ProtectedRoute>} />
              <Route path="/admin/tables" element={<ProtectedRoute allow={["admin"]}><Tables /></ProtectedRoute>} />
              <Route path="/admin/payments" element={<ProtectedRoute allow={["admin"]}><Payments /></ProtectedRoute>} />
              <Route path="/admin/coupons" element={<ProtectedRoute allow={["admin"]}><Coupons /></ProtectedRoute>} />
              <Route path="/admin/employees" element={<ProtectedRoute allow={["admin"]}><Employees /></ProtectedRoute>} />
              <Route path="/admin/bookings" element={<ProtectedRoute allow={["admin"]}><Bookings /></ProtectedRoute>} />
              <Route path="/admin/ingredients" element={<ProtectedRoute allow={["admin"]}><Ingredients /></ProtectedRoute>} />
              <Route path="/admin/predictions" element={<ProtectedRoute allow={["admin"]}><Predictions /></ProtectedRoute>} />
              <Route path="/admin/simulation" element={<ProtectedRoute allow={["admin"]}><Simulation /></ProtectedRoute>} />
              <Route path="/admin/map" element={<ProtectedRoute allow={["admin"]}><MapIntelligence /></ProtectedRoute>} />
              <Route path="/admin/reports" element={<ProtectedRoute allow={["admin"]}><Reports /></ProtectedRoute>} />
              <Route path="/admin/dataset" element={<ProtectedRoute allow={["admin"]}><Dataset /></ProtectedRoute>} />
              <Route path="/admin/ai" element={<ProtectedRoute allow={["admin"]}><AIAssistant /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute allow={["admin"]}><Settings /></ProtectedRoute>} />

              {/* POS */}
              <Route path="/pos" element={<ProtectedRoute allow={["admin", "cashier"]}><POSTerminal /></ProtectedRoute>} />
              <Route path="/pos/orders" element={<ProtectedRoute allow={["admin", "cashier"]}><POSOrders /></ProtectedRoute>} />

              {/* Kitchen */}
              <Route path="/kds" element={<ProtectedRoute allow={["admin", "cashier", "kitchen"]}><KDS /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
