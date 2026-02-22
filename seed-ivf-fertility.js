#!/usr/bin/env node
// seed-ivf-fertility.js - Seed IVF/Fertility Centers MSDS Guidelines
// Run: cd /var/www/phc && node seed-ivf-fertility.js

const { Client } = require("pg");
const DB_URL = "postgresql://phc_admin:PhcMsds2026Secure@localhost:5432/phc_db";

// ═══════════════════════════════════════════════════════════════
// IVF & FERTILITY CENTERS
// Source: MSDS and Reference Manual for IVF and Fertility Centers
// Document Code: CG-27IVF-GL-Ed1-160523
// 
// Structure: Guidelines-based (not numbered indicators like other MSDS)
// Mapped to: 15 Standards, 78 Indicators across 8 functional areas
// Applies to 3 Levels: Level I (Consultation), Level II (IUI), Level III (IVF/ICSI)
// ═══════════════════════════════════════════════════════════════

const IVF_FERTILITY = {
  category: "OTHER",
  prefix: "IVF",
  areas: [
    // ─── 1. GENERAL REGULATIONS & ETHICS (ROM) ───
    { code: "ROM", name: "Responsibilities of Management", standards: [
      { code: "ROM-1", title: "The IVF/Fertility Centre is licensed and operates within regulatory framework", indicators: [
        { num: 1, title: "The Centre has obtained all relevant licenses and permissions from governmental and regulatory bodies including PHC", w: 100, freq: "YEARLY" },
        { num: 2, title: "Licenses are visibly displayed at the Centre", w: 100, freq: "ONE_TIME" },
        { num: 3, title: "If within a larger HCE, ART services are declared in scope of services and reflected in license", w: 100, freq: "YEARLY" },
        { num: 4, title: "The Centre has a certificate/license from PHC depicting the authorized Level of service (I, II or III)", w: 100, freq: "YEARLY" },
        { num: 5, title: "The Centre operates within the authorized Level and does not provide services beyond its certification", w: 100, freq: "QUARTERLY" },
      ]},
      { code: "ROM-2", title: "The Centre operates in compliance with ethical and legal requirements", indicators: [
        { num: 6, title: "IVF procedures involve only legally married heterosexual couples as per Sharia Laws", w: 100, freq: "MONTHLY" },
        { num: 7, title: "Sperm must be from the husband and eggs from the wife only - no donated gametes", w: 100, freq: "MONTHLY" },
        { num: 8, title: "Surrogacy is not practiced at the Centre", w: 100, freq: "YEARLY" },
        { num: 9, title: "Maximum allowed ART cycles per year is three per couple", w: 100, freq: "QUARTERLY" },
        { num: 10, title: "Maximum allowed ovulation induction trials per year with gonadotropins is six", w: 100, freq: "QUARTERLY" },
        { num: 11, title: "Appropriate number of embryos transferred (commonly two to three)", w: 100, freq: "MONTHLY" },
      ]},
      { code: "ROM-3", title: "Internal policies and procedures are established and maintained", indicators: [
        { num: 12, title: "All internal policies and procedures for ART services are developed and documented", w: 100, freq: "YEARLY" },
        { num: 13, title: "Copies of policies and procedures are available in the Centre and staff are knowledgeable", w: 100, freq: "YEARLY" },
        { num: 14, title: "Patients/clients are provided guidance and counselling about the policies and procedures", w: 100, freq: "MONTHLY" },
        { num: 15, title: "Centre has an emergency plan to protect fresh and cryopreserved human tissue in emergencies", w: 100, freq: "YEARLY" },
      ]},
    ]},

    // ─── 2. STRUCTURAL CONSIDERATIONS & FACILITY MANAGEMENT (FMS) ───
    { code: "FMS", name: "Facility Management and Safety", standards: [
      { code: "FMS-1", title: "The Centre has appropriate structural plan and infrastructure per its Level", indicators: [
        { num: 16, title: "Building meets local construction standards and relevant laws/regulations", w: 100, freq: "ONE_TIME" },
        { num: 17, title: "Punjab Hospital Waste Management Rules 2014 are implemented and observable", w: 100, freq: "QUARTERLY" },
        { num: 18, title: "Current/updated relevant laws, regulations and rules are available as evidence", w: 100, freq: "YEARLY" },
        { num: 19, title: "IVF Unit ideally on ground floor; if upper floor, stretcher-carrying lift available", w: 100, freq: "ONE_TIME" },
        { num: 20, title: "Waiting areas in enclosed private area, divided for gender separation", w: 100, freq: "ONE_TIME" },
        { num: 21, title: "Consultation timings clearly displayed in reception area", w: 100, freq: "ONE_TIME" },
        { num: 22, title: "Suggestion box/QR code for patient feedback available", w: 80, freq: "ONE_TIME" },
      ]},
      { code: "FMS-2", title: "The Centre has required clinical areas per its Level of service", indicators: [
        { num: 23, title: "IVF Laboratory available with sample withdrawal room, sperm treatment room, freezing room, embryology lab, store room (Level III mandatory)", w: 100, freq: "YEARLY" },
        { num: 24, title: "Andrology Laboratory available (Level II and III mandatory)", w: 100, freq: "YEARLY" },
        { num: 25, title: "IUI Procedure Room available (Level II and III mandatory)", w: 100, freq: "YEARLY" },
        { num: 26, title: "Male and female toilets available", w: 100, freq: "ONE_TIME" },
        { num: 27, title: "Isolated examination room available ensuring privacy and confidentiality", w: 100, freq: "ONE_TIME" },
        { num: 28, title: "IVF Procedure Room with oocyte collection and re-implantation capability (Level III mandatory)", w: 100, freq: "YEARLY" },
        { num: 29, title: "Recovery areas with bays for linen and resuscitation trolley available", w: 100, freq: "YEARLY" },
        { num: 30, title: "Storage space/room for clean and dirty utilities", w: 100, freq: "ONE_TIME" },
      ]},
      { code: "FMS-3", title: "Sterilization and infection prevention facilities are adequate", indicators: [
        { num: 31, title: "Sterilization/packing room with one-way instrument flow, good lighting, ventilation", w: 100, freq: "YEARLY" },
        { num: 32, title: "Non-slippery impermeable flooring in sterilization area", w: 100, freq: "ONE_TIME" },
        { num: 33, title: "Documented IPC Policy based on prescribed standards", w: 100, freq: "YEARLY" },
      ]},
      { code: "FMS-4", title: "Fire and non-fire emergency arrangements are in place", indicators: [
        { num: 34, title: "Plan for fire and non-fire emergencies including early detection (smoke detectors, CCTV)", w: 100, freq: "YEARLY" },
        { num: 35, title: "Fire extinguishers installed and maintained", w: 100, freq: "QUARTERLY" },
        { num: 36, title: "Emergency exit points with 24/7 illuminated signboards, no obstructions", w: 100, freq: "ONE_TIME" },
        { num: 37, title: "Regular mock drills conducted in different shifts and sections", w: 100, freq: "YEARLY" },
        { num: 38, title: "Staff trained for dealing with fire emergencies", w: 100, freq: "HALF_YEARLY" },
        { num: 39, title: "Emergency and Disaster Management Policy documented with designated team", w: 100, freq: "YEARLY" },
        { num: 40, title: "Measures to safeguard fresh and cryopreserved human tissue during emergencies", w: 100, freq: "YEARLY" },
        { num: 41, title: "Measures to safeguard critical equipment and records during emergencies", w: 100, freq: "YEARLY" },
      ]},
      { code: "FMS-5", title: "Laboratory design meets quality and safety standards", indicators: [
        { num: 42, title: "Embryology laboratory has adequate space and is close to operating room", w: 100, freq: "ONE_TIME" },
        { num: 43, title: "Lab ensures aseptic handling of gametes, zygotes and embryos during all phases", w: 100, freq: "MONTHLY" },
        { num: 44, title: "Access to laboratory limited to authorized personnel only", w: 100, freq: "MONTHLY" },
        { num: 45, title: "Separate office space for administrative work and record keeping", w: 100, freq: "ONE_TIME" },
        { num: 46, title: "General wet area for washing/sterilization is separate from embryo laboratory", w: 100, freq: "ONE_TIME" },
      ]},
    ]},

    // ─── 3. HUMAN RESOURCE / STAFFING (HRM) ───
    { code: "HRM", name: "Human Resource Management", standards: [
      { code: "HRM-1", title: "Qualified medical professionals are appointed per the Centre's Level", indicators: [
        { num: 47, title: "Medical Director/Specialist Gynecologist-Obstetrician with FCPS/equivalent and 3 years IVF experience appointed", w: 100, freq: "YEARLY" },
        { num: 48, title: "Andrology and Infertility Specialist available (desirable for Level III)", w: 80, freq: "YEARLY" },
        { num: 49, title: "Anesthesia Specialist with 3-year post-PG experience available (mandatory for Level III)", w: 100, freq: "YEARLY" },
        { num: 50, title: "Laboratory Director/Senior Embryologist with 5-year experience appointed (Level III)", w: 100, freq: "YEARLY" },
        { num: 51, title: "Registered nurses including operating room nurse available per Level", w: 100, freq: "YEARLY" },
        { num: 52, title: "Anesthesia technician with diploma and 5 years experience available", w: 100, freq: "YEARLY" },
        { num: 53, title: "Counsellor/Doctor available to assist patients with ART implications", w: 80, freq: "YEARLY" },
      ]},
      { code: "HRM-2", title: "Staff training and records are maintained", indicators: [
        { num: 54, title: "Staff trained by biomedical engineer or company expert for safe equipment operation", w: 100, freq: "YEARLY" },
        { num: 55, title: "Evidence of staff training for safety documented", w: 100, freq: "YEARLY" },
        { num: 56, title: "Personal file maintained for each employee with qualifications, JDs, reporting relationships", w: 100, freq: "YEARLY" },
        { num: 57, title: "Annual performance evaluation conducted and documented", w: 100, freq: "YEARLY" },
        { num: 58, title: "Naming list of all employees at the Centre maintained", w: 100, freq: "YEARLY" },
      ]},
    ]},

    // ─── 4. INFORMATION MANAGEMENT / MEDICAL RECORDS (IMS) ───
    { code: "IMS", name: "Information Management System", standards: [
      { code: "IMS-1", title: "Complete and accurate medical records are maintained for all patients", indicators: [
        { num: 59, title: "Patient ID card maintained with name, logo, spouse photos, nationality, CNIC/passport, file number, visit dates, physician name", w: 100, freq: "MONTHLY" },
        { num: 60, title: "Reception record with registration date, names, DOB, address, ID copies, marriage contract, photos", w: 100, freq: "MONTHLY" },
        { num: 61, title: "Laboratory record with sperm characteristics, sample collection details, codes, recipient signatures, test results, ova/embryo data", w: 100, freq: "MONTHLY" },
        { num: 62, title: "Medical files with health condition, medical history, hereditary diseases, clinical tests, technique details, progress notes", w: 100, freq: "MONTHLY" },
        { num: 63, title: "All laboratory records signed by recorder and approved by Laboratory Director", w: 100, freq: "MONTHLY" },
        { num: 64, title: "Storeroom record with equipment inventory, solutions, expiration dates, furniture data", w: 100, freq: "QUARTERLY" },
      ]},
    ]},

    // ─── 5. EQUIPMENT MANAGEMENT (FMS/EQP) ───
    { code: "EQP", name: "Equipment Management", standards: [
      { code: "EQP-1", title: "Equipment selection, procurement and maintenance follows guidelines", indicators: [
        { num: 65, title: "Equipment selection per scope of service with participatory procurement committee", w: 100, freq: "YEARLY" },
        { num: 66, title: "SOPs for procurement and selection periodically reviewed and implemented", w: 100, freq: "YEARLY" },
        { num: 67, title: "Records of inspection, calibration and periodic preventive maintenance per OEM guidelines", w: 100, freq: "QUARTERLY" },
        { num: 68, title: "SOPs for usage, cleanliness and cross-infection prevention of devices and equipment", w: 100, freq: "QUARTERLY" },
        { num: 69, title: "Essential equipment available per Level: embryology lab (AHU, LFC, incubators, microscopes, micromanipulators, heat plates)", w: 100, freq: "YEARLY" },
        { num: 70, title: "Essential equipment for andrology lab available (LFC, microscope, centrifuge, block heater)", w: 100, freq: "YEARLY" },
      ]},
    ]},

    // ─── 6. QUALITY MANAGEMENT & ASSURANCE (QA) ───
    { code: "QA", name: "Quality Management and Assurance", standards: [
      { code: "QA-1", title: "Quality management system is in place for laboratory and clinical operations", indicators: [
        { num: 71, title: "All lab procedures include unique patient and gamete/zygote/embryo identification while retaining confidentiality", w: 100, freq: "MONTHLY" },
        { num: 72, title: "Updated detailed manuals for all procedures available in laboratory", w: 100, freq: "YEARLY" },
        { num: 73, title: "Written, signed and dated protocols exist for every laboratory procedure", w: 100, freq: "YEARLY" },
        { num: 74, title: "Written procedures for dealing with incorrect identification, non-compliance, emergencies and adverse events", w: 100, freq: "YEARLY" },
        { num: 75, title: "Laboratory and clinical results regularly updated, summarized, discussed and available to staff", w: 100, freq: "QUARTERLY" },
        { num: 76, title: "Log book maintained for regular evaluation of results including individual operator performance", w: 100, freq: "MONTHLY" },
      ]},
      { code: "QA-2", title: "Quality control monitoring is systematic and documented", indicators: [
        { num: 77, title: "Previous fertilization rates reviewed and monitored", w: 100, freq: "QUARTERLY" },
        { num: 78, title: "Embryo quality checked before transfer", w: 100, freq: "MONTHLY" },
        { num: 79, title: "Pregnancy rates examined (biochemical and clinical)", w: 100, freq: "QUARTERLY" },
        { num: 80, title: "Multiple pregnancy rates monitored to control quality", w: 100, freq: "QUARTERLY" },
        { num: 81, title: "Implantation rates and overall success rates tracked", w: 100, freq: "QUARTERLY" },
        { num: 82, title: "CME programmes for employee skill development maintained", w: 100, freq: "HALF_YEARLY" },
        { num: 83, title: "Medical equipment availability and regular maintenance verified", w: 100, freq: "QUARTERLY" },
        { num: 84, title: "SOPs internally developed and regularly updated", w: 100, freq: "YEARLY" },
        { num: 85, title: "Periodic reports submitted by the Centre regularly", w: 100, freq: "QUARTERLY" },
        { num: 86, title: "Sterilization and disinfection quality maintained per standards", w: 100, freq: "MONTHLY" },
        { num: 87, title: "Storage of unfertilized ova and sperms is safe per guidelines", w: 100, freq: "MONTHLY" },
        { num: 88, title: "Customer satisfaction surveys conducted per Committee format", w: 80, freq: "QUARTERLY" },
      ]},
      { code: "QA-3", title: "Laboratory safety standards are maintained", indicators: [
        { num: 89, title: "Laboratory air quality controlled with HEPA filters, activated charcoal, positive pressure, temperature/humidity control", w: 100, freq: "MONTHLY" },
        { num: 90, title: "Laboratory equipment adequate, easy to clean/disinfect, critical items alarmed and monitored", w: 100, freq: "QUARTERLY" },
        { num: 91, title: "Automatic emergency generator backup for power failure in place", w: 100, freq: "QUARTERLY" },
        { num: 92, title: "Minimum two incubators with gas cylinders in separate room and automatic backup system", w: 100, freq: "YEARLY" },
        { num: 93, title: "Records of ordinary and extraordinary maintenance on all equipment documented and retained", w: 100, freq: "QUARTERLY" },
        { num: 94, title: "Instruction manual for every instrument available in laboratory", w: 100, freq: "YEARLY" },
        { num: 95, title: "Written instructions for equipment failure actions available to all staff", w: 100, freq: "YEARLY" },
      ]},
      { code: "QA-4", title: "Sentinel events and risk management processes are established", indicators: [
        { num: 96, title: "Sentinel events defined and intensively analysed when they occur", w: 100, freq: "QUARTERLY" },
        { num: 97, title: "Risk register maintained with adverse event reporting and risk prediction", w: 100, freq: "QUARTERLY" },
        { num: 98, title: "Testing process monitored with defined critical performance levels and thresholds", w: 100, freq: "QUARTERLY" },
      ]},
    ]},

    // ─── 7. INFECTION PREVENTION & CONTROL (IPC) ───
    { code: "IPC", name: "Infection Prevention and Control", standards: [
      { code: "IPC-1", title: "Infection prevention policies and screening protocols are in place", indicators: [
        { num: 99, title: "Staff vaccinated against Hepatitis B and other viral diseases", w: 100, freq: "YEARLY" },
        { num: 100, title: "Patients screened for HIV, Hepatitis B/C and STDs before processing or cryopreservation", w: 100, freq: "MONTHLY" },
        { num: 101, title: "All samples treated as potentially infectious with universal precautions", w: 100, freq: "MONTHLY" },
        { num: 102, title: "HIV/Hepatitis B or C positive cases treated only in labs with dedicated areas and safety measures", w: 100, freq: "MONTHLY" },
        { num: 103, title: "Protective measures documented and followed: staff hygiene, lab clothing, gloves, masks, eye protection", w: 100, freq: "MONTHLY" },
        { num: 104, title: "Disposable materials discarded properly, sharps in special containers, no food/drinks in lab", w: 100, freq: "MONTHLY" },
      ]},
    ]},

    // ─── 8. PATIENT RIGHTS, CONSENT & EDUCATION (PRE) ───
    { code: "PRE", name: "Patient Rights and Education", standards: [
      { code: "PRE-1", title: "Health information and informed consent processes are established", indicators: [
        { num: 105, title: "Detailed explanation of ART techniques and potential negative effects provided to couple", w: 100, freq: "MONTHLY" },
        { num: 106, title: "Financial/cost implications of ART communicated to patients", w: 100, freq: "MONTHLY" },
        { num: 107, title: "Conception success rates for similar cases at the Centre shared with patients", w: 100, freq: "MONTHLY" },
        { num: 108, title: "All legal aspects related to ART procedures explained", w: 100, freq: "MONTHLY" },
        { num: 109, title: "Preservation feasibility and conditions explained including disposal of surplus fertilized ova", w: 100, freq: "MONTHLY" },
        { num: 110, title: "Written informed consent obtained from both husband and wife for ART procedures", w: 100, freq: "MONTHLY" },
        { num: 111, title: "Written consent obtained for embryo transfer, sperm injection, and cryopreservation", w: 100, freq: "MONTHLY" },
        { num: 112, title: "Confidentiality of all patient information ensured - not disclosed except to couple or judicial authority", w: 100, freq: "MONTHLY" },
        { num: 113, title: "Medical history of both spouses including hereditary diseases evaluated before ART", w: 100, freq: "MONTHLY" },
      ]},
    ]},

    // ─── HANDLING & IDENTIFICATION (COP) ───
    { code: "COP", name: "Care of Patients", standards: [
      { code: "COP-1", title: "Patient and specimen identification protocols ensure safety", indicators: [
        { num: 114, title: "Embryologist checks patient has signed consent form before any procedure", w: 100, freq: "MONTHLY" },
        { num: 115, title: "Clinical and serological examination checked for viral positivity before IVF treatment", w: 100, freq: "MONTHLY" },
        { num: 116, title: "Written procedures describing all phases of IVF techniques including protocols and equipment lists", w: 100, freq: "YEARLY" },
        { num: 117, title: "Patient identity verification performed at critical steps: ovum pickup, semen recovery, insemination/ICSI, cryopreservation, embryo transfer", w: 100, freq: "MONTHLY" },
        { num: 118, title: "Double checks at insemination of oocytes, replacement of embryos, freezing and thawing", w: 100, freq: "MONTHLY" },
        { num: 119, title: "Documentation of all critical steps in each patient's file with laboratory person identity, date and time", w: 100, freq: "MONTHLY" },
      ]},
      { code: "COP-2", title: "Cryopreservation facilities and protocols meet standards", indicators: [
        { num: 120, title: "Cryopreservation techniques and facilities available for gametes, zygotes and embryos", w: 100, freq: "YEARLY" },
        { num: 121, title: "System in place for detection of low liquid nitrogen levels and high nitrogen levels in air", w: 100, freq: "MONTHLY" },
        { num: 122, title: "Contaminated specimens stored in high-security cryo straws and dedicated tanks", w: 100, freq: "MONTHLY" },
      ]},
      { code: "COP-3", title: "Centre data collection and reporting is maintained", indicators: [
        { num: 123, title: "Number of IVF patients with diagnosis and previous cycle counts maintained", w: 100, freq: "QUARTERLY" },
        { num: 124, title: "Cycle cancellation data with reasons documented", w: 100, freq: "QUARTERLY" },
        { num: 125, title: "Pregnancy rates (biochemical, clinical, singleton, multiple) tracked", w: 100, freq: "QUARTERLY" },
        { num: 126, title: "OHSS rates and other complications documented", w: 100, freq: "QUARTERLY" },
      ]},
    ]},
  ],
};

