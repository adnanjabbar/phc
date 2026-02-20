"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FACILITY_CATEGORY_LABELS } from "@/lib/constants";

interface FormData {
  fullName: string;
  email: string;
  username: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: "ADMIN" | "MSDS_FOCAL" | "";
  acceptTerms: boolean;
  // Admin fields
  facilityName: string;
  facilityCategory: string;
  registrationNo: string;
  address: string;
  city: string;
  district: string;
  bedCount: string;
  // Focal fields
  facilityCode: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: "", email: "", username: "", phone: "",
    password: "", confirmPassword: "", role: "", acceptTerms: false,
    facilityName: "", facilityCategory: "", registrationNo: "",
    address: "", city: "", district: "", bedCount: "", facilityCode: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validate = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.fullName) newErrors.fullName = "Full name is required";
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Valid email is required";
    if (!formData.username || formData.username.length < 3) newErrors.username = "Username must be at least 3 characters";
    if (!formData.password || formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (!formData.role) newErrors.role = "Please select a role";
    if (!formData.acceptTerms) newErrors.acceptTerms = "You must accept terms & conditions";
    if (formData.role === "ADMIN") {
      if (!formData.facilityName) newErrors.facilityName = "Facility name is required";
      if (!formData.facilityCategory) newErrors.facilityCategory = "Category is required";
      if (!formData.registrationNo) newErrors.registrationNo = "Registration number is required";
      if (!formData.address) newErrors.address = "Address is required";
      if (!formData.city) newErrors.city = "City is required";
      if (!formData.district) newErrors.district = "District is required";
    }
    if (formData.role === "MSDS_FOCAL" && !formData.facilityCode) {
      newErrors.facilityCode = "Facility registration code is required";
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const categoryOptions = Object.entries(FACILITY_CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-10 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
        <p className="text-gray-500">Your account has been created. Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-primary-800 to-teal-700 p-8 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">PHC MSDS Compliance</h1>
            <p className="text-primary-200 text-sm">Create your account</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name *" placeholder="Enter full name" value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                error={errors.fullName} />
              <Input label="Email *" type="email" placeholder="Enter email" value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email} />
              <Input label="Username *" placeholder="Choose username" value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                error={errors.username} />
              <Input label="Phone" type="tel" placeholder="Phone number" value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <Input label="Password *" type={showPassword ? "text" : "password"} placeholder="Min 8 characters"
                  value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  error={errors.password} />
                <button type="button" className="absolute right-3 top-8 text-gray-400" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Input label="Confirm Password *" type="password" placeholder="Repeat password"
                value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                error={errors.confirmPassword} />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Role</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(["ADMIN", "MSDS_FOCAL"] as const).map((role) => (
                <label key={role} className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${formData.role === role ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="radio" name="role" value={role} checked={formData.role === role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as "ADMIN" | "MSDS_FOCAL" })}
                    className="mt-1 text-primary-600" />
                  <div>
                    <p className="font-medium text-gray-900">{role === "ADMIN" ? "Facility Administrator" : "MSDS Focal Person"}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{role === "ADMIN" ? "Manage your healthcare facility" : "Fill questionnaires & upload evidence"}</p>
                  </div>
                </label>
              ))}
            </div>
            {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
          </div>

          {formData.role === "ADMIN" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Facility Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Facility Name *" placeholder="Hospital/clinic name" value={formData.facilityName}
                  onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })} error={errors.facilityName} />
                <Select label="Facility Category *" options={categoryOptions} placeholder="Select category"
                  value={formData.facilityCategory}
                  onChange={(e) => setFormData({ ...formData, facilityCategory: e.target.value })}
                  error={errors.facilityCategory} />
                <Input label="Registration Number *" placeholder="PHC registration no." value={formData.registrationNo}
                  onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })} error={errors.registrationNo} />
                <Input label="Bed Count" type="number" placeholder="Number of beds" value={formData.bedCount}
                  onChange={(e) => setFormData({ ...formData, bedCount: e.target.value })} />
                <Input label="Address *" placeholder="Full address" value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })} error={errors.address} />
                <Input label="City *" placeholder="City" value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })} error={errors.city} />
                <Input label="District *" placeholder="District" value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })} error={errors.district} />
              </div>
            </div>
          )}

          {formData.role === "MSDS_FOCAL" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Facility</h3>
              <Input label="Facility Registration Number *" placeholder="Enter facility's registration number"
                value={formData.facilityCode}
                onChange={(e) => setFormData({ ...formData, facilityCode: e.target.value })}
                error={errors.facilityCode} />
              <p className="mt-1 text-xs text-gray-500">Contact your facility admin to get the registration number.</p>
            </div>
          )}

          <div className="flex items-start gap-2">
            <input type="checkbox" id="terms" className="mt-1 rounded border-gray-300 text-primary-600"
              checked={formData.acceptTerms}
              onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })} />
            <label htmlFor="terms" className="text-sm text-gray-600">
              I agree to the <span className="text-primary-600 cursor-pointer hover:underline">Terms & Conditions</span> and <span className="text-primary-600 cursor-pointer hover:underline">Privacy Policy</span>
            </label>
          </div>
          {errors.acceptTerms && <p className="text-xs text-red-600">{errors.acceptTerms}</p>}

          <Button type="submit" className="w-full" isLoading={isLoading}>
            <UserPlus className="w-4 h-4 mr-2" />
            Create Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
