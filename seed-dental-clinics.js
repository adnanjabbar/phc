// Seed script for Dental Clinics MSDS - 23 Standards, 69 Indicators
// Run with: node seed-dental-clinics.js

const { Client } = require("pg");
const DB_URL = "postgresql://phc_admin:PhcMsds2026Secure@localhost:5432/phc_db";

// 10 Functional Areas → 23 Standards → 69 Indicators
const DENTAL_CLINICS_MSDS = {
  category: "DENTAL_CARE",
  areas: [
    {
      code: "ROM",
      name: "Responsibilities of Management",
      standards: [
        {
          code: "ROM-1",
          title: "The clinic is identifiable as an entity and is easily accessible",
          indicators: [
            { num: 1, title: "The clinic is identifiable with name and registration/license numbers on the sign board/s", weightage: 100, requiresEvidence: true, requiresPhoto: true, dataType: "scoring", frequency: "ONE_TIME", guidance: "Sign board available, visible and placed appropriately with: Name of clinic, Name of service provider/s, PMC Registration Number, PHC Registration/License number. Score fully met if all present, not met if missing." },
            { num: 2, title: "The patient/client has easy access to the clinic", weightage: 80, requiresEvidence: true, requiresPhoto: true, dataType: "scoring", frequency: "ONE_TIME", guidance: "Non-slippery steps/ramps, facilitation for patient access, entry/exit wide enough for wheelchair. Fully met if easy access, partially met if steps but no ramp with facilitation, not met if no access provisions." },
            { num: 3, title: "The dental clinic is registered/licensed with the PHC", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "YEARLY", guidance: "PHC Registration Certificate/License available and displayed inside clinic. Or evidence of having applied for license/renewal." },
            { num: 4, title: "Door plate/s clearly display name and qualification/s of the dental surgeon", weightage: 80, requiresEvidence: true, requiresPhoto: true, dataType: "scoring", frequency: "ONE_TIME", guidance: "Door plate fixed with name and qualifications, text per PMC/PMDC Code of Ethics, size not exceeding 4x10 inches. Fully met if complete, partially met if incomplete info, not met if absent." },
            { num: 5, title: "The staff on duty uses identity badge/s", weightage: 100, requiresEvidence: true, requiresPhoto: true, dataType: "scoring", frequency: "MONTHLY", guidance: "Identity badges issued to staff, staff on duty identified with badges showing name/designation/discipline. Fully met if in use, not met if not in use." },
            { num: 6, title: "Consultation hours are displayed", weightage: 100, requiresEvidence: true, requiresPhoto: true, dataType: "scoring", frequency: "ONE_TIME", guidance: "Consultation/practice hours displayed inside and outside clinic. Dental surgeon physically present during hours. Fully met if displayed and followed, not met if not displayed or not followed." },
          ],
        },
        {
          code: "ROM-2",
          title: "The manager and the healthcare service provider/s at the clinic is/are suitably qualified",
          indicators: [
            { num: 7, title: "The clinic manager is duly designated and has requisite qualifications", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "ONE_TIME", guidance: "Clinic manager designated with requisite qualifications. Evidence of designation and qualifications required." },
            { num: 8, title: "PMC Registration Certificate of the dental surgeon is displayed", weightage: 80, requiresEvidence: true, requiresPhoto: true, dataType: "scoring", frequency: "YEARLY", guidance: "Valid PMC Registration Certificate displayed at prominent place. Original available for verification." },
          ],
        },
        {
          code: "ROM-3",
          title: "Clinic premises support the scope of work/services",
          indicators: [
            { num: 9, title: "The size/premises of the dental clinic is as per minimum requirement", weightage: 80, requiresEvidence: true, requiresPhoto: true, dataType: "scoring", frequency: "ONE_TIME", guidance: "Reception desk, sitting for 3+ patients, dental chair with components, X-ray unit, autoclave, labelled cabinets for instruments and materials. Fully met if all present, partially met if no reception desk, not met if insufficient." },
            { num: 10, title: "The dental clinic has adequate facilities for the comfort of the patients", weightage: 80, requiresEvidence: true, requiresPhoto: true, dataType: "scoring", frequency: "QUARTERLY", guidance: "7 facilities required: sitting/waiting area, backup electricity (1hr+3 emergency lights), waste containers, ventilation/AC, clean drinking water, mosquito/fly proofing, toilet. Fully met if all 7, partially met if 6, not met if less." },
            { num: 11, title: "The dental clinic has adequate arrangements for the privacy of patients during consultation/examination/procedures", weightage: 100, requiresEvidence: true, requiresPhoto: true, dataType: "scoring", frequency: "ONE_TIME", guidance: "Curtain or cabin/wooden partition for privacy per PMC Code of Ethics. Evidence that privacy is respected. Fully met if arrangement exists and respected, not met if no arrangement." },
          ],
        },
        {
          code: "ROM-4",
          title: "The responsibilities of the management are defined",
          indicators: [
            { num: 12, title: "The dental clinic management intimates any change in scope or portrayal of services, the location of the HCE or the service provider/s etc. to the PHC", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "YEARLY", guidance: "Evidence of communicating any change in status/scope to PHC. Fully met if evidence exists, not met if no evidence." },
            { num: 13, title: "The dental clinic management addresses social and community responsibilities", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "YEARLY", guidance: "Evidence of outreach activities: awareness campaigns, dental camps, aid to calamity victims. Pamphlets/banners/posters/patient records as evidence. Fully met if evidence exists, not met if none." },
          ],
        },
      ],
    },
    {
      code: "FMS",
      name: "Facility Management and Safety",
      standards: [
        {
          code: "FMS-1",
          title: "The dental clinic staff is aware of, and complies with, the relevant laws, rules, regulations, bylaws and facility inspection requirements",
          indicators: [
            { num: 14, title: "The clinic management is conversant with the relevant laws and regulations", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "YEARLY", guidance: "Staff aware of building safety, fire safety, equipment codes, pharmaceutical procurement laws, clean water supply. Effective contingency plans for system failures." },
            { num: 15, title: "The clinic management regularly updates any amendments in the prevailing laws of the land", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "YEARLY", guidance: "Updated/current copies of applicable laws available. Fully met if all available, not met if any missing or outdated." },
            { num: 16, title: "The management ensures implementation of relevant laws", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "QUARTERLY", guidance: "Updated registrations/certificates/licenses, compliance documents (SOPs/plans/committee minutes), demonstration in routine work." },
            { num: 17, title: "There is a mechanism to regularly update licenses/registrations/certifications", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "YEARLY", guidance: "Evidence of valid/updated licenses from respective authorities. Renewal process initiated before expiry." },
            { num: 18, title: "The staff has the knowledge about early detection and containment of fire and non-fire emergencies", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "HALF_YEARLY", guidance: "Staff trained in fire safety, mock drills conducted, emergency procedures documented. Fire drill records required." },
            { num: 19, title: "Arrangements to combat fire and non-fire emergencies are in place", weightage: 100, requiresEvidence: true, requiresPhoto: true, dataType: "scoring", frequency: "QUARTERLY", guidance: "Fire extinguishers available and serviced, emergency exits marked, first aid kit available, emergency contact numbers displayed." },
          ],
        },
        {
          code: "FMS-2",
          title: "The clinic has a programme for management of dental and support services equipment",
          indicators: [
            { num: 20, title: "The clinic has equipment in accordance with its scope of services", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "YEARLY", guidance: "Equipment list matches scope of services. All equipment functional and appropriate." },
            { num: 21, title: "Qualified and trained personnel operate and maintain the equipment", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "YEARLY", guidance: "Personnel trained to operate equipment. Training records maintained. JDs specify equipment responsibilities." },
            { num: 22, title: "Equipment is periodically inspected, serviced and calibrated to ensure its proper functioning", weightage: 80, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "QUARTERLY", guidance: "Equipment maintenance log maintained, periodic inspections documented, calibration records available." },
          ],
        },
      ],
    },
    {
      code: "HRM",
      name: "Human Resource Management",
      standards: [
        {
          code: "HRM-1",
          title: "There is documented personnel record of dental surgeon/s and staff",
          indicators: [
            { num: 23, title: "The personnel record and credentials of all staff of the clinic are maintained", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "YEARLY", guidance: "Personnel files for all staff with qualifications, certifications, employment records. Updated regularly." },
          ],
        },
        {
          code: "HRM-2",
          title: "The employees joining the dental clinic/practice are oriented to the environment, respective sections and their individual jobs",
          indicators: [
            { num: 24, title: "Each regular/part time employee, trainee and voluntary worker is appropriately oriented to the overall environment of the dental clinic", weightage: 80, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "YEARLY", guidance: "Orientation records for all employees. Covers clinic environment, policies, procedures, relevant sections." },
            { num: 25, title: "Each regular/part time employee is made aware of the job description", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "YEARLY", guidance: "Written JDs provided to all staff. Signed acknowledgment on file." },
            { num: 26, title: "Performance evaluations are based on the JDs", weightage: 80, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "YEARLY", guidance: "Performance evaluation records linked to JDs. Regular evaluations conducted." },
            { num: 27, title: "Each regular/part time employee is made aware of his/her rights and responsibilities and patient rights and responsibilities", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "YEARLY", guidance: "Staff aware of their rights/responsibilities and patient rights. Evidence of communication/training." },
          ],
        },
      ],
    },
    {
      code: "IMS",
      name: "Information Management System",
      standards: [
        {
          code: "IMS-1",
          title: "Patient clinical record is maintained at the dental clinic",
          indicators: [
            { num: 28, title: "Every patient's medical records has a unique identifier and particulars for identification", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "MONTHLY", guidance: "Unique patient ID system, records contain name, age, gender, CNIC/contact details." },
            { num: 29, title: "Only authorized person/s make entries in the record", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "MONTHLY", guidance: "Authorized personnel list maintained. Only authorized persons make entries. Evidence of authorization." },
            { num: 30, title: "Every record entry is dated, timed and signed", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "MONTHLY", guidance: "All entries in patient records are dated, timed and signed by the person making the entry." },
            { num: 31, title: "The record provides an up-to-date and chronological account of patient care", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "MONTHLY", guidance: "Patient records maintained chronologically with complete treatment history, diagnoses, procedures performed." },
          ],
        },
      ],
    },
    {
      code: "QA",
      name: "Quality Assurance / Quality Improvement",
      standards: [
        {
          code: "QA-1",
          title: "The dental clinic has Quality Assurance / Improvement System in place",
          indicators: [
            { num: 32, title: "Service provision is as per portrayal", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "QUARTERLY", guidance: "Services actually provided match those displayed/portrayed. No unauthorized services offered." },
            { num: 33, title: "A quality improvement system is practiced", weightage: 80, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "QUARTERLY", guidance: "QI system documented and practiced. Evidence of continuous improvement activities." },
          ],
        },
        {
          code: "QA-2",
          title: "The clinic identifies key indicators to monitor the inputs, processes and outcomes which are used as tools for continual improvement",
          indicators: [
            { num: 34, title: "Monitoring includes appropriate patient assessment", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "MONTHLY", guidance: "Patient assessment protocols in place and followed. Records demonstrate appropriate assessments." },
            { num: 35, title: "Monitoring includes safety and quality control programmes of the diagnostic services", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "QUARTERLY", guidance: "Quality control for diagnostic services (X-ray, lab) documented. Safety protocols in place." },
            { num: 36, title: "Monitoring includes ALL invasive procedures and equipment", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "MONTHLY", guidance: "All invasive procedures monitored and documented. Equipment used for procedures properly maintained." },
            { num: 37, title: "Monitoring includes use of anesthetics", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "MONTHLY", guidance: "Anesthetic use monitored and documented. Proper protocols for administration. Adverse reactions documented." },
            { num: 38, title: "Monitoring includes availability and content of the clinic records", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "MONTHLY", guidance: "Regular audits of clinic records for completeness and availability. Record keeping quality monitored." },
          ],
        },
        {
          code: "QA-3",
          title: "Sentinel events are assessed and managed",
          indicators: [
            { num: 39, title: "The clinic has enlisted the Sentinel Events to be analyzed and managed", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "YEARLY", guidance: "List of possible sentinel events maintained. Any occurrence analyzed and managed within 12 months. Results used for QA/QI. Includes: wrong tooth extraction, surgery on wrong patient, broken instruments, swallowed objects, needle breakage, drug allergic reactions." },
          ],
        },
      ],
    },
    {
      code: "ACC",
      name: "Assessment and Continuity of Care",
      standards: [
        {
          code: "ACC-1",
          title: "Portrayed service/s conform to the legal provisions",
          indicators: [
            { num: 40, title: "The services being provided at the clinic are displayed as per Code of Ethics", weightage: 100, requiresEvidence: true, requiresPhoto: true, dataType: "scoring", frequency: "YEARLY", guidance: "Board displaying scope of services per ethical provisions. Only qualified services offered." },
            { num: 41, title: "Specialized services being provided conform to the standards", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "YEARLY", guidance: "Specialized services provided by accordingly qualified and registered professionals." },
            { num: 42, title: "The use and maintenance of specialized equipment conforms to the standards", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "QUARTERLY", guidance: "Equipment used per manufacturer guidelines. Log book maintained. Safety and infection control followed." },
            { num: 43, title: "Dental laboratory services, provided, conform to the respective requirements", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "YEARLY", guidance: "On-site lab services meet requirements in equipment, staff and SOPs. Off-site services from qualified technicians only." },
            { num: 44, title: "Dental radiological diagnostic services, being provided, conform to the respective standards", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "YEARLY", guidance: "X-ray services comply with radiation safety standards. Equipment calibrated. Personnel trained and certified." },
            { num: 45, title: "Dental health education is provided as per guidelines", weightage: 80, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "QUARTERLY", guidance: "Patient education materials available. Evidence of dental health education provided to patients." },
            { num: 46, title: "Preventive services are provided as per guidelines", weightage: 80, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "QUARTERLY", guidance: "Preventive dental services offered: fluoride treatment, sealants, scaling, oral hygiene instructions." },
          ],
        },
      ],
    },
    {
      code: "COP",
      name: "Care of Patients",
      standards: [
        {
          code: "COP-1",
          title: "The clinic has a well-established patient management system",
          indicators: [
            { num: 47, title: "The clinic has an established registration and guidance process", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "QUARTERLY", guidance: "Patient registration process established. Guidance provided to patients on services, procedures, costs." },
            { num: 48, title: "Standard/Ethical practice is evident from the patient record", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "MONTHLY", guidance: "Patient records demonstrate standard ethical practice. Complete documentation of care provided." },
            { num: 49, title: "The clinic has referral SOPs", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "YEARLY", guidance: "Written referral SOPs available. Evidence of referrals made per SOPs. Referral records maintained." },
          ],
        },
        {
          code: "COP-2",
          title: "The clinic has essential arrangements for providing care to emergency cases",
          indicators: [
            { num: 50, title: "The clinic has essential arrangements to cater for emergency care", weightage: 100, requiresEvidence: true, requiresPhoto: true, dataType: "scoring", frequency: "QUARTERLY", guidance: "Emergency equipment available: oxygen cylinder, ambu bag, emergency medicines. Staff trained in BLS. Emergency protocols displayed." },
          ],
        },
      ],
    },
    {
      code: "MOM",
      name: "Management of Medication",
      standards: [
        {
          code: "MOM-1",
          title: "Prescribing practices conform to the standards",
          indicators: [
            { num: 51, title: "Standards for prescription writing are followed", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "MONTHLY", guidance: "Prescriptions follow standard format with all required elements." },
            { num: 52, title: "Prescriptions are clear, legible, dated, timed, named/stamped and signed", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "MONTHLY", guidance: "All prescriptions clear and legible, properly dated, timed, with provider name/stamp and signature." },
            { num: 53, title: "Prescriptions are provided to the patients", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "MONTHLY", guidance: "Every patient receives a written prescription. Copy maintained in records." },
          ],
        },
        {
          code: "MOM-2",
          title: "Storage and dispensing/usage conforms to the guidelines",
          indicators: [
            { num: 54, title: "Medicines/disposables/dental materials are stored as per guidelines", weightage: 100, requiresEvidence: true, requiresPhoto: true, dataType: "scoring", frequency: "QUARTERLY", guidance: "Proper storage conditions maintained. Temperature-sensitive items appropriately stored. Organized and labelled." },
            { num: 55, title: "Expiry dates are checked prior to administering, as applicable", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "MONTHLY", guidance: "System to check expiry dates before use. No expired items in stock. FIFO system followed." },
            { num: 56, title: "Dispensing/utilization is by an authorized person", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "MONTHLY", guidance: "Only authorized personnel dispense/utilize medicines and materials. Authorization list maintained." },
          ],
        },
      ],
    },
    {
      code: "PRE",
      name: "Patient Rights and Education",
      standards: [
        {
          code: "PRE-1",
          title: "There is a system for awareness/education of patients and others regarding the Charter of Rights and Responsibilities for compliance",
          indicators: [
            { num: 57, title: "The Charter of Rights and Responsibilities are displayed and patients/families and staff are guided on it", weightage: 100, requiresEvidence: true, requiresPhoto: true, dataType: "scoring", frequency: "ONE_TIME", guidance: "PHC Charter of Rights and Responsibilities displayed prominently. Staff aware and can explain to patients." },
          ],
        },
        {
          code: "PRE-2",
          title: "There is a system for obtaining consent for treatment",
          indicators: [
            { num: 58, title: "The dental surgeon obtains consent from a patient before examination", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "MONTHLY", guidance: "Consent obtained before examination. Documented in patient records." },
            { num: 59, title: "The clinic has listed situations where specific informed consent is required and the consent is taken accordingly", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "YEARLY", guidance: "List of procedures requiring specific informed consent. Consent forms used and filed in records." },
          ],
        },
        {
          code: "PRE-3",
          title: "Patients and families have a right to information about expected costs",
          indicators: [
            { num: 60, title: "The patient/family is informed about the cost of treatment", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "MONTHLY", guidance: "Fee schedule displayed or communicated. Patients informed of costs before procedures." },
          ],
        },
        {
          code: "PRE-4",
          title: "Patients and families have a right to refuse treatment and lodge a complaint",
          indicators: [
            { num: 61, title: "Patients and families have a right to refuse the treatment", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "YEARLY", guidance: "Right to refuse treatment respected and documented. Refusal forms available." },
            { num: 62, title: "Patients and families have a right to complaint and there is a mechanism to address the grievances", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "QUARTERLY", guidance: "Complaint mechanism established. Complaint box/register available. Complaints tracked and resolved. PHC complaint number displayed." },
          ],
        },
      ],
    },
    {
      code: "IPC",
      name: "Infection Prevention & Control",
      standards: [
        {
          code: "IPC-1",
          title: "The clinic has a well-designed, comprehensive and coordinated infection prevention and control system",
          indicators: [
            { num: 63, title: "The infection prevention and control plan is documented which aims at preventing and reducing risk of nosocomial/cross-infection", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "YEARLY", guidance: "Written IPC plan covering hand hygiene, PPE use, sharps disposal, surface disinfection, instrument sterilization." },
            { num: 64, title: "The clinic has designated staff and defined responsibilities for infection control and waste management activities", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "YEARLY", guidance: "Staff designated for IPC with defined responsibilities. Waste management roles assigned." },
            { num: 65, title: "The clinic has appropriate consumables, collection and handling systems, equipment and facilities for control of infection", weightage: 100, requiresEvidence: true, requiresPhoto: true, dataType: "scoring", frequency: "QUARTERLY", guidance: "PPE available (gloves, masks, gowns, eye protection). Color-coded waste bins. Sharps containers. Hand hygiene stations." },
            { num: 66, title: "ALL staff involved in handling and disposal of dental/clinical waste shall receive regular training in infection control and safe handling of waste", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "HALF_YEARLY", guidance: "Training records for all staff on IPC and waste management. Regular refresher training conducted." },
          ],
        },
        {
          code: "IPC-2",
          title: "There are documented procedures for sterilization activities in the clinic",
          indicators: [
            { num: 67, title: "There is adequate space available for sterilization activities", weightage: 100, requiresEvidence: true, requiresPhoto: true, dataType: "scoring", frequency: "ONE_TIME", guidance: "Designated area for sterilization with proper workflow: dirty to clean. Adequate space for all sterilization activities." },
            { num: 68, title: "Regular validation tests for sterilization are carried out and documented", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "MONTHLY", guidance: "Autoclave validation tests (biological/chemical indicators) performed regularly and documented." },
            { num: 69, title: "There is an established procedure for recall in case of breakdown in the sterilization system", weightage: 100, requiresEvidence: true, requiresDocument: true, dataType: "scoring", frequency: "YEARLY", guidance: "Written SOP for sterilization breakdown. Recall procedure documented. Alternative sterilization arrangements identified." },
          ],
        },
      ],
    },
  ],
};

