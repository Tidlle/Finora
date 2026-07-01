import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { FinoraProvider, useFinora } from "./contexts/FinoraContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import LandingPage from "./pages/LandingPage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import CategoriesPage from "./pages/CategoriesPage";
import GoalsPage from "./pages/GoalsPage";
import ProfilePage from "./pages/ProfilePage";
import FutureEvolutionPage from "./pages/FutureEvolutionPage";
import ImportTransactionsPage from "./pages/ImportTransactionsPage";
import MonthlyReportPage from "./pages/MonthlyReportPage";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useFinora();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) return null;
  return children;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/dashboard">{() => <ProtectedRoute><DashboardPage /></ProtectedRoute>}</Route>
      <Route path="/transactions">{() => <ProtectedRoute><TransactionsPage /></ProtectedRoute>}</Route>
      <Route path="/categories">{() => <ProtectedRoute><CategoriesPage /></ProtectedRoute>}</Route>
      <Route path="/goals">{() => <ProtectedRoute><GoalsPage /></ProtectedRoute>}</Route>
      <Route path="/profile">{() => <ProtectedRoute><ProfilePage /></ProtectedRoute>}</Route>
      <Route path="/future">{() => <ProtectedRoute><FutureEvolutionPage /></ProtectedRoute>}</Route>
      <Route path="/import">{() => <ProtectedRoute><ImportTransactionsPage /></ProtectedRoute>}</Route>
      <Route path="/report">{() => <ProtectedRoute><MonthlyReportPage /></ProtectedRoute>}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <FinoraProvider>
          <TooltipProvider>
            <Toaster richColors position="top-right" />
            <Router />
          </TooltipProvider>
        </FinoraProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
