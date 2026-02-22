#!/usr/bin/env node
// seed-dialysis-psychiatric.js - Seed Dialysis and Psychiatric MSDS
// Run: cd /var/www/phc && node seed-dialysis-psychiatric.js

const { Client } = require("pg");
const DB_URL = "postgresql://phc_admin:PhcMsds2026Secure@localhost:5432/phc_db";

// ═══════════════════════════════════════════════════════════════
// DIALYSIS FACILITIES - 37 Standards (each standard = 1 indicator)
// Dialysis uses standards as compliance units directly
// ═══════════════════════════════════════════════════════════════
const DIALYSIS = {
  category: "DIAGNOSTIC_CENTER", // Map to closest existing enum - you may want to add DIALYSIS to enum
  prefix: "DLY",
  areas: [
    { code: "ROM", name: "Responsibilities of Management", standards: [
      { code: "ROM-1", title: "The Dialysis Facility is appropriately located and marked", indicators: [
        { num: 1, title: "Located away from routine public access, accessible via ramps/stairs/lift, board prominently affixed, direction signs appropriately placed, timings displayed", w: 100, freq: "ONE_TIME" },
      ]},
      { code: "ROM-2", title: "The Staff on duty is identifiable", indicators: [
        { num: 2, title: "Staff uses prescribed identity badges, dress code adopted and practiced, name plates on offices/sections affixed", w: 100, freq: "MONTHLY" },
      ]},
      { code: "ROM-3", title: "Qualified and experienced professionals are appointed at the Dialysis Centers", indicators: [
        { num: 3, title: "Appointments of staff are made as described in the qualification requirements section", w: 100, freq: "YEARLY" },
      ]},
      { code: "ROM-4", title: "The management is conversant with and implements the relevant laws and regulations", indicators: [
        { num: 4, title: "Management aware of relevant laws (waste management, hepatitis, clean water, fire safety, building codes), laws kept updated, implementation ensured", w: 100, freq: "YEARLY" },
      ]},
    ]},
    { code: "FMS", name: "Facility Management and Safety", standards: [
      { code: "FMS-1", title: "Dialysis Centre has requisite infrastructure ensuring sufficient space for portrayed services", indicators: [
        { num: 5, title: "Layout comprises reception, waiting area, consultation room, treatment area, dialysis rooms, water treatment room, reprocessing room, toilets, ventilation, AC, UPS/generator, firefighting, storage, waste collection, janitor room. Separate rooms for HBsAg+, HCV+, HIV+ patients", w: 100, freq: "ONE_TIME" },
      ]},
      { code: "FMS-2", title: "Hemodialysis (HD) machines conform to approved specifications", indicators: [
        { num: 6, title: "Dialysis machines conform to specifications approved by competent authority with Conformity Certificate from CAB", w: 100, freq: "YEARLY" },
      ]},
      { code: "FMS-3", title: "Haemodiafiltration (HDF) machines conform to approved specifications", indicators: [
        { num: 7, title: "HDF machines when used conform to approved specifications with Conformity Certificate", w: 100, freq: "YEARLY" },
      ]},
      { code: "FMS-4", title: "Dialysis fluid and Substitution Solution conform to approved specifications", indicators: [
        { num: 8, title: "Quality specifications of dialysis fluid and substitution solution regarding microbes and endotoxins meet approved specifications with Conformity Certificate", w: 100, freq: "HALF_YEARLY" },
      ]},
      { code: "FMS-5", title: "Dialyzer Reprocessing Machine (Optional) conforms to approved specifications", indicators: [
        { num: 9, title: "Dialyzer reprocessing machine when used conforms to approved specifications", w: 100, freq: "YEARLY" },
      ]},
      { code: "FMS-6", title: "A standby/backup for the systems is operational", indicators: [
        { num: 10, title: "Backup systems operational including power backup, backup dialysis machine, water treatment backup", w: 100, freq: "QUARTERLY" },
      ]},
      { code: "FMS-7", title: "Planned Preventive Maintenance Programme for equipment is followed", indicators: [
        { num: 11, title: "Preventive maintenance programme documented and followed for all equipment, maintenance records maintained", w: 100, freq: "QUARTERLY" },
      ]},
      { code: "FMS-8", title: "The water treatment system conforms to approved specifications", indicators: [
        { num: 12, title: "Water treatment system meets ISO 23500 standards, daily chlorine/chloramine testing, 6-monthly microbial testing, 12-monthly chemical analysis, records documented", w: 100, freq: "MONTHLY" },
      ]},
    ]},
    { code: "HRM", name: "Human Resource Management", standards: [
      { code: "HRM-1", title: "Medical professionals providing hemodialysis treatment are appropriately qualified and experienced", indicators: [
        { num: 13, title: "Nephrologist/qualified physician heads the unit, trained nurses and technicians available per standards, staff qualifications verified", w: 100, freq: "YEARLY" },
      ]},
      { code: "HRM-2", title: "Every staff member is screened and managed against infections", indicators: [
        { num: 14, title: "All staff screened for HBV, HCV, HIV on joining and periodically, vaccination records maintained, post-exposure protocols in place", w: 100, freq: "HALF_YEARLY" },
      ]},
    ]},
    { code: "IMS", name: "Information Management System", standards: [
      { code: "IMS-1", title: "Dialysis Unit/Centre maintains complete and accurate medical record of patients", indicators: [
        { num: 15, title: "Patient records with unique ID, complete dialysis records maintained for each session including pre/intra/post dialysis parameters, access records, lab results, medications", w: 100, freq: "MONTHLY" },
      ]},
    ]},
    { code: "QA", name: "Quality Assurance", standards: [
      { code: "QA-1", title: "A Quality Assurance programme ensures consistent conformance to technical standards", indicators: [
        { num: 16, title: "QA programme maintained covering equipment calibration, water quality testing, dialyzer clearance monitoring, infection rates tracking", w: 100, freq: "QUARTERLY" },
      ]},
      { code: "QA-2", title: "Every patient is monitored for intra-dialysis complications", indicators: [
        { num: 17, title: "Patients monitored for hypotension, cramps, nausea, chest pain, fever/chills, access complications. Records maintained for all complications", w: 100, freq: "MONTHLY" },
      ]},
      { code: "QA-3", title: "All untoward incidents are reported and corrective actions taken", indicators: [
        { num: 18, title: "Incident reporting system in place, all untoward incidents reported to controlling authorities, root cause analysis performed, corrective actions documented", w: 100, freq: "QUARTERLY" },
      ]},
    ]},
    { code: "AAC", name: "Access, Assessment and Continuity of Care", standards: [
      { code: "AAC-1", title: "Dialysis Services are provided as portrayed", indicators: [
        { num: 19, title: "Only registered services provided, scope of services displayed, services match portrayal", w: 100, freq: "YEARLY" },
      ]},
      { code: "AAC-2", title: "The HCE has a well-established Patient Management System", indicators: [
        { num: 20, title: "Patient registration process, assessment and reassessment procedures, referral system, follow-up mechanisms in place", w: 100, freq: "QUARTERLY" },
      ]},
    ]},
    { code: "COP", name: "Care of Patients", standards: [
      { code: "COP-1", title: "Every patient is monitored on long term basis", indicators: [
        { num: 21, title: "Long-term monitoring includes monthly labs (CBC, RFTs, electrolytes), quarterly (iron studies, PTH), annual (hepatitis screening), adequacy of dialysis (Kt/V), vascular access monitoring", w: 100, freq: "MONTHLY" },
      ]},
      { code: "COP-2", title: "Emergency services are provided in accordance with applicable laws and SOPs", indicators: [
        { num: 22, title: "Emergency equipment available (crash cart, defibrillator, oxygen, suction, emergency medicines), trained staff for BLS/ACLS, emergency SOPs documented, resuscitation protocols in place", w: 100, freq: "QUARTERLY" },
      ]},
    ]},
    { code: "MOM", name: "Management of Medication", standards: [
      { code: "MOM-1", title: "All hemodialysis treatment prescribed by authorized personnel", indicators: [
        { num: 23, title: "Dialysis prescriptions by qualified nephrologist/physician, prescription includes type, frequency, duration, dialyzer, blood flow rate, anticoagulation", w: 100, freq: "MONTHLY" },
      ]},
      { code: "MOM-2", title: "Hemodialysis treatment provided/supervised by qualified/authorized personnel", indicators: [
        { num: 24, title: "Treatment provided/supervised by qualified staff as per prescribed qualifications", w: 100, freq: "MONTHLY" },
      ]},
      { code: "MOM-3", title: "All consumables used conform to approved specifications", indicators: [
        { num: 25, title: "Dialyzers, blood tubing, fistula needles, concentrates all DRAP approved, single-use items not reused (except where reprocessing allowed), storage per guidelines", w: 100, freq: "QUARTERLY" },
      ]},
    ]},
    { code: "PRE", name: "Patient Rights and Education", standards: [
      { code: "PRE-1", title: "Informed Consent is obtained from all patients undergoing dialysis", indicators: [
        { num: 26, title: "Written informed consent obtained before first dialysis and for any change in treatment, consent covers risks, benefits, alternatives", w: 100, freq: "MONTHLY" },
      ]},
      { code: "PRE-2", title: "SOPs for consent when patient is incapable of independent decision-making", indicators: [
        { num: 27, title: "SOPs define who can give consent for incapacitated patients, legal guardian/next of kin procedures documented", w: 100, freq: "YEARLY" },
      ]},
      { code: "PRE-3", title: "Patient and families have right to information on expected costs", indicators: [
        { num: 28, title: "Fee schedule displayed, patients informed of costs before treatment, billing transparent", w: 100, freq: "QUARTERLY" },
      ]},
      { code: "PRE-4", title: "Patient Rights for Appeals and Complaints", indicators: [
        { num: 29, title: "Complaint mechanism established, PHC helpline displayed, complaints tracked and resolved, patient satisfaction surveys conducted", w: 100, freq: "QUARTERLY" },
      ]},
    ]},
    { code: "IC", name: "Infection Control", standards: [
      { code: "IC-1", title: "Hepatitis-B prevention and isolation SOPs are practiced", indicators: [
        { num: 30, title: "Dedicated machines for HBsAg+ patients, separate room/area, separate equipment and supplies, staff assigned, vaccination of seronegative patients, monthly screening", w: 100, freq: "MONTHLY" },
      ]},
      { code: "IC-2", title: "Hepatitis-C prevention and isolation SOPs are practiced", indicators: [
        { num: 31, title: "Dedicated machines/confined space for HCV+ patients, separate supplies, universal precautions followed, regular screening", w: 100, freq: "MONTHLY" },
      ]},
      { code: "IC-3", title: "SOPs for managing Hepatitis B and C co-infected patients are practiced", indicators: [
        { num: 32, title: "Co-infected patients managed per SOPs, isolated from other patients, dedicated equipment", w: 100, freq: "MONTHLY" },
      ]},
      { code: "IC-4", title: "HIV Prevention and Isolation SOPs are practiced", indicators: [
        { num: 33, title: "Separate machine/shift for HIV+ patients, universal precautions strictly followed, referral to equipped centres when needed", w: 100, freq: "MONTHLY" },
      ]},
      { code: "IC-5", title: "Hospital Waste Management per Hospital Waste Management Rules", indicators: [
        { num: 34, title: "Waste segregation at source, color-coded bins, sharps containers, waste disposal per PHWMR, staff trained, waste disposal records maintained", w: 100, freq: "QUARTERLY" },
      ]},
      { code: "IC-6", title: "Re-usable items are disinfected/sterilized per SOPs before reuse", indicators: [
        { num: 35, title: "Sterilization/disinfection SOPs documented and followed, validation tests performed, sterilization records maintained", w: 100, freq: "MONTHLY" },
      ]},
      { code: "IC-7", title: "Effluent drainage is safe", indicators: [
        { num: 36, title: "Dialysis effluent disposed safely per environmental regulations, drainage system maintains hygiene", w: 100, freq: "QUARTERLY" },
      ]},
      { code: "IC-8", title: "Appropriate measures prevent transmission of infection among chronic hemodialysis patients", indicators: [
        { num: 37, title: "Universal precautions followed, hand hygiene protocols, surface disinfection between patients, no sharing of supplies between patients, staff education ongoing", w: 100, freq: "MONTHLY" },
      ]},
    ]},
  ],
};

