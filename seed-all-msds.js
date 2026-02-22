#!/usr/bin/env node
// seed-all-msds.js - Parse and seed ALL MSDS documents into the database
// Run: node /var/www/phc/seed-all-msds.js

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const DB_URL = "postgresql://phc_admin:PhcMsds2026Secure@localhost:5432/phc_db";
const EXTRACTED_DIR = "/var/www/phc/msds-docs/extracted";

// ═══════════════════════════════════════════════════════════════
// DENTAL CLINICS - 23 Standards, 69 Indicators (manually parsed)
// ═══════════════════════════════════════════════════════════════
const DENTAL_CLINICS = {
  category: "DENTAL_CARE",
  prefix: "DC",
  areas: [
    { code: "ROM", name: "Responsibilities of Management", standards: [
      { code: "ROM-1", title: "The clinic is identifiable as an entity and is easily accessible", indicators: [
        { num: 1, title: "The clinic is identifiable with name and registration/license numbers on the sign board/s", w: 100, freq: "ONE_TIME" },
        { num: 2, title: "The patient/client has easy access to the clinic", w: 80, freq: "ONE_TIME" },
        { num: 3, title: "The dental clinic is registered/licensed with the PHC", w: 100, freq: "YEARLY" },
        { num: 4, title: "Door plate/s clearly display name and qualification/s of the dental surgeon", w: 80, freq: "ONE_TIME" },
        { num: 5, title: "The staff on duty uses identity badge/s", w: 100, freq: "MONTHLY" },
        { num: 6, title: "Consultation hours are displayed", w: 100, freq: "ONE_TIME" },
      ]},
      { code: "ROM-2", title: "The manager and the healthcare service provider/s at the clinic is/are suitably qualified", indicators: [
        { num: 7, title: "The clinic manager is duly designated and has requisite qualifications", w: 100, freq: "ONE_TIME" },
        { num: 8, title: "PMC Registration Certificate of the dental surgeon is displayed", w: 80, freq: "YEARLY" },
      ]},
      { code: "ROM-3", title: "Clinic premises support the scope of work/services", indicators: [
        { num: 9, title: "The size/premises of the dental clinic is as per minimum requirement", w: 80, freq: "ONE_TIME" },
        { num: 10, title: "The dental clinic has adequate facilities for the comfort of the patients", w: 80, freq: "QUARTERLY" },
        { num: 11, title: "The dental clinic has adequate arrangements for the privacy of patients during consultation/examination/procedures", w: 100, freq: "ONE_TIME" },
      ]},
      { code: "ROM-4", title: "The responsibilities of the management are defined", indicators: [
        { num: 12, title: "The dental clinic management intimates any change in scope or portrayal of services to the PHC", w: 100, freq: "YEARLY" },
        { num: 13, title: "The dental clinic management addresses social and community responsibilities", w: 100, freq: "YEARLY" },
      ]},
    ]},
    { code: "FMS", name: "Facility Management and Safety", standards: [
      { code: "FMS-1", title: "The dental clinic staff is aware of, and complies with, the relevant laws and regulations", indicators: [
        { num: 14, title: "The clinic management is conversant with the relevant laws and regulations", w: 100, freq: "YEARLY" },
        { num: 15, title: "The clinic management regularly updates any amendments in the prevailing laws", w: 100, freq: "YEARLY" },
        { num: 16, title: "The management ensures implementation of relevant laws", w: 100, freq: "QUARTERLY" },
        { num: 17, title: "There is a mechanism to regularly update licenses/registrations/certifications", w: 100, freq: "YEARLY" },
        { num: 18, title: "The staff has knowledge about early detection and containment of fire and non-fire emergencies", w: 100, freq: "HALF_YEARLY" },
        { num: 19, title: "Arrangements to combat fire and non-fire emergencies are in place", w: 100, freq: "QUARTERLY" },
      ]},
      { code: "FMS-2", title: "The clinic has a programme for management of dental and support services equipment", indicators: [
        { num: 20, title: "The clinic has equipment in accordance with its scope of services", w: 100, freq: "YEARLY" },
        { num: 21, title: "Qualified and trained personnel operate and maintain the equipment", w: 100, freq: "YEARLY" },
        { num: 22, title: "Equipment is periodically inspected, serviced and calibrated", w: 80, freq: "QUARTERLY" },
      ]},
    ]},
    { code: "HRM", name: "Human Resource Management", standards: [
      { code: "HRM-1", title: "There is documented personnel record of dental surgeon/s and staff", indicators: [
        { num: 23, title: "The personnel record and credentials of all staff are maintained", w: 100, freq: "YEARLY" },
      ]},
      { code: "HRM-2", title: "Employees joining the dental clinic are oriented to the environment and their jobs", indicators: [
        { num: 24, title: "Each employee is appropriately oriented to the overall environment of the dental clinic", w: 80, freq: "YEARLY" },
        { num: 25, title: "Each employee is made aware of the job description", w: 100, freq: "YEARLY" },
        { num: 26, title: "Performance evaluations are based on the JDs", w: 80, freq: "YEARLY" },
        { num: 27, title: "Each employee is made aware of his/her rights and responsibilities and patient rights", w: 100, freq: "YEARLY" },
      ]},
    ]},
    { code: "IMS", name: "Information Management System", standards: [
      { code: "IMS-1", title: "Patient clinical record is maintained at the dental clinic", indicators: [
        { num: 28, title: "Every patient's medical records has a unique identifier and particulars for identification", w: 100, freq: "MONTHLY" },
        { num: 29, title: "Only authorized person/s make entries in the record", w: 100, freq: "MONTHLY" },
        { num: 30, title: "Every record entry is dated, timed and signed", w: 100, freq: "MONTHLY" },
        { num: 31, title: "The record provides an up-to-date and chronological account of patient care", w: 100, freq: "MONTHLY" },
      ]},
    ]},
    { code: "QA", name: "Quality Assurance / Quality Improvement", standards: [
      { code: "QA-1", title: "The dental clinic has Quality Assurance / Improvement System in place", indicators: [
        { num: 32, title: "Service provision is as per portrayal", w: 100, freq: "QUARTERLY" },
        { num: 33, title: "A quality improvement system is practiced", w: 80, freq: "QUARTERLY" },
      ]},
      { code: "QA-2", title: "The clinic identifies key indicators to monitor inputs, processes and outcomes", indicators: [
        { num: 34, title: "Monitoring includes appropriate patient assessment", w: 100, freq: "MONTHLY" },
        { num: 35, title: "Monitoring includes safety and quality control programmes of diagnostic services", w: 100, freq: "QUARTERLY" },
        { num: 36, title: "Monitoring includes ALL invasive procedures and equipment", w: 100, freq: "MONTHLY" },
        { num: 37, title: "Monitoring includes use of anesthetics", w: 100, freq: "MONTHLY" },
        { num: 38, title: "Monitoring includes availability and content of clinic records", w: 100, freq: "MONTHLY" },
      ]},
      { code: "QA-3", title: "Sentinel events are assessed and managed", indicators: [
        { num: 39, title: "The clinic has enlisted the Sentinel Events to be analyzed and managed", w: 100, freq: "YEARLY" },
      ]},
    ]},
    { code: "ACC", name: "Assessment and Continuity of Care", standards: [
      { code: "ACC-1", title: "Portrayed service/s conform to the legal provisions", indicators: [
        { num: 40, title: "The services being provided are displayed as per Code of Ethics", w: 100, freq: "YEARLY" },
        { num: 41, title: "Specialized services being provided conform to the standards", w: 100, freq: "YEARLY" },
        { num: 42, title: "The use and maintenance of specialized equipment conforms to the standards", w: 100, freq: "QUARTERLY" },
        { num: 43, title: "Dental laboratory services conform to the respective requirements", w: 100, freq: "YEARLY" },
        { num: 44, title: "Dental radiological diagnostic services conform to the respective standards", w: 100, freq: "YEARLY" },
        { num: 45, title: "Dental health education is provided as per guidelines", w: 80, freq: "QUARTERLY" },
        { num: 46, title: "Preventive services are provided as per guidelines", w: 80, freq: "QUARTERLY" },
      ]},
    ]},
    { code: "COP", name: "Care of Patients", standards: [
      { code: "COP-1", title: "The clinic has a well-established patient management system", indicators: [
        { num: 47, title: "The clinic has an established registration and guidance process", w: 100, freq: "QUARTERLY" },
        { num: 48, title: "Standard/Ethical practice is evident from the patient record", w: 100, freq: "MONTHLY" },
        { num: 49, title: "The clinic has referral SOPs", w: 100, freq: "YEARLY" },
      ]},
      { code: "COP-2", title: "The clinic has essential arrangements for providing care to emergency cases", indicators: [
        { num: 50, title: "The clinic has essential arrangements to cater for emergency care", w: 100, freq: "QUARTERLY" },
      ]},
    ]},
    { code: "MOM", name: "Management of Medication", standards: [
      { code: "MOM-1", title: "Prescribing practices conform to the standards", indicators: [
        { num: 51, title: "Standards for prescription writing are followed", w: 100, freq: "MONTHLY" },
        { num: 52, title: "Prescriptions are clear, legible, dated, timed, named/stamped and signed", w: 100, freq: "MONTHLY" },
        { num: 53, title: "Prescriptions are provided to the patients", w: 100, freq: "MONTHLY" },
      ]},
      { code: "MOM-2", title: "Storage and dispensing/usage conforms to the guidelines", indicators: [
        { num: 54, title: "Medicines/disposables/dental materials are stored as per guidelines", w: 100, freq: "QUARTERLY" },
        { num: 55, title: "Expiry dates are checked prior to administering", w: 100, freq: "MONTHLY" },
        { num: 56, title: "Dispensing/utilization is by an authorized person", w: 100, freq: "MONTHLY" },
      ]},
    ]},
    { code: "PRE", name: "Patient Rights and Education", standards: [
      { code: "PRE-1", title: "System for awareness/education regarding Charter of Rights and Responsibilities", indicators: [
        { num: 57, title: "The Charter of Rights and Responsibilities are displayed and patients/families are guided", w: 100, freq: "ONE_TIME" },
      ]},
      { code: "PRE-2", title: "There is a system for obtaining consent for treatment", indicators: [
        { num: 58, title: "The dental surgeon obtains consent from a patient before examination", w: 100, freq: "MONTHLY" },
        { num: 59, title: "The clinic has listed situations where specific informed consent is required", w: 100, freq: "YEARLY" },
      ]},
      { code: "PRE-3", title: "Patients and families have a right to information about expected costs", indicators: [
        { num: 60, title: "The patient/family is informed about the cost of treatment", w: 100, freq: "MONTHLY" },
      ]},
      { code: "PRE-4", title: "Patients and families have a right to refuse treatment and lodge a complaint", indicators: [
        { num: 61, title: "Patients and families have a right to refuse the treatment", w: 100, freq: "YEARLY" },
        { num: 62, title: "Patients and families have a right to complain and there is a mechanism to address grievances", w: 100, freq: "QUARTERLY" },
      ]},
    ]},
    { code: "IPC", name: "Infection Prevention & Control", standards: [
      { code: "IPC-1", title: "The clinic has a comprehensive infection prevention and control system", indicators: [
        { num: 63, title: "The infection prevention and control plan is documented", w: 100, freq: "YEARLY" },
        { num: 64, title: "The clinic has designated staff for infection control and waste management", w: 100, freq: "YEARLY" },
        { num: 65, title: "The clinic has appropriate consumables and equipment for control of infection", w: 100, freq: "QUARTERLY" },
        { num: 66, title: "ALL staff receive regular training in infection control and safe handling of waste", w: 100, freq: "HALF_YEARLY" },
      ]},
      { code: "IPC-2", title: "There are documented procedures for sterilization activities", indicators: [
        { num: 67, title: "There is adequate space available for sterilization activities", w: 100, freq: "ONE_TIME" },
        { num: 68, title: "Regular validation tests for sterilization are carried out and documented", w: 100, freq: "MONTHLY" },
        { num: 69, title: "There is an established procedure for recall in case of breakdown in the sterilization system", w: 100, freq: "YEARLY" },
      ]},
    ]},
  ],
};

