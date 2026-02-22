"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Activity,
  BarChart3,
  ClipboardCheck,
  Building2,
  Users,
  FileText,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Star,
  Menu,
  X,
  Heart,
  Stethoscope,
  TrendingUp,
  Bell,
  Camera,
  Calendar,
} from "lucide-react";

const stats = [
  { label: "Healthcare Facilities", value: "500+", icon: Building2 },
  { label: "MSDS Indicators Tracked", value: "2,000+", icon: ClipboardCheck },
  { label: "Compliance Reports", value: "10,000+", icon: FileText },
  { label: "Healthcare Professionals", value: "1,500+", icon: Users },
];

const features = [
  {
    icon: ClipboardCheck,
    title: "MSDS Compliance Tracking",
    description:
      "Track and fulfill all Minimum Service Delivery Standards with smart questionnaires tailored to your facility category — hospitals, clinics, labs, and more.",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: BarChart3,
    title: "Real-Time Dashboards",
    description:
      "Bird's-eye view of compliance status with interactive charts, graphs, and trend analysis. Know exactly where your facility stands at any moment.",
    color: "from-teal-500 to-teal-600",
  },
  {
    icon: Bell,
    title: "Smart Reminders & Scheduling",
    description:
      "Automated alerts for weekly, monthly, quarterly, and yearly indicators. Never miss a compliance deadline with intelligent scheduling.",
    color: "from-amber-500 to-amber-600",
  },
  {
    icon: Camera,
    title: "Evidence & Documentation",
    description:
      "Upload photos, documents, and records as evidence for each indicator. Complete audit trail with timestamps and user tracking.",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: FileText,
    title: "Automated Report Generation",
    description:
      "Generate comprehensive PDF compliance reports with a single click. Share with stakeholders, inspectors, and regulatory authorities.",
    color: "from-rose-500 to-rose-600",
  },
  {
    icon: Calendar,
    title: "Drill & Activity Management",
    description:
      "Record fire drills, evacuation exercises, code blue drills, and other mandatory activities with photos and participant counts.",
    color: "from-indigo-500 to-indigo-600",
  },
];

const facilityTypes = [
  "Category 1 Hospitals",
  "Category 2 Hospitals",
  "Category 3 Hospitals",
  "Dental Care Facilities",
  "Family Medicine Centers",
  "Clinical Laboratories",
  "Blood Banks",
  "Diagnostic Centers",
  "Maternity Homes",
  "Eye Hospitals",
];