// ═══════════════════════════════════════════════════════════════
// PSYCHIATRIC & ADDICTION TREATMENT - 35 Standards, 133 Indicators
// ═══════════════════════════════════════════════════════════════
const PSYCHIATRIC = {
  category: "OTHER", // Map to closest existing enum
  prefix: "PSY",
  areas: [
    { code: "ROM", name: "Responsibilities of Management", standards: [
      { code: "ROM-1", title: "The HCE is identifiable as a legal entity and easily accessible", indicators: [
        { num: 1, title: "The HCE is identifiable with a signboard conforming to legal requirements with Name and PHC Registration/License Number", w: 100, freq: "ONE_TIME" },
        { num: 2, title: "The HCE is registered/licensed with PHC", w: 100, freq: "YEARLY" },
        { num: 3, title: "The patient/client has easy access to the HCE", w: 80, freq: "ONE_TIME" },
      ]},
      { code: "ROM-2", title: "The Staff on duty is identifiable", indicators: [
        { num: 4, title: "The Staff on duty uses the authorized Identity Badge", w: 100, freq: "MONTHLY" },
        { num: 5, title: "Door plates at clinics/offices clearly display name, qualification/s, designation/s", w: 100, freq: "ONE_TIME" },
      ]},
      { code: "ROM-3", title: "The HCE premises support the scope of work/services", indicators: [
        { num: 6, title: "The HCE premises has demarcated areas according to the scope of services", w: 100, freq: "ONE_TIME" },
        { num: 7, title: "HCE has adequate facilities and civic amenities for comfort of patients and attendants", w: 100, freq: "QUARTERLY" },
        { num: 8, title: "The HCE has adequate arrangements for privacy of patients during consultation/examination", w: 100, freq: "ONE_TIME" },
        { num: 9, title: "The HCE has arrangements to provide safe recreational activities", w: 100, freq: "QUARTERLY" },
        { num: 10, title: "The HCE provides psychosocial rehabilitation services", w: 100, freq: "QUARTERLY" },
      ]},
      { code: "ROM-4", title: "Responsibilities of management are defined", indicators: [
        { num: 11, title: "The management has laid down mission statement of the HCE", w: 100, freq: "ONE_TIME" },
        { num: 12, title: "The management has established the HCE's organogram", w: 100, freq: "ONE_TIME" },
        { num: 13, title: "The management ensures appointment of competent professionals per organogram", w: 100, freq: "YEARLY" },
        { num: 14, title: "The management appoints a technically qualified professional to head the HCE", w: 100, freq: "ONE_TIME" },
        { num: 15, title: "Management lays down overall Policy, Standing Orders and SOPs", w: 100, freq: "YEARLY" },
        { num: 16, title: "Management designates substitutes when head or section in-charge is absent", w: 100, freq: "YEARLY" },
        { num: 17, title: "The management lays down SOPs for emergency situations", w: 100, freq: "YEARLY" },
        { num: 18, title: "The management lays down security SOPs", w: 100, freq: "YEARLY" },
        { num: 19, title: "The management monitors and measures performance of the HCE", w: 100, freq: "QUARTERLY" },
        { num: 20, title: "The HCE management addresses social and community responsibilities", w: 80, freq: "YEARLY" },
        { num: 21, title: "The management supports research activities", w: 80, freq: "YEARLY" },
      ]},
      { code: "ROM-5", title: "The management ensures functioning per relevant statutes", indicators: [
        { num: 22, title: "Management ensures availability of applicable laws/bylaws/codes/rules/regulations", w: 100, freq: "YEARLY" },
        { num: 23, title: "Management is conversant with relevant laws and knows their applicability", w: 100, freq: "YEARLY" },
        { num: 24, title: "Management regularly updates amendments in relevant laws/rules/regulations", w: 100, freq: "YEARLY" },
        { num: 25, title: "Management ensures implementation of applicable laws/rules/regulations/SOPs", w: 100, freq: "QUARTERLY" },
      ]},
    ]},
    { code: "FMS", name: "Facility Management and Safety", standards: [
      { code: "FMS-1", title: "Facility design supports the scope of work", indicators: [
        { num: 26, title: "Effective separation between administrative, clinical, indoor and counselling areas", w: 100, freq: "ONE_TIME" },
        { num: 27, title: "HCE design supports security arrangements against unauthorized entry/exit", w: 100, freq: "ONE_TIME" },
      ]},
      { code: "FMS-2", title: "The HCE maintains a safe and secure environment", indicators: [
        { num: 28, title: "Arrangements to ensure physical safety of patients/attendants in the HCE", w: 100, freq: "QUARTERLY" },
        { num: 29, title: "Arrangements to ensure safety/security of food/eatables for resident patients", w: 100, freq: "QUARTERLY" },
        { num: 30, title: "Arrangements to ensure safety of medicines/drugs for resident patients", w: 100, freq: "MONTHLY" },
        { num: 31, title: "Arrangements for provision of clean clothing/linen to resident patients", w: 100, freq: "MONTHLY" },
      ]},
      { code: "FMS-3", title: "The HCE has plans for fire and non-fire emergencies", indicators: [
        { num: 32, title: "Plan and provisions for early detection of fire and non-fire emergencies", w: 100, freq: "YEARLY" },
        { num: 33, title: "Provisions for abatement of fire and non-fire emergencies", w: 100, freq: "YEARLY" },
        { num: 34, title: "Provisions for containment of fire and non-fire emergencies", w: 100, freq: "YEARLY" },
        { num: 35, title: "Safe exit points in case of emergencies are displayed", w: 100, freq: "ONE_TIME" },
        { num: 36, title: "Mock drills are conducted at least once in a year", w: 100, freq: "YEARLY" },
        { num: 37, title: "Staff members are trained for their role in emergencies", w: 100, freq: "HALF_YEARLY" },
      ]},
      { code: "FMS-4", title: "The HCE has a system for management of equipment", indicators: [
        { num: 38, title: "The HCE has equipment in accordance with the scope of its services", w: 100, freq: "YEARLY" },
        { num: 39, title: "Equipment is operated and maintained by qualified/trained personnel", w: 100, freq: "YEARLY" },
      ]},
    ]},
    { code: "HRM", name: "Human Resource Management", standards: [
      { code: "HRM-1", title: "Staff deployment is in accordance with scope of services", indicators: [
        { num: 40, title: "Eligibility criteria regarding qualification and experience for each job is available", w: 100, freq: "ONE_TIME" },
        { num: 41, title: "Recruitment is made according to the laid down criteria", w: 100, freq: "YEARLY" },
        { num: 42, title: "Job description for every post is defined and documented", w: 100, freq: "ONE_TIME" },
        { num: 43, title: "Requisite staff available for provision/supervision of psychiatric and/or addiction treatment services", w: 100, freq: "YEARLY" },
      ]},
      { code: "HRM-2", title: "Staff joining are oriented to HCE environment and their jobs", indicators: [
        { num: 44, title: "There is an appropriate orientation plan for newly inducted staff", w: 100, freq: "YEARLY" },
        { num: 45, title: "Each staff member is aware of his/her rights and responsibilities", w: 100, freq: "YEARLY" },
        { num: 46, title: "All employees are educated with regard to patient rights and responsibilities", w: 100, freq: "YEARLY" },
        { num: 47, title: "Staff receives refresher training/certification to continue performing jobs effectively", w: 100, freq: "HALF_YEARLY" },
      ]},
      { code: "HRM-3", title: "An appraisal system for evaluating employee performance exists", indicators: [
        { num: 48, title: "There is a well-documented performance appraisal system and tools", w: 100, freq: "YEARLY" },
        { num: 49, title: "All employees are made aware of performance appraisal tools at induction", w: 100, freq: "YEARLY" },
        { num: 50, title: "The appraisal is used as a tool for further development", w: 80, freq: "YEARLY" },
        { num: 51, title: "Performance appraisal is carried out at pre-defined intervals and documented", w: 100, freq: "YEARLY" },
      ]},
      { code: "HRM-4", title: "Documented personal record for each staff member exists", indicators: [
        { num: 52, title: "Personal files are maintained for all full time/part time employees", w: 100, freq: "YEARLY" },
      ]},
      { code: "HRM-5", title: "System for verifying credentials of professionals exists", indicators: [
        { num: 53, title: "System for verification of documents and certificates of employees exists", w: 100, freq: "YEARLY" },
        { num: 54, title: "Only medical professionals permitted by law provide patient care without supervision", w: 100, freq: "YEARLY" },
      ]},
    ]},
    { code: "IMS", name: "Information Management System", standards: [
      { code: "IMS-1", title: "The HCE has complete and accurate medical record for every patient", indicators: [
        { num: 55, title: "Every medical record has a unique identifier", w: 100, freq: "MONTHLY" },
        { num: 56, title: "Staff authorized to make entries is reflected in HCE policy/SOPs and is identifiable", w: 100, freq: "YEARLY" },
        { num: 57, title: "Every medical record entry is dated, timed and signed", w: 100, freq: "MONTHLY" },
        { num: 58, title: "Complete medical record of patients is maintained at HCE", w: 100, freq: "MONTHLY" },
        { num: 59, title: "Progress notes are recorded by the professionals responsible for care", w: 100, freq: "MONTHLY" },
        { num: 60, title: "Every dormant record has a discharge summary", w: 100, freq: "MONTHLY" },
        { num: 61, title: "SOPs for safety and security of patient record exist and are practiced", w: 100, freq: "YEARLY" },
        { num: 62, title: "Authorized care providers have access to current and past medical records", w: 100, freq: "MONTHLY" },
      ]},
      { code: "IMS-2", title: "The HCE regularly carries out review of medical records", indicators: [
        { num: 63, title: "Medical records are reviewed regularly/periodically", w: 100, freq: "QUARTERLY" },
        { num: 64, title: "Review focuses on timeliness, legibility and completeness of records", w: 100, freq: "QUARTERLY" },
        { num: 65, title: "Any deficiency found and corrective measures taken are documented", w: 100, freq: "QUARTERLY" },
      ]},
    ]},
    { code: "CQI", name: "Continuous Quality Improvement", standards: [
      { code: "CQI-1", title: "The HCE has a structured Quality Improvement system in place", indicators: [
        { num: 66, title: "Comprehensive QI plan developed, implemented and maintained by CQI Committee", w: 100, freq: "YEARLY" },
        { num: 67, title: "There is a designated individual for coordinating and implementing the QI programme", w: 100, freq: "YEARLY" },
        { num: 68, title: "CQI programme communicated to ALL employees through training", w: 100, freq: "HALF_YEARLY" },
        { num: 69, title: "Quality improvement programme is updated at least once a year", w: 100, freq: "YEARLY" },
      ]},
      { code: "CQI-2", title: "The monitoring system for CQI exists at the HCE", indicators: [
        { num: 70, title: "Monitoring includes appropriate patient assessment", w: 100, freq: "MONTHLY" },
        { num: 71, title: "Monitoring includes adverse drug events", w: 100, freq: "MONTHLY" },
        { num: 72, title: "Monitoring includes availability and content of medical records", w: 100, freq: "MONTHLY" },
        { num: 73, title: "Monitoring includes recommendations from appropriate services concerning follow-up or aftercare", w: 100, freq: "MONTHLY" },
      ]},
      { code: "CQI-3", title: "Sentinel events are assessed and managed", indicators: [
        { num: 74, title: "The HCE has defined sentinel events", w: 100, freq: "YEARLY" },
        { num: 75, title: "Sentinel events are intensively analysed when they occur", w: 100, freq: "QUARTERLY" },
      ]},
    ]},
    { code: "AAC", name: "Access, Assessment and Continuity of Care", standards: [
      { code: "AAC-1", title: "Services are provided as portrayed/claimed", indicators: [
        { num: 76, title: "Only services registered with PHC are provided and displayed at HCE", w: 100, freq: "YEARLY" },
        { num: 77, title: "Health education guidance about rehabilitation is provided as per guidelines", w: 100, freq: "QUARTERLY" },
        { num: 78, title: "Preventive services are provided as per guidelines", w: 100, freq: "QUARTERLY" },
      ]},
      { code: "AAC-2", title: "HCE has a well-established patient management system", indicators: [
        { num: 79, title: "The HCE employs a comprehensive patient management process", w: 100, freq: "QUARTERLY" },
        { num: 80, title: "An initial assessment establishes diagnosis and prioritizes interventions in a coordinated treatment plan", w: 100, freq: "MONTHLY" },
        { num: 81, title: "Assessment employs standard tools for classification of mental disorders", w: 100, freq: "MONTHLY" },
        { num: 82, title: "Patients evaluated for addiction also undergo mental health status assessment", w: 100, freq: "MONTHLY" },
        { num: 83, title: "Assessment of female patients includes their gynaecological status", w: 100, freq: "MONTHLY" },
      ]},
      { code: "AAC-3", title: "Adequate diagnostic facilities are in place/accessible", indicators: [
        { num: 84, title: "Laboratory/testing arrangements to facilitate patient assessment are available", w: 100, freq: "YEARLY" },
        { num: 85, title: "Imaging services are available/accessible as per clinical requirements", w: 100, freq: "YEARLY" },
        { num: 86, title: "Only diagnostic services complying with prescribed minimum standards are provided", w: 100, freq: "YEARLY" },
      ]},
    ]},
    { code: "COP", name: "Care of Patients", standards: [
      { code: "COP-1", title: "Emergency services are guided by policies, procedures and applicable laws", indicators: [
        { num: 87, title: "SOPs for emergency care are documented", w: 100, freq: "YEARLY" },
        { num: 88, title: "Policies address handling of medico-legal cases", w: 100, freq: "YEARLY" },
        { num: 89, title: "SOPs guide prioritization of patients for initiation of appropriate care", w: 100, freq: "YEARLY" },
        { num: 90, title: "Staff familiar with SOPs for emergency care and patients receive care per SOPs", w: 100, freq: "HALF_YEARLY" },
      ]},
      { code: "COP-2", title: "Policies guide admission/detention and discharge of patients", indicators: [
        { num: 91, title: "Reasons for admission/detention clearly documented as stated by patient and/or others", w: 100, freq: "MONTHLY" },
        { num: 92, title: "Admission/detention, discharge or referral to another HCE is documented", w: 100, freq: "MONTHLY" },
      ]},
      { code: "COP-3", title: "Patient management planned on basis of assessment and diagnosis", indicators: [
        { num: 93, title: "A substantiated diagnosis is established and documented", w: 100, freq: "MONTHLY" },
        { num: 94, title: "A complete neurological assessment is undertaken when indicated", w: 100, freq: "MONTHLY" },
        { num: 95, title: "Comprehensive treatment planned for each female patient including gynaecological status", w: 100, freq: "MONTHLY" },
        { num: 96, title: "Treatment plan reviewed on basis of patient strengths and disabilities", w: 100, freq: "MONTHLY" },
        { num: 97, title: "Treatment provided is comprehensibly entered in the medical records", w: 100, freq: "MONTHLY" },
        { num: 98, title: "Contact with visitors is monitored/supervised and possibly restricted in early treatment stages", w: 100, freq: "MONTHLY" },
        { num: 99, title: "Psychotherapy services are provided as prescribed", w: 100, freq: "MONTHLY" },
        { num: 100, title: "SOPs for care of patients requiring non-psychiatric interventions exist", w: 100, freq: "YEARLY" },
        { num: 101, title: "Drug dependents are isolated in a nearby separate section as legally required", w: 100, freq: "MONTHLY" },
        { num: 102, title: "Treatment plans periodically revised based on patient monitoring and drug use trend data", w: 100, freq: "QUARTERLY" },
        { num: 103, title: "Addiction treatment services networked with other medical and social services", w: 80, freq: "YEARLY" },
        { num: 104, title: "Psycho-social interventions for rehabilitation of drug addicts are operational", w: 100, freq: "QUARTERLY" },
      ]},
      { code: "COP-4", title: "Policies guide prevention of maltreatment of patient by care provider", indicators: [
        { num: 105, title: "SOPs to prevent maltreatment of patients by care providers are practiced", w: 100, freq: "YEARLY" },
      ]},
      { code: "COP-5", title: "Policies guide the administration of anaesthesia when required", indicators: [
        { num: 106, title: "Documented SOPs for administration of anaesthesia exist", w: 100, freq: "YEARLY" },
        { num: 107, title: "Informed consent for administration of anaesthesia is obtained by the anaesthetist", w: 100, freq: "MONTHLY" },
        { num: 108, title: "Periodic monitoring during anaesthesia is regularly conducted", w: 100, freq: "MONTHLY" },
      ]},
    ]},
    { code: "MOM", name: "Management of Medications", standards: [
      { code: "MOM-1", title: "Policies and procedures exist for prescription of medications", indicators: [
        { num: 109, title: "Documented SOPs for prescription writing are available", w: 100, freq: "YEARLY" },
        { num: 110, title: "SOPs are followed for prescription writing", w: 100, freq: "MONTHLY" },
        { num: 111, title: "Standardized drug treatment protocols are observed", w: 100, freq: "YEARLY" },
      ]},
      { code: "MOM-2", title: "Policies guide safe storage, dispensing and administration of medications", indicators: [
        { num: 112, title: "Medicines/disposables are stored as per guidelines", w: 100, freq: "QUARTERLY" },
        { num: 113, title: "Expiry dates/shelf life are checked prior to administering", w: 100, freq: "MONTHLY" },
        { num: 114, title: "Labelling requirements are implemented", w: 100, freq: "MONTHLY" },
        { num: 115, title: "Dispensing/utilization is by an authorized person", w: 100, freq: "MONTHLY" },
      ]},
    ]},
    { code: "PRE", name: "Patient Rights and Education", standards: [
      { code: "PRE-1", title: "Patients have right to comprehensive mental health care meeting their needs", indicators: [
        { num: 116, title: "Charter of rights and responsibilities is displayed and patients/families are guided", w: 100, freq: "ONE_TIME" },
        { num: 117, title: "Patients/families are guided and facilitated in protecting patient belongings and assets", w: 100, freq: "MONTHLY" },
      ]},
      { code: "PRE-2", title: "A documented consent process exists for informed decision making", indicators: [
        { num: 118, title: "Policy describes who can give consent when patient is incapable of independent decision-making", w: 100, freq: "YEARLY" },
        { num: 119, title: "Informed consent obtained before initiation of examination/treatment/management", w: 100, freq: "MONTHLY" },
      ]},
      { code: "PRE-3", title: "Patient and families have right to information on expected costs", indicators: [
        { num: 120, title: "The patient/family is informed about the cost of treatment", w: 100, freq: "MONTHLY" },
        { num: 121, title: "There is uniform category-specific pricing policy in a given setting", w: 100, freq: "YEARLY" },
        { num: 122, title: "Patients/family informed about financial implications when treatment plan changes", w: 100, freq: "MONTHLY" },
      ]},
      { code: "PRE-4", title: "Patient Rights for Appeals and Complaints are respected", indicators: [
        { num: 123, title: "HCE informs patients of right to express concern or complain verbally or in writing", w: 100, freq: "ONE_TIME" },
        { num: 124, title: "Documented complaint management process which is fair and timely", w: 100, freq: "QUARTERLY" },
        { num: 125, title: "HCE uses results of complaints investigations for quality improvement", w: 100, freq: "QUARTERLY" },
        { num: 126, title: "SOPs regarding shifting patient from home against will conform to regulatory requirements", w: 100, freq: "YEARLY" },
      ]},
      { code: "PRE-5", title: "Patient Rights regarding confidentiality are respected", indicators: [
        { num: 127, title: "HCE has documented SOPs to ensure confidentiality of patient identity and ailment", w: 100, freq: "YEARLY" },
        { num: 128, title: "HCE ensures patient identity is not disclosed to public through press or electronic media", w: 100, freq: "MONTHLY" },
      ]},
    ]},
    { code: "IPC", name: "Infection Prevention and Control", standards: [
      { code: "IPC-1", title: "The HCE has comprehensive infection prevention and control programme", indicators: [
        { num: 129, title: "Infection prevention and control plan is documented aiming to prevent nosocomial infections", w: 100, freq: "YEARLY" },
        { num: 130, title: "The HCE has an Infection Prevention and Control Committee", w: 100, freq: "YEARLY" },
        { num: 131, title: "The HCE has designated a qualified infection control nurse/officer", w: 100, freq: "YEARLY" },
        { num: 132, title: "Appropriate consumables, collection/handling systems, equipment for infection control available", w: 100, freq: "QUARTERLY" },
        { num: 133, title: "ALL staff receive regular training in infection control and safe handling of medical waste", w: 100, freq: "HALF_YEARLY" },
      ]},
    ]},
  ],
};

