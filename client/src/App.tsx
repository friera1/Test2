import { Route, Switch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { I18nProvider } from "@/hooks/use-i18n";
import { ProtectedRoute } from "@/lib/protected-route";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile-page";
import PlayerRankings from "@/pages/player-rankings";
import AllianceRankings from "@/pages/alliance-rankings";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { motion } from "framer-motion";
import React from "react";

const PreviewPage = React.lazy(() => import("./pages/preview"));

function Router() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col min-h-screen"
    >
      <Header />
      <main className="flex-grow">
        <Switch>
          <Route path="/auth" component={AuthPage} />
          <ProtectedRoute path="/" component={ProfilePage} />
          <ProtectedRoute path="/rankings" component={PlayerRankings} />
          <ProtectedRoute path="/alliances" component={AllianceRankings} />
          <Route path="/preview">
            <React.Suspense fallback={<div>Loading...</div>}>
              <PreviewPage />
            </React.Suspense>
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </motion.div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