const steps = [
  {
    step: "01",
    title: "Register Your Facility",
    description:
      "Sign up as a facility administrator and register your healthcare establishment with its category and details.",
  },
  {
    step: "02",
    title: "Assign MSDS Focal Person",
    description:
      "Designate your MSDS focal person who will be responsible for documenting and fulfilling compliance criteria.",
  },
  {
    step: "03",
    title: "Complete Assessments",
    description:
      "Your focal person fills out indicator questionnaires, uploads evidence, and records drills based on MSDS requirements.",
  },
  {
    step: "04",
    title: "Monitor & Improve",
    description:
      "Track compliance scores, identify gaps, generate reports, and continuously improve your facility's service delivery standards.",
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* ========== NAVIGATION ========== */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  scrolled
                    ? "bg-gradient-to-br from-blue-600 to-teal-600"
                    : "bg-white/20 backdrop-blur-sm"
                }`}
              >
                <Shield
                  className={`w-6 h-6 ${scrolled ? "text-white" : "text-white"}`}
                />
              </div>
              <div>
                <h1
                  className={`text-lg font-bold transition-colors ${
                    scrolled ? "text-gray-900" : "text-white"
                  }`}
                >
                  PHC MSDS
                </h1>
                <p
                  className={`text-xs transition-colors ${
                    scrolled ? "text-gray-500" : "text-blue-200"
                  }`}
                >
                  Compliance Platform
                </p>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-8">
              <a
                href="#features"
                className={`text-sm font-medium transition-colors hover:text-blue-500 ${
                  scrolled ? "text-gray-600" : "text-white/90"
                }`}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className={`text-sm font-medium transition-colors hover:text-blue-500 ${
                  scrolled ? "text-gray-600" : "text-white/90"
                }`}
              >
                How It Works
              </a>
              <a
                href="#facilities"
                className={`text-sm font-medium transition-colors hover:text-blue-500 ${
                  scrolled ? "text-gray-600" : "text-white/90"
                }`}
              >
                Facilities
              </a>
              <a
                href="#about"
                className={`text-sm font-medium transition-colors hover:text-blue-500 ${
                  scrolled ? "text-gray-600" : "text-white/90"
                }`}
              >
                About
              </a>
            </div>

            {/* Auth Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/login"
                className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  scrolled
                    ? "text-gray-700 hover:bg-gray-100"
                    : "text-white hover:bg-white/10"
                }`}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all shadow-lg shadow-blue-500/25"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className={scrolled ? "text-gray-900" : "text-white"} />
              ) : (
                <Menu className={scrolled ? "text-gray-900" : "text-white"} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl">
            <div className="px-4 py-4 space-y-3">
              <a
                href="#features"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </a>
              <a
                href="#facilities"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Facilities
              </a>
              <a
                href="#about"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </a>
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <Link
                  href="/login"
                  className="block w-full px-4 py-2.5 text-center text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="block w-full px-4 py-2.5 text-center text-white bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ========== HERO SECTION ========== */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-teal-800" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-400 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-400 rounded-full blur-3xl" />
        </div>

        {/* Grid Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 lg:pt-40 pb-20 lg:pb-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
                <Heart className="w-4 h-4 text-rose-400" />
                <span className="text-sm text-blue-100">
                  Punjab Healthcare Commission Approved
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                Elevate Your{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-300">
                  Healthcare
                </span>{" "}
                Compliance
              </h1>

              <p className="text-lg text-blue-100 leading-relaxed mb-8 max-w-lg">
                The comprehensive digital platform for managing Minimum Service
                Delivery Standards (MSDS) across healthcare facilities in
                Punjab. Track indicators, upload evidence, generate reports —
                all in one place.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-blue-900 bg-white rounded-xl hover:bg-blue-50 transition-all shadow-xl shadow-black/10"
                >
                  Register Your Facility
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-all"
                >
                  Sign In to Dashboard
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center gap-6 text-blue-200 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>PHC Approved</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>256-bit Encrypted</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>HIPAA Ready</span>
                </div>
              </div>
            </div>

            {/* Right — Dashboard Preview Card */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Floating Cards */}
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl">
                  {/* Mock Dashboard Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-white/60 text-sm">Facility Dashboard</p>
                      <h3 className="text-white text-xl font-bold">
                        Compliance Overview
                      </h3>
                    </div>
                    <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center">
                      <Activity className="w-5 h-5 text-teal-300" />
                    </div>
                  </div>

                  {/* Mock Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                      {
                        label: "Compliance",
                        value: "87%",
                        color: "text-green-400",
                      },
                      {
                        label: "Indicators",
                        value: "142",
                        color: "text-blue-300",
                      },
                      {
                        label: "Pending",
                        value: "18",
                        color: "text-amber-400",
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="bg-white/5 rounded-xl p-3 text-center"
                      >
                        <p className={`text-2xl font-bold ${s.color}`}>
                          {s.value}
                        </p>
                        <p className="text-white/50 text-xs mt-1">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Mock Progress Bars */}
                  <div className="space-y-3">
                    {[
                      {
                        label: "Patient Safety",
                        pct: 92,
                        color: "bg-green-400",
                      },
                      {
                        label: "Infection Control",
                        pct: 78,
                        color: "bg-blue-400",
                      },
                      {
                        label: "Emergency Services",
                        pct: 85,
                        color: "bg-teal-400",
                      },
                      {
                        label: "Documentation",
                        pct: 65,
                        color: "bg-amber-400",
                      },
                    ].map((bar) => (
                      <div key={bar.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white/70">{bar.label}</span>
                          <span className="text-white/90 font-medium">
                            {bar.pct}%
                          </span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${bar.color} rounded-full transition-all duration-1000`}
                            style={{ width: `${bar.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating notification card */}
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-xl p-4 flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
  PHC Verified Facility
</p>
<p className="text-xs text-gray-500">
  MSDS Category 2
</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 50L48 45.7C96 41.3 192 32.7 288 30.8C384 29 480 34 576 41.2C672 48.3 768 57.7 864 57.5C960 57.3 1056 47.7 1152 43.2C1248 38.7 1344 39.3 1392 39.7L1440 40V100H1392C1344 100 1248 100 1152 100C1056 100 960 100 864 100C768 100 672 100 576 100C480 100 384 100 288 100C192 100 96 100 48 100H0V50Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* ========== STATS BAR ========== */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-xl mb-3">
                  <stat.icon className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-3xl font-extrabold text-gray-900">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section id="features" className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-4">
              <Star className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                Powerful Features
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
              Everything You Need for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-600">
                MSDS Compliance
              </span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              A comprehensive suite of tools designed specifically for
              healthcare facilities to track, manage, and improve their minimum
              service delivery standards.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-100 transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-full mb-4">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-medium text-teal-700">
                Simple Process
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
              Get Compliant in{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">
                Four Simple Steps
              </span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              From registration to full compliance monitoring — our streamlined
              process makes it easy for any healthcare facility.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((item, index) => (
              <div key={item.step} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-blue-200 to-transparent -translate-x-4" />
                )}
                <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl p-8 text-center hover:shadow-lg transition-all">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-600 text-white text-2xl font-extrabold rounded-2xl mb-6 shadow-lg shadow-blue-500/20">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FACILITY TYPES ========== */}
      <section id="facilities" className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-4">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  All Facility Types
                </span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
                Built for{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-600">
                  Every Healthcare
                </span>{" "}
                Facility
              </h2>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                Our platform supports MSDS compliance tracking across all
                categories of healthcare facilities as defined by the Punjab
                Healthcare Commission. Each facility type has its own tailored
                set of indicators and standards.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all shadow-lg shadow-blue-500/25"
              >
                Register Your Facility
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {facilityTypes.map((type, i) => (
                <div
                  key={type}
                  className={`flex items-center gap-3 px-5 py-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all ${
                    i === 0 ? "col-span-2" : ""
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-gray-800 font-medium text-sm">
                    {type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== ABOUT / PHC ========== */}
      <section id="about" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-teal-800 rounded-3xl p-10 lg:p-16 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 rounded-full blur-3xl" />
            </div>
            <div className="relative grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-6">
                  About Punjab Healthcare Commission
                </h2>
                <p className="text-blue-100 leading-relaxed mb-6">
                  The Punjab Healthcare Commission (PHC) is a statutory
                  regulatory body established under the Punjab Healthcare
                  Commission Act 2010 by the Government of Punjab, Pakistan. PHC
                  was created to regulate all healthcare service providers —
                  both public and private — across Punjab province.
                </p>
                <p className="text-blue-100 leading-relaxed mb-8">
                  Its primary mandate is to improve the quality of healthcare
                  delivery through Minimum Service Delivery Standards (MSDS),
                  conducting inspections, and taking enforcement action against
                  facilities that fail to comply. This platform digitizes the
                  entire MSDS compliance workflow.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { label: "Established", value: "2010" },
                    { label: "Province", value: "Punjab, PK" },
                    { label: "Mandate", value: "Quality Assurance" },
                    { label: "Scope", value: "Public & Private" },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-2xl font-bold text-white">
                        {item.value}
                      </p>
                      <p className="text-blue-300 text-sm">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                {[
                  {
                    icon: Shield,
                    title: "Registration & Licensing",
                    desc: "Registers and licenses all healthcare establishments including hospitals, clinics, labs, and diagnostic centers.",
                  },
                  {
                    icon: ClipboardCheck,
                    title: "MSDS Enforcement",
                    desc: "Sets and enforces Minimum Service Delivery Standards that all facilities must meet.",
                  },
                  {
                    icon: Activity,
                    title: "Inspections & Compliance",
                    desc: "Conducts regular inspections and takes enforcement action against non-compliant facilities.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10"
                  >
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-6 h-6 text-teal-300" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">
                        {item.title}
                      </h4>
                      <p className="text-blue-200 text-sm leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CTA SECTION ========== */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
            Ready to Achieve Full{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-600">
              MSDS Compliance
            </span>
            ?
          </h2>
          <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto">
            Join healthcare facilities across Punjab that are already using our
            platform to streamline their compliance management and improve
            patient care quality.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-teal-600 rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all shadow-xl shadow-blue-500/25"
            >
              Register Your Facility
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 text-base font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              Sign In to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">PHC MSDS</h3>
                  <p className="text-gray-500 text-xs">Compliance Platform</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-md mb-6">
                A digital platform for managing Punjab Healthcare Commission
                Minimum Service Delivery Standards. Helping healthcare
                facilities achieve and maintain compliance through streamlined
                tracking, documentation, and reporting.
              </p>
              <p className="text-gray-500 text-xs">
                Powered by{" "}
                <span className="text-teal-400 font-semibold">RegX</span>{" "}
                Healthcare Solutions
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#facilities" className="hover:text-white transition-colors">
                    Supported Facilities
                  </a>
                </li>
                <li>
                  <a href="#about" className="hover:text-white transition-colors">
                    About PHC
                  </a>
                </li>
              </ul>
            </div>

            {/* Account */}
            <div>
              <h4 className="text-white font-semibold mb-4">Account</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="hover:text-white transition-colors">
                    Register Facility
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Support
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} PHC MSDS Compliance Platform. All
              rights reserved.
            </p>
            <p className="text-sm text-gray-600">
              Built with ❤️ for healthcare quality in Punjab, Pakistan
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}