// ═══════════════════════════════════════════════════════════════
// SEED FUNCTION (same as before)
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
            `Indicator ${ind.num} under ${std.code} (${area.name}). Weightage: ${ind.w}%.`,
            `Assessment frequency: ${ind.freq}. Compliance weightage: ${ind.w}%.`,
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

  console.log("═══ Seeding DIALYSIS FACILITIES ═══");
  const dly = await seedDocument(client, DIALYSIS);
  console.log(`  Standards: ${dly.standardCount}, Indicators: ${dly.indicatorCount}\n`);

  console.log("═══ Seeding PSYCHIATRIC & ADDICTION TREATMENT ═══");
  const psy = await seedDocument(client, PSYCHIATRIC);
  console.log(`  Standards: ${psy.standardCount}, Indicators: ${psy.indicatorCount}\n`);

  console.log("════════════════════════════════");
  console.log(`TOTAL NEW: Standards: ${dly.standardCount + psy.standardCount}, Indicators: ${dly.indicatorCount + psy.indicatorCount}`);

  // Verify totals
  const stdCount = await client.query('SELECT COUNT(*) FROM "MsdsStandard"');
  const indCount = await client.query('SELECT COUNT(*) FROM "Indicator"');
  const byCat = await client.query('SELECT category, COUNT(*) FROM "MsdsStandard" GROUP BY category ORDER BY category');
  console.log(`\nDB TOTALS:`);
  console.log(`  MsdsStandard: ${stdCount.rows[0].count}`);
  console.log(`  Indicator: ${indCount.rows[0].count}`);
  console.log(`\nBy Category:`);
  byCat.rows.forEach(r => console.log(`  ${r.category}: ${r.count} standards`));

  await client.end();
}

main().catch((e) => { console.error("Error:", e); process.exit(1); });
