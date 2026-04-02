export const PARTNER_TYPES = ["Campus Ambassador", "Education Associate", "Institutional Partner"] as const;

export const PARTNER_PROFESSIONS = [
  "Academician",
  "Private Educators",
  "Entrepreneurs",
  "L&D Professional",
  "Career Counsellors",
  "Parenting Coaches",
] as const;

export function formatPartnerAddress(partner: any) {
  return [
    partner?.address_line_1 || partner?.addressLine1,
    partner?.address_line_2 || partner?.addressLine2,
    partner?.locality,
    partner?.district,
    partner?.state,
    partner?.pincode,
  ].filter(Boolean).join(", ");
}
