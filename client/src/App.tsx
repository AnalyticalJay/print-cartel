import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ChatWidget } from "./components/ChatWidget";
import Home from "./pages/Home";
import OrderWizard from "./pages/OrderWizard";
import AdminDashboard from "./pages/AdminDashboard";
import OrderTracking from "./pages/OrderTracking";
import AccountDashboard from "./pages/AccountDashboard";
import NotificationSettings from "./pages/NotificationSettings";
import Reseller from "./pages/Reseller";
import ResellersManagement from "./pages/ResellersManagement";

import { PayFastReturn } from "./pages/PayFastReturn";
import { PaymentSuccess } from "./pages/PaymentSuccess";
import { PaymentCancel } from "./pages/PaymentCancel";
import { PaymentPage } from "./pages/PaymentPage";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/order"} component={OrderWizard} />
      <Route path={"/reseller"} component={Reseller} />
      <Route path={"/admin/resellers"} component={ResellersManagement} />
      <Route path={"/track"} component={OrderTracking} />
      <Route path={"/dashboard"} component={AccountDashboard} />
      <Route path={"/profile"} component={AccountDashboard} />
      <Route path={"/notification-settings"} component={NotificationSettings} />
      <Route path={"/admin"} component={AdminDashboard} />

      <Route path={"/payment"} component={PaymentPage} />
      <Route path={"/payment/payfast-return"} component={PayFastReturn} />
      <Route path={"/payment/success"} component={PaymentSuccess} />
      <Route path={"/payment/cancel"} component={PaymentCancel} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <ChatWidget />
          </TooltipProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
