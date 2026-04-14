import { Switch, Route, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Home from "@/pages/Home";
import Schedule from "@/pages/Schedule";
import Scores from "@/pages/Scores";
import Scorecard from "@/pages/Scorecard";
import PointsTable from "@/pages/PointsTable";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location]);
  return null;
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden w-full">
      <ScrollToTop />
      <Navbar />
      <main className="flex-grow w-full overflow-x-hidden">
        <AnimatePresence mode="wait">{children}</AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/schedule" component={Schedule} />
          <Route path="/scores" component={Scores} />
          <Route path="/scorecard/:matchId" component={Scorecard} />
          <Route path="/points-table" component={PointsTable} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </QueryClientProvider>
  );
}
