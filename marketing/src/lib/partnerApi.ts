const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function authHeaders(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

async function req<T>(method: string, path: string, token?: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}/v1${path}`, {
    method,
    headers: token ? authHeaders(token) : { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && !path.endsWith("/auth/login")) {
    if (path.startsWith("/marketing-admin")) {
      localStorage.removeItem("ma_token");
      window.location.replace("/marketing-admin/login");
    } else {
      localStorage.removeItem("partner_token");
      localStorage.removeItem("partner_info");
      window.location.replace("/partner/login");
    }
    throw new Error("Session expired. Please log in again.");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || err.error || res.statusText);
  }
  return res.json();
}

export const marketingAdminApi = {
  login: (email: string, password: string) =>
    req<{ token: string }>("POST", "/marketing-admin/auth/login", undefined, { email, password }),
  overview: (t: string) => req<any>("GET", "/marketing-admin/overview", t),
  getPartners: (t: string) => req<any>("GET", "/marketing-admin/partners", t),
  getPartner: (t: string, id: string) => req<any>("GET", `/marketing-admin/partners/${id}`, t),
  createPartner: (t: string, data: any) => req<any>("POST", "/marketing-admin/partners", t, data),
  updatePartner: (t: string, id: string, data: any) => req<any>("PUT", `/marketing-admin/partners/${id}`, t, data),
  getPayouts: (t: string) => req<any>("GET", "/marketing-admin/payouts", t),
  generatePayouts: (t: string, month: string) =>
    req<any>("POST", "/marketing-admin/payouts/generate", t, { month }),
  markPaid: (t: string, id: string, data: any) => req<any>("PUT", `/marketing-admin/payouts/${id}/pay`, t, data),
  getToolkit: (t: string) => req<any>("GET", "/marketing-admin/toolkit", t),
  uploadToolkit: (t: string, data: any) => req<any>("POST", "/marketing-admin/toolkit", t, data),
  deleteToolkit: (t: string, id: string) => req<any>("DELETE", `/marketing-admin/toolkit/${id}`, t),
  getPending: (t: string) => req<any>("GET", "/marketing-admin/pending", t),
  bulkApprovePending: (t: string, ids: string[]) =>
    req<any>("POST", "/marketing-admin/pending/bulk-approve", t, { ids }),
  getNetwork: (t: string) => req<any>("GET", "/marketing-admin/network", t),
  getCommissionRates: (t: string) => req<any>("GET", "/marketing-admin/commission-rates", t),
  updateCommissionRates: (t: string, rates: { partner_type: string; rate: number }[]) =>
    req<any>("PUT", "/marketing-admin/commission-rates", t, { rates }),
  bulkMarkPaid: (t: string, payouts: { id: string; paid_amount: number; notes?: string }[]) =>
    req<any>("PUT", "/marketing-admin/payouts/bulk-pay", t, { payouts }),
};

export const partnerApi = {
  login: (email: string, password: string) =>
    req<{ token: string; affiliate: any }>("POST", "/partner/auth/login", undefined, { email, password }),
  me: (t: string) => req<any>("GET", "/partner/me", t),
  stats: (t: string) => req<any>("GET", "/partner/stats", t),
  students: (t: string) => req<any>("GET", "/partner/students", t),
  monthly: (t: string) => req<any>("GET", "/partner/monthly", t),
  courses: (t: string) => req<any>("GET", "/partner/courses", t),
  payouts: (t: string) => req<any>("GET", "/partner/payouts", t),
  leaderboard: (t: string) => req<any>("GET", "/partner/leaderboard", t),
  milestones: (t: string) => req<any>("GET", "/partner/milestones", t),
  toolkit: (t: string) => req<any>("GET", "/partner/toolkit", t),
  joinRequest: (referrer_code: string, data: any) =>
    req<any>("POST", "/partner/join", undefined, { ...data, referrer_code }),
  network: (t: string) => req<any>("GET", "/partner/network", t),
  subPartnerDetail: (t: string, id: string) => req<any>("GET", `/partner/sub-partners/${id}`, t),
  pendingApplications: (t: string) => req<any>("GET", "/partner/pending", t),
  approvePendingApplication: (t: string, id: string, data: any) =>
    req<any>("POST", `/partner/pending/${id}/approve`, t, data),
  changePassword: (t: string, data: { current_password: string; new_password: string }) =>
    req<any>("POST", "/partner/change-password", t, data),
  platformStats: (t: string) => req<any>("GET", "/partner/platform-stats", t),
  leads: (t: string) => req<any>("GET", "/partner/leads", t),
  createLead: (t: string, data: any) => req<any>("POST", "/partner/leads", t, data),
  updateLead: (t: string, id: string, data: any) => req<any>("PUT", `/partner/leads/${id}`, t, data),
  completeChecklistStep: (t: string, stepKey: string) =>
    req<any>("POST", `/partner/checklist/${encodeURIComponent(stepKey)}/complete`, t),
};