// ═══════════════════════════════════════════════════════════════
// HOSPITALS (Cat-I, 50+ beds) - 30 Standards, 162 Indicators
// ═══════════════════════════════════════════════════════════════
const HOSPITALS = {
  category: "HOSPITAL_CAT_1",
  prefix: "HOSP",
  areas: [
    { code: "AAC", name: "Access, Assessment and Continuity of Care", standards: [
      { code: "AAC-1", title: "Laboratory services are provided as per the requirements of patients", indicators: [
        { num: 1, title: "Scope of the laboratory services is commensurate to the clinical services", w: 100, freq: "YEARLY" },
        { num: 2, title: "Adequately qualified and trained personnel perform and/or supervise the investigations", w: 100, freq: "YEARLY" },
        { num: 3, title: "Policies and procedures guide specimens collection, identification, handling, transportation, processing and disposal", w: 100, freq: "YEARLY" },
        { num: 4, title: "Laboratory results are available within a defined time frame", w: 100, freq: "QUARTERLY" },
        { num: 5, title: "Critical results are reported immediately to the concerned personnel", w: 100, freq: "MONTHLY" },
        { num: 6, title: "Laboratory tests not available are outsourced to organizations based on their QA system", w: 100, freq: "YEARLY" },
      ]},
      { code: "AAC-2", title: "Imaging services are provided as per the clinical requirements of the patients", indicators: [
        { num: 7, title: "Imaging services comply with legal and other requirements", w: 100, freq: "YEARLY" },
        { num: 8, title: "Scope of the imaging services meets the requirement of the clinical services", w: 100, freq: "YEARLY" },
        { num: 9, title: "Adequately qualified and trained personnel perform, supervise and report imaging services", w: 100, freq: "YEARLY" },
        { num: 10, title: "Policies and procedures guide identification and safe transportation of patients", w: 100, freq: "YEARLY" },
        { num: 11, title: "Imaging results are available within a defined time frame", w: 100, freq: "QUARTERLY" },
        { num: 12, title: "Critical imaging results are intimated immediately to the concerned personnel", w: 100, freq: "MONTHLY" },
        { num: 13, title: "Quality Assurance activities are evident in the Imaging Department", w: 100, freq: "QUARTERLY" },
        { num: 14, title: "Imaging tests not available in the hospital are outsourced to qualified organizations", w: 100, freq: "YEARLY" },
      ]},
    ]},
    { code: "COP", name: "Care of Patients", standards: [
      { code: "COP-1", title: "Emergency services are guided by policies, procedures and applicable laws", indicators: [
        { num: 15, title: "Policies and procedures for emergency care are documented", w: 100, freq: "YEARLY" },
        { num: 16, title: "Policies and procedures for emergency care contain SOPs for handling medico-legal cases", w: 100, freq: "YEARLY" },
        { num: 17, title: "SOPs guide emergency patient assessment and re-assessment processes", w: 100, freq: "YEARLY" },
        { num: 18, title: "Policies and procedures guide the triage of patients for initiation of appropriate care", w: 100, freq: "YEARLY" },
        { num: 19, title: "Staff members are familiar with the policies and trained on the procedures", w: 100, freq: "HALF_YEARLY" },
        { num: 20, title: "Admission or discharge to home or transfer to another organization is documented", w: 100, freq: "MONTHLY" },
      ]},
      { code: "COP-2", title: "Documented policies and procedures guide rational use of blood and blood products", indicators: [
        { num: 21, title: "Documented policies guide rational use of blood and blood products", w: 100, freq: "YEARLY" },
        { num: 22, title: "The transfusion services are governed by the applicable laws and regulations", w: 100, freq: "YEARLY" },
        { num: 23, title: "Informed consent is obtained for donation and transfusion of blood", w: 100, freq: "MONTHLY" },
        { num: 24, title: "Staff members are trained to implement the blood transfusion policies", w: 100, freq: "HALF_YEARLY" },
        { num: 25, title: "Transfusion reactions are analysed for preventive and corrective measures", w: 100, freq: "QUARTERLY" },
      ]},
      { code: "COP-3", title: "Obstetric services at the HCE are guided by policies and procedures", indicators: [
        { num: 26, title: "The organization defines and displays whether high-risk obstetric cases are managed", w: 100, freq: "YEARLY" },
        { num: 27, title: "Persons caring for high-risk obstetric cases are competent", w: 100, freq: "YEARLY" },
        { num: 28, title: "High-risk obstetric patients are assessed for maternal complications", w: 100, freq: "MONTHLY" },
        { num: 29, title: "The organization has facilities and competent staff for managing high-risk obstetric emergencies", w: 100, freq: "YEARLY" },
      ]},
      { code: "COP-4", title: "The administration of anaesthesia is guided by policies and procedures", indicators: [
        { num: 30, title: "No treatment should be administered unless the identity of the patient is positively verified", w: 100, freq: "MONTHLY" },
        { num: 31, title: "There is a documented policy for the administration of anaesthesia", w: 100, freq: "YEARLY" },
        { num: 32, title: "ALL patients for anaesthesia have a pre-anaesthetic assessment by a qualified anaesthetist", w: 100, freq: "MONTHLY" },
        { num: 33, title: "The anaesthetic plan is documented and discussed with the patient/family", w: 100, freq: "MONTHLY" },
        { num: 34, title: "An immediate pre-operative re-evaluation is documented before induction", w: 100, freq: "MONTHLY" },
        { num: 35, title: "Informed consent for administration of anaesthesia is obtained by the anaesthetist", w: 100, freq: "MONTHLY" },
        { num: 36, title: "During anaesthesia, monitoring includes regular recording of heart rate, blood pressure, SpO2 and ECG", w: 100, freq: "MONTHLY" },
        { num: 37, title: "No anaesthetic should be administered unless the identity of the patient is verified", w: 100, freq: "MONTHLY" },
        { num: 38, title: "Each patient's post-anaesthetic status is monitored and documented", w: 100, freq: "MONTHLY" },
        { num: 39, title: "A qualified individual applies defined criteria to transfer the patient from recovery", w: 100, freq: "MONTHLY" },
        { num: 40, title: "All adverse anaesthesia events are recorded and monitored", w: 100, freq: "MONTHLY" },
      ]},
      { code: "COP-5", title: "Surgical care is guided by policies and procedures", indicators: [
        { num: 41, title: "Surgery-related policies and procedures are documented", w: 100, freq: "YEARLY" },
        { num: 42, title: "Surgical patients have a pre-operative assessment and a provisional diagnosis", w: 100, freq: "MONTHLY" },
        { num: 43, title: "Informed consent is obtained by a qualified medical member of the surgical team", w: 100, freq: "MONTHLY" },
        { num: 44, title: "Documented policies exist to prevent adverse events including wrong site/wrong patient surgery", w: 100, freq: "YEARLY" },
        { num: 45, title: "The surgical safety checklist is used and documented", w: 100, freq: "MONTHLY" },
        { num: 46, title: "A brief operative note is documented by the surgeon", w: 100, freq: "MONTHLY" },
        { num: 47, title: "The operating surgeon documents the post-operative plan of care", w: 100, freq: "MONTHLY" },
        { num: 48, title: "The post-operative care plan is modified based on patient monitoring", w: 100, freq: "MONTHLY" },
        { num: 49, title: "The surgical quality assurance programme includes surveillance of complications", w: 100, freq: "QUARTERLY" },
        { num: 50, title: "The plan includes monitoring of surgical site infection rates", w: 100, freq: "QUARTERLY" },
      ]},
    ]},
    { code: "MOM", name: "Management of Medication", standards: [
      { code: "MOM-1", title: "Policies and procedures exist for the prescription of medications", indicators: [
        { num: 51, title: "Documented policies exist for prescription of medications", w: 100, freq: "YEARLY" },
        { num: 52, title: "Standardized drug treatment protocols are observed", w: 100, freq: "YEARLY" },
        { num: 53, title: "Orders are written in a uniform location in the medical records", w: 100, freq: "MONTHLY" },
        { num: 54, title: "Medication orders are clear, legible, dated, timed, named and signed", w: 100, freq: "MONTHLY" },
        { num: 55, title: "Policy on verbal orders is documented and implemented", w: 100, freq: "YEARLY" },
        { num: 56, title: "The organization defines and enlists the high-risk medicines", w: 100, freq: "YEARLY" },
        { num: 57, title: "High-risk medication orders are verified prior to dispensing/administration", w: 100, freq: "MONTHLY" },
      ]},
      { code: "MOM-2", title: "Policies and procedures guide safe storage, dispensing and administration of medications", indicators: [
        { num: 58, title: "There are SOPs to guide safe storage and dispensing of medicines", w: 100, freq: "QUARTERLY" },
        { num: 59, title: "The policies include a procedure for medication recall", w: 100, freq: "YEARLY" },
        { num: 60, title: "Expiry dates are checked and documented prior to dispensing", w: 100, freq: "MONTHLY" },
        { num: 61, title: "Documented policies for the use of patients' own medications brought from outside", w: 100, freq: "YEARLY" },
        { num: 62, title: "Medications are administered by those who are permitted by regulations", w: 100, freq: "MONTHLY" },
        { num: 63, title: "Prepared medications are labelled prior to preparation of a second drug", w: 100, freq: "MONTHLY" },
        { num: 64, title: "The patient is identified prior to medication administration", w: 100, freq: "MONTHLY" },
        { num: 65, title: "Medication is verified from the order prior to administration", w: 100, freq: "MONTHLY" },
        { num: 66, title: "Dosage is verified from the order prior to administration", w: 100, freq: "MONTHLY" },
        { num: 67, title: "Route is verified from the order prior to administration", w: 100, freq: "MONTHLY" },
        { num: 68, title: "Timing is verified from the order prior to administration", w: 100, freq: "MONTHLY" },
        { num: 69, title: "Medication administered is documented", w: 100, freq: "MONTHLY" },
        { num: 70, title: "Policies govern patient's self-administration of medications", w: 100, freq: "YEARLY" },
        { num: 71, title: "Policies govern patient's medications brought from outside", w: 100, freq: "YEARLY" },
      ]},
      { code: "MOM-3", title: "Adverse drug events are reported, tracked and trended and used for QI", indicators: [
        { num: 72, title: "There is a system for reporting adverse drug events", w: 100, freq: "QUARTERLY" },
        { num: 73, title: "Adverse drug events are tracked and trended", w: 100, freq: "QUARTERLY" },
        { num: 74, title: "Data from adverse drug events is used for quality improvement", w: 100, freq: "QUARTERLY" },
      ]},
    ]},
    { code: "PRE", name: "Patient Rights and Education", standards: [
      { code: "PRE-1", title: "Patients have a right to obtain information about their healthcare and treatment", indicators: [
        { num: 75, title: "Charter of rights and responsibilities is displayed", w: 100, freq: "ONE_TIME" },
        { num: 76, title: "Patients and families are informed about their rights and responsibilities", w: 100, freq: "MONTHLY" },
        { num: 77, title: "Patient and families have a right to refuse treatment", w: 100, freq: "YEARLY" },
        { num: 78, title: "Patient and families have a right to information about expected costs", w: 100, freq: "MONTHLY" },
      ]},
      { code: "PRE-2", title: "A documented process exists for obtaining patient consent", indicators: [
        { num: 79, title: "Informed consent is obtained before any procedure or treatment", w: 100, freq: "MONTHLY" },
        { num: 80, title: "The policy describes who can give consent when patient is incapable", w: 100, freq: "YEARLY" },
        { num: 81, title: "Consent is obtained before administration of anaesthesia and blood transfusion", w: 100, freq: "MONTHLY" },
      ]},
      { code: "PRE-3", title: "Patients have the right to lodge complaints", indicators: [
        { num: 82, title: "Patients and families have a right to lodge complaints", w: 100, freq: "QUARTERLY" },
        { num: 83, title: "There is a documented complaint management process", w: 100, freq: "QUARTERLY" },
      ]},
    ]},
    { code: "IPC", name: "Infection Prevention and Control", standards: [
      { code: "IPC-1", title: "The HCE has a comprehensive infection prevention and control programme", indicators: [
        { num: 84, title: "The infection prevention and control plan is documented", w: 100, freq: "YEARLY" },
        { num: 85, title: "There is an active IPC Committee with defined responsibilities", w: 100, freq: "YEARLY" },
        { num: 86, title: "A qualified infection control nurse/officer is designated", w: 100, freq: "YEARLY" },
        { num: 87, title: "Appropriate consumables and equipment for infection control are available", w: 100, freq: "QUARTERLY" },
        { num: 88, title: "ALL staff receive regular training in infection control and waste management", w: 100, freq: "HALF_YEARLY" },
      ]},
      { code: "IPC-2", title: "There are documented procedures for sterilization and disinfection", indicators: [
        { num: 89, title: "There are documented SOPs for sterilization processes", w: 100, freq: "YEARLY" },
        { num: 90, title: "Regular validation tests for sterilization are carried out", w: 100, freq: "MONTHLY" },
        { num: 91, title: "Hand hygiene protocols are documented and practiced", w: 100, freq: "MONTHLY" },
        { num: 92, title: "Hospital waste management follows the relevant rules and regulations", w: 100, freq: "QUARTERLY" },
      ]},
    ]},
    { code: "CQI", name: "Continuous Quality Improvement", standards: [
      { code: "CQI-1", title: "The HCE has a structured Quality Improvement system in place", indicators: [
        { num: 93, title: "A comprehensive QI plan is developed and maintained by a notified CQI Committee", w: 100, freq: "YEARLY" },
        { num: 94, title: "There is a designated individual for coordinating and implementing the QI programme", w: 100, freq: "YEARLY" },
        { num: 95, title: "The QI programme is communicated to ALL employees through training", w: 100, freq: "HALF_YEARLY" },
        { num: 96, title: "The QI programme is updated at least once a year", w: 100, freq: "YEARLY" },
      ]},
      { code: "CQI-2", title: "Monitoring systems for CQI exist at the HCE", indicators: [
        { num: 97, title: "Monitoring includes appropriate patient assessment", w: 100, freq: "MONTHLY" },
        { num: 98, title: "Monitoring includes safety and quality control of diagnostic services", w: 100, freq: "QUARTERLY" },
        { num: 99, title: "Monitoring includes ALL invasive procedures and equipment", w: 100, freq: "MONTHLY" },
        { num: 100, title: "Monitoring includes use of anaesthetics", w: 100, freq: "MONTHLY" },
        { num: 101, title: "Monitoring includes adverse drug events and near misses", w: 100, freq: "MONTHLY" },
        { num: 102, title: "Monitoring includes availability and content of medical records", w: 100, freq: "MONTHLY" },
        { num: 103, title: "Monitoring includes infection control activities", w: 100, freq: "MONTHLY" },
        { num: 104, title: "Monitoring includes clinical research activities", w: 80, freq: "QUARTERLY" },
      ]},
      { code: "CQI-3", title: "Sentinel events are intensively analysed", indicators: [
        { num: 105, title: "The HCE has defined sentinel events", w: 100, freq: "YEARLY" },
        { num: 106, title: "Sentinel events are intensively analysed when they occur", w: 100, freq: "QUARTERLY" },
      ]},
    ]},
    { code: "ROM", name: "Responsibilities of Management", standards: [
      { code: "ROM-1", title: "The management establishes the HCE's mission, vision and goals", indicators: [
        { num: 107, title: "The management has established the HCE's mission and vision", w: 100, freq: "ONE_TIME" },
        { num: 108, title: "The management has established the HCE's organogram", w: 100, freq: "ONE_TIME" },
        { num: 109, title: "The management appoints competent professionals per the organogram", w: 100, freq: "YEARLY" },
        { num: 110, title: "The management appoints a technically qualified professional to head the HCE", w: 100, freq: "ONE_TIME" },
      ]},
      { code: "ROM-2", title: "Those responsible for management lay down policies and SOPs", indicators: [
        { num: 111, title: "Standing orders and SOPs are documented", w: 100, freq: "YEARLY" },
        { num: 112, title: "SOPs for emergency situations are in place", w: 100, freq: "YEARLY" },
        { num: 113, title: "Security SOPs are in place", w: 100, freq: "YEARLY" },
        { num: 114, title: "The management monitors and measures performance", w: 100, freq: "QUARTERLY" },
        { num: 115, title: "The management addresses social and community responsibilities", w: 80, freq: "YEARLY" },
        { num: 116, title: "The management supports research activities", w: 80, freq: "YEARLY" },
      ]},
    ]},
    { code: "FMS", name: "Facility Management and Safety", standards: [
      { code: "FMS-1", title: "The HCE is identifiable and accessible", indicators: [
        { num: 117, title: "The HCE is identifiable with signboard conforming to legal requirements", w: 100, freq: "ONE_TIME" },
        { num: 118, title: "The HCE is registered/licensed with PHC", w: 100, freq: "YEARLY" },
        { num: 119, title: "The staff on duty uses the authorized identity badge", w: 100, freq: "MONTHLY" },
      ]},
      { code: "FMS-2", title: "The HCE has plans for fire and non-fire emergencies", indicators: [
        { num: 120, title: "Plans and provisions for early detection of fire and non-fire emergencies", w: 100, freq: "YEARLY" },
        { num: 121, title: "Provisions for abatement of fire and non-fire emergencies", w: 100, freq: "YEARLY" },
        { num: 122, title: "Provisions for containment of fire and non-fire emergencies", w: 100, freq: "YEARLY" },
        { num: 123, title: "Safe exit points are displayed", w: 100, freq: "ONE_TIME" },
        { num: 124, title: "Mock drills are conducted at least once in a year", w: 100, freq: "YEARLY" },
        { num: 125, title: "Staff members are trained for their role in emergencies", w: 100, freq: "HALF_YEARLY" },
      ]},
      { code: "FMS-3", title: "The HCE has a system for management of equipment", indicators: [
        { num: 126, title: "The HCE has equipment in accordance with the scope of its services", w: 100, freq: "YEARLY" },
        { num: 127, title: "Equipment is operated and maintained by qualified/trained personnel", w: 100, freq: "YEARLY" },
        { num: 128, title: "Equipment is periodically inspected, serviced and calibrated", w: 100, freq: "QUARTERLY" },
      ]},
    ]},
    { code: "HRM", name: "Human Resource Management", standards: [
      { code: "HRM-1", title: "Staff deployment is in accordance with scope of services", indicators: [
        { num: 129, title: "Eligibility criteria for each job are available", w: 100, freq: "ONE_TIME" },
        { num: 130, title: "Recruitment is made according to the laid down criteria", w: 100, freq: "YEARLY" },
        { num: 131, title: "Job description for every post is defined and documented", w: 100, freq: "ONE_TIME" },
        { num: 132, title: "Requisite staff is available for provision of portrayed services", w: 100, freq: "YEARLY" },
      ]},
      { code: "HRM-2", title: "Staff joining the HCE are oriented to the environment and their jobs", indicators: [
        { num: 133, title: "There is an appropriate orientation plan for newly inducted staff", w: 100, freq: "YEARLY" },
        { num: 134, title: "Each staff member is aware of his/her rights and responsibilities", w: 100, freq: "YEARLY" },
        { num: 135, title: "All employees are educated about patient rights and responsibilities", w: 100, freq: "YEARLY" },
        { num: 136, title: "Staff receives refresher training/certification regularly", w: 100, freq: "HALF_YEARLY" },
      ]},
      { code: "HRM-3", title: "An appraisal system for evaluating employee performance exists", indicators: [
        { num: 137, title: "There is a well-documented performance appraisal system", w: 100, freq: "YEARLY" },
        { num: 138, title: "All employees are made aware of the performance appraisal tools", w: 100, freq: "YEARLY" },
        { num: 139, title: "The appraisal is used as a tool for further development", w: 80, freq: "YEARLY" },
        { num: 140, title: "Performance appraisal is carried out at pre-defined intervals", w: 100, freq: "YEARLY" },
      ]},
      { code: "HRM-4", title: "Documented personnel record for each staff member exists", indicators: [
        { num: 141, title: "Personal files are maintained for all full time/part time employees", w: 100, freq: "YEARLY" },
      ]},
      { code: "HRM-5", title: "System for verifying credentials of professionals exists", indicators: [
        { num: 142, title: "System for verification of documents and certificates exists", w: 100, freq: "YEARLY" },
        { num: 143, title: "Only medical professionals permitted by law provide patient care without supervision", w: 100, freq: "YEARLY" },
      ]},
    ]},
    { code: "IMS", name: "Information Management System", standards: [
      { code: "IMS-1", title: "The HCE has complete and accurate medical record for every patient", indicators: [
        { num: 144, title: "Every medical record has a unique identifier", w: 100, freq: "MONTHLY" },
        { num: 145, title: "The staff authorized to make entries is reflected in policy/SOPs", w: 100, freq: "YEARLY" },
        { num: 146, title: "Every medical record entry is dated, timed and signed", w: 100, freq: "MONTHLY" },
        { num: 147, title: "Complete medical record of the patients is maintained", w: 100, freq: "MONTHLY" },
        { num: 148, title: "The progress notes are recorded by the responsible professionals", w: 100, freq: "MONTHLY" },
        { num: 149, title: "Every dormant record has a discharge summary", w: 100, freq: "MONTHLY" },
        { num: 150, title: "SOPs for safety and security of patient record exist and are practiced", w: 100, freq: "YEARLY" },
        { num: 151, title: "Authorized care providers have access to current and past medical records", w: 100, freq: "MONTHLY" },
      ]},
      { code: "IMS-2", title: "The HCE regularly carries out review of medical records", indicators: [
        { num: 152, title: "Medical records are reviewed regularly/periodically", w: 100, freq: "QUARTERLY" },
        { num: 153, title: "The review focuses on timeliness, legibility and completeness of records", w: 100, freq: "QUARTERLY" },
        { num: 154, title: "Any deficiency found and corrective measures taken are documented", w: 100, freq: "QUARTERLY" },
      ]},
      { code: "IMS-3", title: "Aggregate data/information supports patient care and HCE management", indicators: [
        { num: 155, title: "Aggregate data on demographics and diagnoses is available", w: 80, freq: "QUARTERLY" },
        { num: 156, title: "Aggregate data on procedures and outcomes is available", w: 80, freq: "QUARTERLY" },
        { num: 157, title: "Aggregate data on infections and complications is available", w: 100, freq: "QUARTERLY" },
        { num: 158, title: "Aggregate data on mortality and morbidity is available", w: 100, freq: "QUARTERLY" },
        { num: 159, title: "Data is compared over time and against benchmarks", w: 80, freq: "QUARTERLY" },
        { num: 160, title: "Data supports quality improvement activities", w: 80, freq: "QUARTERLY" },
        { num: 161, title: "Data supports infection prevention and control", w: 100, freq: "QUARTERLY" },
        { num: 162, title: "Data supports facility management decisions", w: 80, freq: "QUARTERLY" },
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

  // Seed Dental Clinics
  console.log("═══ Seeding DENTAL CLINICS ═══");
  const dc = await seedDocument(client, DENTAL_CLINICS);
  console.log(`  Standards: ${dc.standardCount}, Indicators: ${dc.indicatorCount}\n`);

  // Seed Hospitals
  console.log("═══ Seeding HOSPITALS (Cat-I) ═══");
  const hosp = await seedDocument(client, HOSPITALS);
  console.log(`  Standards: ${hosp.standardCount}, Indicators: ${hosp.indicatorCount}\n`);

  // Summary
  const totalStd = dc.standardCount + hosp.standardCount;
  const totalInd = dc.indicatorCount + hosp.indicatorCount;

  console.log("════════════════════════════════");
  console.log(`TOTAL SEEDED:`);
  console.log(`  Standards: ${totalStd}`);
  console.log(`  Indicators: ${totalInd}`);
  console.log(`  Categories: DENTAL_CARE, HOSPITAL_CAT_1`);
  console.log("════════════════════════════════");

  // Verify
  const stdCount = await client.query('SELECT COUNT(*) FROM "MsdsStandard"');
  const indCount = await client.query('SELECT COUNT(*) FROM "Indicator"');
  console.log(`\nDB Verification:`);
  console.log(`  MsdsStandard rows: ${stdCount.rows[0].count}`);
  console.log(`  Indicator rows: ${indCount.rows[0].count}`);

  await client.end();
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
