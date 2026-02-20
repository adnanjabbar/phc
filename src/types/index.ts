import { UserRole, FacilityCategory, IndicatorFrequency, ComplianceStatus } from "@prisma/client";

export interface UserSession {
  id: string;
  email: string;
  name: string;
  username: string;
  role: UserRole;
  facilityId: string | null;
}

export interface FacilityData {
  id: string;
  name: string;
  category: FacilityCategory;
  registrationNo: string;
  address: string;
  city: string;
  district: string;
  province: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  bedCount: number | null;
  isActive: boolean;
  adminId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserData {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  facilityId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IndicatorData {
  id: string;
  code: string;
  title: string;
  description: string;
  guidance: string;
  frequency: IndicatorFrequency;
  requiresEvidence: boolean;
  requiresPhoto: boolean;
  requiresDocument: boolean;
  dataType: string;
  standardId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FacilityIndicatorData {
  id: string;
  status: ComplianceStatus;
  lastAssessedAt: Date | null;
  nextDueDate: Date | null;
  notes: string | null;
  facilityId: string;
  indicatorId: string;
  indicator?: IndicatorData;
}

export interface DashboardStats {
  totalFacilities?: number;
  totalUsers?: number;
  overallComplianceScore?: number;
  facilitiesByCategory?: Record<string, number>;
  facilityComplianceScore?: number;
  totalIndicators?: number;
  compliantCount?: number;
  nonCompliantCount?: number;
  notAssessedCount?: number;
  pendingIndicators?: number;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export type { UserRole, FacilityCategory, IndicatorFrequency, ComplianceStatus };
