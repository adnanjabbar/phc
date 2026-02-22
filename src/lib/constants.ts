export const FACILITY_CATEGORY_LABELS: Record<string, string> = {
  HOSPITAL_CAT_1: "Hospital (Cat-I, 50+ beds)",
  HOSPITAL_CAT_2: "Hospital (Cat-II, 16-50 beds)",
  HOSPITAL_CAT_3: "Hospital (Cat-III, up to 15 beds)",
  DENTAL_CARE: "Dental Clinic",
  FAMILY_MEDICINE: "GP / Family Medicine Clinic",
  CLINICAL_LAB: "Clinical Laboratory",
  BLOOD_BANK: "Blood Bank",
  DIAGNOSTIC_CENTER: "Diagnostic Center",
  MATERNITY_HOME: "Maternity Home",
  EYE_HOSPITAL: "Eye Hospital",
  DIALYSIS: "Dialysis Facility",
  PSYCHIATRIC: "Psychiatric / Addiction Treatment",
  IVF_FERTILITY: "IVF / Fertility Centre",
  COLLECTION_CENTER: "Collection Centre",
  HOMEOPATHIC: "Homeopathic Clinic",
  RADIOLOGICAL: "Radiological Diagnostic Centre",
  BHU: "Basic Health Unit (BHU)",
  OTHER: "Other",
};

export const MSDS_CATEGORY_MAP: Record<string, string> = {
  HOSPITAL_CAT_1: "HOSPITAL_CAT_1",
  HOSPITAL_CAT_2: "HOSPITAL_CAT_1",
  HOSPITAL_CAT_3: "HOSPITAL_CAT_1",
  DENTAL_CARE: "DENTAL_CARE",
  DIALYSIS: "DIAGNOSTIC_CENTER",
  PSYCHIATRIC: "OTHER",
  IVF_FERTILITY: "OTHER",
  CLINICAL_LAB: "CLINICAL_LAB",
  DIAGNOSTIC_CENTER: "DIAGNOSTIC_CENTER",
  FAMILY_MEDICINE: "FAMILY_MEDICINE",
  BLOOD_BANK: "BLOOD_BANK",
  MATERNITY_HOME: "MATERNITY_HOME",
  EYE_HOSPITAL: "EYE_HOSPITAL",
  COLLECTION_CENTER: "COLLECTION_CENTER",
  HOMEOPATHIC: "HOMEOPATHIC",
  RADIOLOGICAL: "RADIOLOGICAL",
  BHU: "BHU",
  OTHER: "OTHER",
};

export const APPROVAL_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
};

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  FACILITY_REGISTRATION: "Facility Registration",
  ANNUAL_SUBSCRIPTION: "Annual Subscription",
  TRAINING_FEE: "Training Fee",
  CONSULTANT_FEE: "Consultant Fee",
  PENALTY: "Penalty",
  OTHER: "Other",
};

export const SUBSCRIPTION_PLANS = {
  standard: { name: "Standard", price: 50000, features: ["MSDS Compliance Tracking", "Self-Assessment Tools", "Basic Reporting"] },
  professional: { name: "Professional", price: 100000, features: ["Everything in Standard", "Consultant Support", "Advanced Analytics", "Priority Training Access"] },
  enterprise: { name: "Enterprise", price: 200000, features: ["Everything in Professional", "Dedicated Consultant", "Custom Reporting", "API Access", "White-label"] },
};

export const ROLE_LABELS: Record<string, string> = {
  REGX: "RegX Super Admin",
  ADMIN: "Facility Admin",
  MSDS_FOCAL: "MSDS Focal Person",
  CONSULTANT: "PHC Consultant",
};

export const COMPLIANCE_STATUS_LABELS: Record<string, string> = {
  COMPLIANT: "Compliant",
  NON_COMPLIANT: "Non-Compliant",
  PARTIALLY_COMPLIANT: "Partially Compliant",
  NOT_ASSESSED: "Not Assessed",
  IN_PROGRESS: "In Progress",
};