async function seed() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log("Connected to database.");

  let standardCount = 0;
  let indicatorCount = 0;

  for (const area of DENTAL_CLINICS_MSDS.areas) {
    for (const std of area.standards) {
      const stdCode = `DC-${std.code}`;
      const stdId = `msds-dc-${std.code.toLowerCase()}`;
      const now = new Date().toISOString();

      // Insert MsdsStandard
      await client.query(
        `INSERT INTO "MsdsStandard" (id, code, title, description, category, chapter, section, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (code) DO UPDATE SET title = $3, description = $4, "updatedAt" = $9`,
        [stdId, stdCode, `${std.code}: ${std.title}`, std.title, DENTAL_CLINICS_MSDS.category, area.code, area.name, now, now]
      );
      standardCount++;

      // Insert Indicators
      for (const ind of std.indicators) {
        const indCode = `DC-IND-${String(ind.num).padStart(2, "0")}`;
        const indId = `msds-dc-ind-${String(ind.num).padStart(2, "0")}`;

        await client.query(
          `INSERT INTO "Indicator" (id, code, title, description, guidance, frequency, "requiresEvidence", "requiresPhoto", "requiresDocument", "dataType", "standardId", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (code) DO UPDATE SET title = $3, description = $4, guidance = $5, frequency = $6, "updatedAt" = $13`,
          [
            indId,
            indCode,
            ind.title,
            `Indicator ${ind.num} under ${std.code} (${area.name}). Weightage: ${ind.weightage}%. Requires: ${[ind.requiresEvidence ? "Evidence" : "", ind.requiresPhoto ? "Photo" : "", ind.requiresDocument ? "Document" : ""].filter(Boolean).join(", ")}.`,
            ind.guidance,
            ind.frequency,
            ind.requiresEvidence || false,
            ind.requiresPhoto || false,
            ind.requiresDocument || false,
            ind.dataType || "scoring",
            stdId,
            now,
            now,
          ]
        );
        indicatorCount++;
      }
    }
  }

  console.log(`\nSeeded successfully!`);
  console.log(`  Standards: ${standardCount}`);
  console.log(`  Indicators: ${indicatorCount}`);
  console.log(`  Category: DENTAL_CARE`);
  console.log(`  Functional Areas: ${DENTAL_CLINICS_MSDS.areas.length}`);

  await client.end();
}

seed().catch((e) => {
  console.error("Seed error:", e);
  process.exit(1);
});
