import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import CLAT from "./pages/courses/CLAT";
import CTET1 from "./pages/courses/CTET1";
import CTET2 from "./pages/courses/CTET2";
import DSSSB from "./pages/courses/DSSSB";
import CUET from "./pages/courses/CUET";
import SSC from "./pages/courses/SSC";
import NEET from "./pages/courses/NEET";
import JEE from "./pages/courses/JEE";
import IPMAT from "./pages/courses/IPMAT";
import NDA from "./pages/courses/NDA";
import ReturnPolicy from "./pages/ReturnPolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import OurTeam from "./pages/OurTeam";
import FeeStructure from "./pages/FeeStructure";
import FAQ from "./pages/FAQ";
import ExternalLinks from "./pages/ExternalLinks";
import Videos from "./pages/Videos";
import NotFound from "./pages/NotFound";
import { MAAuthProvider } from "./hooks/useMarketingAdminAuth";
import { PartnerAuthProvider } from "./hooks/usePartnerAuth";
import Referral from "./pages/Referral";


// Partner and marketing-admin areas are code-split so public visitors don't download them.
const MALogin = lazy(() => import("./pages/marketing-admin/MALogin"));
const MALayout = lazy(() => import("./pages/marketing-admin/MALayout"));
const MAOverview = lazy(() => import("./pages/marketing-admin/MAOverview"));
const MAPartners = lazy(() => import("./pages/marketing-admin/MAPartners"));
const MAPartnerForm = lazy(() => import("./pages/marketing-admin/MAPartnerForm"));
const MAPartnerDetail = lazy(() => import("./pages/marketing-admin/MAPartnerDetail"));
const MAPayouts = lazy(() => import("./pages/marketing-admin/MAPayouts"));
const MAToolkit = lazy(() => import("./pages/marketing-admin/MAToolkit"));
const MAPending = lazy(() => import("./pages/marketing-admin/MAPending"));
const MACommissionRates = lazy(() => import("./pages/marketing-admin/MACommissionRates"));
const MANetwork = lazy(() => import("./pages/marketing-admin/MANetwork"));
const MAAccess = lazy(() => import("./pages/marketing-admin/MAAccess"));
const PartnerLogin = lazy(() => import("./pages/partner/PartnerLogin"));
const PartnerLayout = lazy(() => import("./pages/partner/PartnerLayout"));
const PartnerDashboard = lazy(() => import("./pages/partner/PartnerDashboard"));
const PartnerStudents = lazy(() => import("./pages/partner/PartnerStudents"));
const PartnerSales = lazy(() => import("./pages/partner/PartnerSales"));
const PartnerCommission = lazy(() => import("./pages/partner/PartnerCommission"));
const PartnerLeaderboard = lazy(() => import("./pages/partner/PartnerLeaderboard"));
const PartnerMilestones = lazy(() => import("./pages/partner/PartnerMilestones"));
const PartnerToolkit = lazy(() => import("./pages/partner/PartnerToolkit"));
const PartnerNetwork = lazy(() => import("./pages/partner/PartnerNetwork"));
const PartnerSubDetail = lazy(() => import("./pages/partner/PartnerSubDetail"));
const PartnerAccount = lazy(() => import("./pages/partner/PartnerAccount"));
const PartnerLeads = lazy(() => import("./pages/partner/PartnerLeads"));
const PartnerJoin = lazy(() => import("./pages/PartnerJoin"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <MAAuthProvider>
        <PartnerAuthProvider>
          <BrowserRouter>
            <Suspense fallback={null}>
            <Routes>
              {/* Marketing site */}
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/courses/clat" element={<CLAT />} />
              <Route path="/courses/nda" element={<NDA />} />
              <Route path="/courses/ctet-1" element={<CTET1 />} />
              <Route path="/courses/ctet-2" element={<CTET2 />} />
              <Route path="/courses/dsssb" element={<DSSSB />} />
              <Route path="/courses/cuet" element={<CUET />} />
              <Route path="/courses/ssc" element={<SSC />} />
              <Route path="/courses/neet" element={<NEET />} />
              <Route path="/courses/jee" element={<JEE />} />
              <Route path="/courses/ipmat" element={<IPMAT />} />
              <Route path="/return-policy" element={<ReturnPolicy />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-conditions" element={<TermsConditions />} />
              <Route path="/our-team" element={<OurTeam />} />
              <Route path="/fee-structure" element={<FeeStructure />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/external-links" element={<ExternalLinks />} />
              <Route path="/videos" element={<Videos />} />

              {/* Referral tracking */}
              <Route path="/ref/:code" element={<Referral />} />
              <Route path="/ref/:code/:channel" element={<Referral />} />

              {/* Marketing Admin */}
              <Route path="/marketing-admin/login" element={<MALogin />} />
              <Route path="/marketing-admin" element={<MALayout />}>
                <Route index element={<MAOverview />} />
                <Route path="partners" element={<MAPartners />} />
                <Route path="partners/new" element={<MAPartnerForm />} />
                <Route path="partners/:id" element={<MAPartnerDetail />} />
                <Route path="partners/:id/edit" element={<MAPartnerForm />} />
                <Route path="pending" element={<MAPending />} />
                <Route path="commission-rates" element={<MACommissionRates />} />
                <Route path="payouts" element={<MAPayouts />} />
                <Route path="toolkit" element={<MAToolkit />} />
                <Route path="network" element={<MANetwork />} />
                <Route path="access" element={<MAAccess />} />
              </Route>

              {/* Partner Portal */}
              <Route path="/partner/login" element={<PartnerLogin />} />
              <Route path="/partner" element={<PartnerLayout />}>
                <Route index element={<PartnerDashboard />} />
                <Route path="students" element={<PartnerStudents />} />
                <Route path="sales" element={<PartnerSales />} />
                <Route path="commission" element={<PartnerCommission />} />
                <Route path="leaderboard" element={<PartnerLeaderboard />} />
                <Route path="milestones" element={<PartnerMilestones />} />
                <Route path="leads" element={<PartnerLeads />} />
                <Route path="toolkit" element={<PartnerToolkit />} />
                <Route path="network" element={<PartnerNetwork />} />
                <Route path="network/:id" element={<PartnerSubDetail />} />
                <Route path="account" element={<PartnerAccount />} />
              </Route>

              <Route path="/join/:code" element={<PartnerJoin />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </PartnerAuthProvider>
      </MAAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
