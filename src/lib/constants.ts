import { UserRole, FacilityCategory, IndicatorFrequency, ComplianceStatus } from "@prisma/client";

export const ROLE_LABELS: Record<UserRole, string> = {
  REGX: "Super Admin",
  ADMIN: "Facility Administrator",
  MSDS_FOCAL: "MSDS Focal Person",
};

export const FACILITY_CATEGORY_LABELS: Record<FacilityCategory, string> = {
  HOSPITAL_CAT_1: "Hospital Category 1",
  HOSPITAL_CAT_2: "Hospital Category 2",
  HOSPITAL_CAT_3: "Hospital Category 3",
  DENTAL_CARE: "Dental Care",
  FAMILY_MEDICINE: "Family Medicine",
  CLINICAL_LAB: "Clinical Laboratory",
  BLOOD_BANK: "Blood Bank",
  DIAGNOSTIC_CENTER: "Diagnostic Center",
  MATERNITY_HOME: "Maternity Home",
  EYE_HOSPITAL: "Eye Hospital",
  OTHER: "Other",
};

export const FREQUENCY_LABELS: Record<IndicatorFrequency, string> = {
  WEEKLY: "Weekly",
  BIMONTHLY: "Bi-Monthly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  HALF_YEARLY: "Half Yearly",
  YEARLY: "Yearly",
  ONE_TIME: "One Time",
};

export const COMPLIANCE_STATUS_LABELS: Record<ComplianceStatus, string> = {
  COMPLIANT: "Compliant",
  NON_COMPLIANT: "Non-Compliant",
  PARTIALLY_COMPLIANT: "Partially Compliant",
  NOT_ASSESSED: "Not Assessed",
  IN_PROGRESS: "In Progress",
};

export const COMPLIANCE_STATUS_COLORS: Record<ComplianceStatus, string> = {
  COMPLIANT: "bg-green-100 text-green-800",
  NON_COMPLIANT: "bg-red-100 text-red-800",
  PARTIALLY_COMPLIANT: "bg-yellow-100 text-yellow-800",
  NOT_ASSESSED: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
};

export const REGX_NAV_ITEMS = [
  { label: "Dashboard", href: "/regx", icon: "LayoutDashboard" },
  { label: "All Facilities", href: "/regx/facilities", icon: "Building2" },
  { label: "All Users", href: "/regx/users", icon: "Users" },
  { label: "Reports", href: "/regx/reports", icon: "FileBarChart" },
  { label: "Settings", href: "/regx/settings", icon: "Settings" },
];

export const ADMIN_NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { label: "My Facility", href: "/admin/facility", icon: "Building2" },
  { label: "Indicators", href: "/admin/indicators", icon: "ClipboardList" },
  { label: "MSDS Team", href: "/admin/team", icon: "Users" },
  { label: "Reports", href: "/admin/reports", icon: "FileBarChart" },
  { label: "Settings", href: "/admin/settings", icon: "Settings" },
];

export const FOCAL_NAV_ITEMS = [
  { label: "Dashboard", href: "/focal", icon: "LayoutDashboard" },
  { label: "Questionnaires", href: "/focal/questionnaires", icon: "ClipboardList" },
  { label: "Evidence Upload", href: "/focal/evidence", icon: "Upload" },
  { label: "Drills & Activities", href: "/focal/drills", icon: "Activity" },
  { label: "My Submissions", href: "/focal/submissions", icon: "FileCheck" },
];
