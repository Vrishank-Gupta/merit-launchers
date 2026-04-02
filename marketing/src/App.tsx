import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import ReturnPolicy from "./pages/ReturnPolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import OurTeam from "./pages/OurTeam";
import FeeStructure from "./pages/FeeStructure";
import FAQ from "./pages/FAQ";
import ExternalLinks from "./pages/ExternalLinks";
import ImportantTips from "./pages/ImportantTips";
import Videos from "./pages/Videos";
import NotFound from "./pages/NotFound";

// Partner Dashboard
import { MAAuthProvider } from "./hooks/useMarketingAdminAuth";
import { PartnerAuthProvider } from "./hooks/usePartnerAuth";
import MALogin from "./pages/marketing-admin/MALogin";
import MALayout from "./pages/marketing-admin/MALayout";
import MAOverview from "./pages/marketing-admin/MAOverview";
import MAPartners from "./pages/marketing-admin/MAPartners";
import MAPartnerForm from "./pages/marketing-admin/MAPartnerForm";
import MAPartnerDetail from "./pages/marketing-admin/MAPartnerDetail";
import MAPayouts from "./pages/marketing-admin/MAPayouts";
import MAToolkit from "./pages/marketing-admin/MAToolkit";
import MAPending from "./pages/marketing-admin/MAPending";
import MACommissionRates from "./pages/marketing-admin/MACommissionRates";
import MANetwork from "./pages/marketing-admin/MANetwork";
import MAAccess from "./pages/marketing-admin/MAAccess";
import PartnerLogin from "./pages/partner/PartnerLogin";
import PartnerLayout from "./pages/partner/PartnerLayout";
import PartnerDashboard from "./pages/partner/PartnerDashboard";
import PartnerStudents from "./pages/partner/PartnerStudents";
import PartnerSales from "./pages/partner/PartnerSales";
import PartnerCommission from "./pages/partner/PartnerCommission";
import PartnerLeaderboard from "./pages/partner/PartnerLeaderboard";
import PartnerMilestones from "./pages/partner/PartnerMilestones";
import PartnerToolkit from "./pages/partner/PartnerToolkit";
import PartnerNetwork from "./pages/partner/PartnerNetwork";
import PartnerSubDetail from "./pages/partner/PartnerSubDetail";
import PartnerAccount from "./pages/partner/PartnerAccount";
import PartnerLeads from "./pages/partner/PartnerLeads";
import PartnerJoin from "./pages/PartnerJoin";
import Referral from "./pages/Referral";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <MAAuthProvider>
        <PartnerAuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Marketing site */}
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/courses/clat" element={<CLAT />} />
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
              <Route path="/important-tips" element={<ImportantTips />} />
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
          </BrowserRouter>
        </PartnerAuthProvider>
      </MAAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