// ═══════════════════════════════════════════════════════════════
// SEED FUNCTION
// ═══════════════════════════════════════════════════════════════
async function seedDocument(client, doc) {
  let standardCount = 0;
  let indicatorCount = 0;
  const now = new Date().toISOString();

  for (const area of doc.areas) {
    for (const std of area.standards) {
      const stdCode = `${doc.prefix}-${std.code}`;
      const stdId = `msds-${doc.prefix.toLowerCase()}-${std.code.toLowerCase()}`;

      await client.query(
        `INSERT INTO "MsdsStandard" (id, code, title, description, category, chapter, section, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (code) DO UPDATE SET title = $3, description = $4, category = $5, "updatedAt" = $9`,
        [stdId, stdCode, `${std.code}: ${std.title}`, std.title, doc.category, area.code, area.name, now, now]
      );
      standardCount++;

      for (const ind of std.indicators) {
        const indCode = `${doc.prefix}-IND-${String(ind.num).padStart(3, "0")}`;
        const indId = `msds-${doc.prefix.toLowerCase()}-ind-${String(ind.num).padStart(3, "0")}`;

        await client.query(
          `INSERT INTO "Indicator" (id, code, title, description, guidance, frequency, "requiresEvidence", "requiresPhoto", "requiresDocument", "dataType", "standardId", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (code) DO UPDATE SET title = $3, description = $4, frequency = $6, "standardId" = $11, "updatedAt" = $13`,
          [
            indId, indCode, ind.title,
            `Indicator ${ind.num} under ${std.code} (${area.name}). Weightage: ${ind.w}%. IVF/Fertility Centre Guidelines.`,
            `Assessment frequency: ${ind.freq}. Compliance weightage: ${ind.w}%. Applicable to IVF Centre Levels as per checklist.`,
            ind.freq, true, false, true, "scoring", stdId, now, now,
          ]
        );
        indicatorCount++;
      }
    }
  }
  return { standardCount, indicatorCount };
}

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log("Connected to database.\n");

  console.log("═══ Seeding IVF & FERTILITY CENTERS ═══");
  const ivf = await seedDocument(client, IVF_FERTILITY);
  console.log(`  Standards: ${ivf.standardCount}, Indicators: ${ivf.indicatorCount}\n`);

  // Verify totals across all categories
  const stdCount = await client.query('SELECT COUNT(*) FROM "MsdsStandard"');
  const indCount = await client.query('SELECT COUNT(*) FROM "Indicator"');
  const byCat = await client.query('SELECT category, COUNT(*) as standards FROM "MsdsStandard" GROUP BY category ORDER BY category');
  const indByCat = await client.query(`
    SELECT s.category, COUNT(i.id) as indicators 
    FROM "Indicator" i JOIN "MsdsStandard" s ON i."standardId" = s.id 
    GROUP BY s.category ORDER BY s.category
  `);

  console.log("════════════════════════════════════════");
  console.log("DATABASE TOTALS:");
  console.log(`  MsdsStandard: ${stdCount.rows[0].count}`);
  console.log(`  Indicator: ${indCount.rows[0].count}`);
  console.log("\nBy Category (Standards | Indicators):");
  
  const catMap = {};
  byCat.rows.forEach(r => { catMap[r.category] = { std: r.standards, ind: 0 }; });
  indByCat.rows.forEach(r => { if (catMap[r.category]) catMap[r.category].ind = r.indicators; });
  Object.entries(catMap).forEach(([cat, data]) => {
    console.log(`  ${cat}: ${data.std} standards, ${data.ind} indicators`);
  });
  console.log("════════════════════════════════════════");

  await client.end();
}

main().catch((e) => { console.error("Error:", e); process.exit(1); });
