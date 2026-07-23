const db = require('../../etl-db');

function getFacilityBills(locationUuid, billingDate) {
  if (!locationUuid) {
    throw new Error('Location not defined');
  }
  if (!billingDate) {
    throw new Error('Billing Date not defined');
  }
  return new Promise((resolve, reject) => {
    const sql = `SELECT 
    cb.uuid as bill_uuid,
    cb.receipt_number,
    UPPER(CONCAT_WS(' ',
                    pn.given_name,
                    pn.middle_name,
                    pn.family_name)) AS patient_name,
    cp.name AS cash_point,
    DATE_FORMAT(MAX(cb.date_created), '%Y-%m-%d %H:%i') AS bill_date,
    GROUP_CONCAT(cb.status) AS paid_status,
    p.uuid AS patient_uuid,
    bo.consent_token,
    id.identifier as 'national_id',
    cr.identifier as 'cr_id',
    vt.name AS 'visit_type'
FROM
    amrs.cashier_bill cb
        INNER JOIN
    amrs.cashier_cash_point cp ON (cp.cash_point_id = cb.cash_point_id)
        INNER JOIN
    amrs.location l ON (l.location_id = cp.location_id)
        INNER JOIN
    amrs.person p ON (p.person_id = cb.patient_id
        AND p.voided = 0)
        INNER JOIN
    amrs.person_name pn ON (pn.person_id = p.person_id
        AND pn.voided = 0)
       LEFT JOIN
    hie.bill_orders bo ON (bo.bill_uuid = cb.uuid)
       LEFT JOIN
    amrs.patient_identifier cr ON (cr.patient_id = cb.patient_id
        AND cr.identifier_type = 55
        AND cr.voided = 0)
      LEFT JOIN
    amrs.patient_identifier id ON (id.patient_id = cb.patient_id
        AND id.identifier_type = 5
        AND id.voided = 0)
      LEFT JOIN
    amrs.visit v ON (v.visit_id = cb.visit_id)
      LEFT JOIN
    amrs.visit_type vt ON (vt.visit_type_id = v.visit_type_id)
WHERE
    cb.voided = 0
        AND DATE(cb.date_created) = DATE('${billingDate}')
        AND l.uuid = '${locationUuid}'
GROUP BY cb.patient_id
ORDER BY cb.date_created DESC;`;
    const queryParts = {
      sql: sql
    };
    db.queryServer(queryParts, function (result) {
      result.sql = sql;
      resolve(result.result);
    });
  });
}

function getPatientFacilityBillDetails(locationUuid, billingDate, patientUuid) {
  if (!locationUuid) {
    throw new Error('Location not defined');
  }
  if (!billingDate) {
    throw new Error('Billing Date not defined');
  }
  if (!patientUuid) {
    throw new Error('PatientUuid not defined');
  }
  return new Promise((resolve, reject) => {
    const sql = `SELECT 
    cb.uuid as bill_uuid,
    cb.receipt_number,
    UPPER(CONCAT_WS(' ',
                    pn.given_name,
                    pn.middle_name,
                    pn.family_name)) AS patient_name,
    cp.name AS cash_point,
    DATE_FORMAT(cb.date_created, '%Y-%m-%d %H:%i') AS bill_date,
    cb.status AS paid_status,
    p.uuid AS patient_uuid,
    cbl.bill_line_item_id,
    cbs.name AS billable_service,
    cbl.price AS item_price,
    UPPER(cbl.price_name) AS payment_scheme,
    cbl.status,
    cbl.quantity AS item_quantity,
    (cbl.price * cbl.quantity) AS item_total_price,
    cbl.uuid as cashier_bill_line_item_uuid,
    cbl.date_created as bill_item_time,
    cr.identifier as cr_no,
    u.identifier as amrs_universal_id,
    bo.intervention_code,
    bo.consent_token,
    bo.order_no,
    bo.service_type,
    CASE
      WHEN cl.id IS NOT NULL AND clr.id IS NULL THEN 1
      ELSE 0
    END AS has_claim_line
FROM
    amrs.cashier_bill cb
        INNER JOIN
    amrs.cashier_cash_point cp ON (cp.cash_point_id = cb.cash_point_id)
        INNER JOIN
    amrs.location l ON (l.location_id = cp.location_id)
        LEFT JOIN
    amrs.person p ON (p.person_id = cb.patient_id
        AND p.voided = 0)
        LEFT JOIN
    amrs.person_name pn ON (pn.person_id = p.person_id
        AND pn.voided = 0)
        LEFT JOIN
    amrs.cashier_bill_line_item cbl ON (cbl.bill_id = cb.bill_id)
        LEFT JOIN
    amrs.cashier_billable_service cbs ON (cbs.service_id = cbl.service_id)
         LEFT JOIN
    amrs.patient_identifier cr ON (cr.patient_id = p.person_id
        AND cr.identifier_type = 55
        AND cr.voided = 0)
        LEFT JOIN
    amrs.patient_identifier u ON (u.patient_id = p.person_id
        AND u.identifier_type = 8
        AND u.voided = 0)
        LEFT JOIN
    hie.bill_orders bo ON (bo.line_item_uuid = cbl.uuid)
        LEFT JOIN
    hie.claim_line cl ON (cl.consent_token COLLATE utf8mb4_unicode_ci = bo.consent_token
        AND cl.intervention_code COLLATE utf8mb4_unicode_ci = bo.intervention_code)
        LEFT JOIN
    hie.claim_line clr ON (cl.consent_token = clr.consent_token
        AND cl.intervention_code = clr.intervention_code AND clr.claim_line_action = 'REMOVE')
WHERE
    cb.voided = 0
        AND DATE(cb.date_created) = DATE('${billingDate}')
        AND p.uuid = '${patientUuid}'
        AND l.uuid = '${locationUuid}'
        AND cbl.voided = 0
group by cbl.uuid
ORDER BY cb.date_created asc;`;
    const queryParts = {
      sql: sql
    };
    db.queryServer(queryParts, function (result) {
      result.sql = sql;
      resolve(result.result);
    });
  });
}
function getPatientBillPayments(billingDate, patientUuid) {
  if (!billingDate) {
    throw new Error('Billing Date not defined');
  }
  if (!patientUuid) {
    throw new Error('PatientUuid not defined');
  }
  return new Promise((resolve, reject) => {
    const sql = `SELECT 
    cb.bill_id,
    cb.receipt_number,
    cb.patient_id,
    cb.status,
    p.uuid AS patient_uuid,
    cbp.uuid AS cashier_bill_payment_uuid,
    cbp.payment_mode_id,
    cbp.amount,
    cbp.amount_tendered,
    cbp.date_created AS 'payment_time',
    pm.name AS payment_mode
FROM
    amrs.cashier_bill cb
        INNER JOIN
    amrs.person p ON (p.person_id = cb.patient_id)
        INNER JOIN
    amrs.cashier_bill_payment cbp ON (cbp.bill_id = cb.bill_id)
        INNER JOIN
    amrs.cashier_payment_mode pm ON (pm.payment_mode_id = cbp.payment_mode_id)
WHERE
    DATE(cb.date_created) = DATE('${billingDate}')
        AND p.uuid = '${patientUuid}'
        AND cb.voided = 0
        AND cbp.voided = 0;`;
    const queryParts = {
      sql: sql
    };
    db.queryServer(queryParts, function (result) {
      result.sql = sql;
      resolve(result.result);
    });
  });
}
function getPatientDiagnosis(visitDate, patientUuid, locationUuid) {
  const problemAddedConceptUuid = 'a8ae835e-1350-11df-a1f1-0026b9348838';
  const icd11SourceUuid = '43aaca5f-d623-43fd-993b-673b5d927cdd';
  const providerNationalIdUuid = '4550df92-c684-4597-8ab8-d6b10eabdcfb';
  const providerSpecialityUuid = 'c73daf69-ddd0-4fce-98ec-6f9d875193e3';
  if (!visitDate) {
    throw new Error('Billing Date not defined');
  }
  if (!patientUuid) {
    throw new Error('PatientUuid not defined');
  }
  if (!locationUuid) {
    throw new Error('Locationuuid not defined');
  }
  return new Promise((resolve, reject) => {
    const sql = `SELECT 
    b.*,
    MAX(b.national_id) AS 'practioner_nat_id',
    MAX(b.speciality) AS 'practitioner_speciality',
    'National ID' AS 'practitioner_identifier_type',
    CASE
        WHEN MAX(b.speciality) = 'MEDICINE' THEN 'KMPDC'
        WHEN MAX(b.speciality) = 'CLINICAL OFFICER' THEN 'COC'
        ELSE 'KMPDC'
    END AS 'practitioner_body'
FROM
    (SELECT 
        e.patient_id,
            e.encounter_id,
            e.encounter_datetime,
            l.name AS 'facility',
            et.name AS 'encounter_type',
            ob.concept_id,
            ob.value_coded,
            crs.name AS 'concept_source_name',
            crs.hl7_code,
            crt.code AS icd11_code,
            ep.provider_id,
            CASE
                WHEN pat.uuid = '${providerNationalIdUuid}' THEN pa.value_reference
                ELSE NULL
            END AS national_id,
            CASE
                WHEN pat.uuid = '${providerSpecialityUuid}' THEN pa.value_reference
                ELSE NULL
            END AS speciality,
            pat.uuid
    FROM
        amrs.encounter e
    JOIN amrs.person p ON (e.patient_id = p.person_id)
    JOIN amrs.location l ON (e.location_id = l.location_id)
    JOIN amrs.encounter_type et ON (et.encounter_type_id = e.encounter_type)
    JOIN amrs.obs ob ON (ob.encounter_id = e.encounter_id)
    JOIN amrs.concept c ON (c.concept_id = ob.concept_id)
    JOIN amrs.concept vc ON (vc.concept_id = ob.value_coded)
    JOIN amrs.concept_reference_map crm ON (crm.concept_id = vc.concept_id)
    JOIN amrs.concept_reference_term crt ON (crm.concept_reference_term_id = crt.concept_reference_term_id)
    JOIN amrs.concept_reference_source crs ON (crs.concept_source_id = crt.concept_source_id)
    LEFT JOIN amrs.encounter_provider ep ON (ep.encounter_id = e.encounter_id)
    LEFT JOIN amrs.provider_attribute pa ON (pa.provider_id = ep.provider_id)
    LEFT JOIN amrs.provider_attribute_type pat ON (pat.provider_attribute_type_id = pa.attribute_type_id)
    WHERE
        p.uuid = '${patientUuid}'
            AND DATE(e.encounter_datetime) = DATE('${visitDate}')
            AND l.uuid = '${locationUuid}'
            AND e.voided = 0
            AND c.uuid = '${problemAddedConceptUuid}'
            AND ob.voided = 0
            AND crs.uuid = '${icd11SourceUuid}'
            AND pat.uuid IN ('${providerNationalIdUuid}' , '${providerSpecialityUuid}')) b
GROUP BY b.value_coded;`;
    const queryParts = {
      sql: sql
    };
    db.queryServer(queryParts, function (result) {
      result.sql = sql;
      resolve(result.result);
    });
  });
}
function getActiveProviders() {
  return new Promise((resolve, reject) => {
    const sql = `SELECT 
    b.provider_uuid AS uuid,
    CONCAT(b.provider_names,
            ' - ',
            '(',
            b.provider_speciality,
            ') ',
            '(',
            b.licensing_body,
            ') ',
            '(',
            b.provider_license_status,
            ')') AS display,
    b.provider_national_id,
    b.licensing_body
FROM
    (SELECT 
        pr.uuid AS provider_uuid,
            pr.provider_id,
            pr.identifier,
            pr.person_id,
            pa.value_reference AS 'provider_national_id',
            pls.value_reference AS 'provider_license_status',
            provider_speciality.value_reference AS 'provider_speciality',
            lb.value_reference AS 'licensing_body',
            CONCAT_WS(' ', pn.given_name, pn.middle_name, pn.family_name) AS provider_names
    FROM
        amrs.provider pr
    JOIN amrs.person p ON (p.person_id = pr.person_id
        AND p.voided = 0)
    JOIN amrs.provider_attribute pa ON (pa.provider_id = pr.provider_id
        AND pa.voided = 0
        AND pa.attribute_type_id = 5)
    JOIN amrs.provider_attribute pls ON (pls.provider_id = pr.provider_id
        AND pa.voided = 0
        AND pls.attribute_type_id = 7 AND pls.value_reference = 'Licensed')
    JOIN amrs.provider_attribute provider_licence_status ON (provider_licence_status.provider_id = pr.provider_id
        AND provider_licence_status.voided = 0
        AND provider_licence_status.attribute_type_id = 7)
    JOIN amrs.provider_attribute provider_speciality ON (provider_speciality.provider_id = pr.provider_id
        AND provider_speciality.voided = 0
        AND provider_speciality.attribute_type_id = 8)
    JOIN amrs.provider_attribute lb ON (lb.provider_id = pr.provider_id
        AND lb.voided = 0
        AND lb.attribute_type_id = 9)
    JOIN amrs.person_name pn ON (pn.person_id = p.person_id
        AND pn.voided = 0)
    WHERE
        pr.retired = 0
    GROUP BY pr.provider_id) b;`;
    const queryParts = {
      sql: sql
    };
    db.queryServer(queryParts, function (result) {
      result.sql = sql;
      resolve(result.result);
    });
  });
}

function getFacilityEncounterBills(
  locationUuid,
  encounterTypeUuid,
  billingFrom
) {
  if (!locationUuid) {
    throw new Error('Location not defined');
  }
  if (!billingFrom) {
    throw new Error('Billing From not defined');
  }
  if (!encounterTypeUuid) {
    throw new Error('Encounter type not defined');
  }
  return new Promise((resolve, reject) => {
    const sql = `SELECT
    e.encounter_datetime,
    cb.date_created,
    cb.uuid as bill_uuid,
    cb.receipt_number,
    UPPER(CONCAT_WS(' ',
                      pn.given_name,
                      pn.middle_name,
                      pn.family_name)) AS patient_name,
        cb.status AS bill_status,
      p.uuid AS patient_uuid,
      bpam.date_started,
      bpam.date_stopped,
      b.bed_number
  FROM
    amrs.encounter e
  LEFT JOIN amrs.encounter_type et ON
    et.encounter_type_id = e.encounter_type
  LEFT JOIN 
    amrs.bed_patient_assignment_map bpam ON
    bpam.encounter_id = e.encounter_id 
  LEFT JOIN
    amrs.bed b ON b.bed_id = bpam.bed_id 
  LEFT JOIN amrs.cashier_bill cb ON
    cb.patient_id = e.patient_id
      AND cb.date_created >= e.encounter_datetime
  LEFT JOIN amrs.cashier_cash_point cp ON
    (cp.cash_point_id = cb.cash_point_id)
  INNER JOIN
      amrs.location l ON
    (l.location_id = cp.location_id)
  INNER JOIN
      amrs.person p ON
    (p.person_id = cb.patient_id
      AND p.voided = 0)
  INNER JOIN
      amrs.person_name pn ON
    (pn.person_id = p.person_id
      AND pn.voided = 0)
  WHERE
    cb.voided = 0
    AND
    et.uuid = '${encounterTypeUuid}'
    AND l.uuid = '${locationUuid}'
    AND DATE(e.encounter_datetime) >= DATE('${billingFrom}')
  GROUP BY
    e.patient_id
  ORDER BY
	e.encounter_datetime DESC;`;
    const queryParts = {
      sql: sql
    };
    db.queryServer(queryParts, function (result) {
      result.sql = sql;
      resolve(result.result);
    });
  });
}

function getDischargeDiagnisisAndDictor(patientUuid, billingDate) {
  if (!patientUuid) {
    throw new Error('patient not defined');
  }
  if (!billingDate) {
    throw new Error('Billing Date not defined');
  }
  return new Promise((resolve, reject) => {
    const sql = `select
b.value_numeric,
b.uuid,
'National ID' AS 'practitioner_identifier_type',
b.practioner_nat_id,
group_concat(b.practitioner_body) AS practitioner_body,
group_concat(b.practitioner_speciality) AS practitioner_speciality,
b.concept_source_name,
b.hl7_code,
b.icd11_code,
encounter_type,
encounter_datetime
from
(
SELECT 
    obs.value_numeric,
    p.uuid,
    pa.value_reference as practioner_nat_id,
    sp.value_reference as 'practitioner_speciality',
    CASE
        WHEN lb.value_reference = 'MEDICINE' THEN 'KMPDC'
        WHEN lb.value_reference = 'CLINICAL OFFICER' THEN 'COC'
        ELSE 'KMPDC'
    END AS 'practitioner_body',
    pr.provider_id,
	dobs.concept_id,
	dobs.value_coded,
	crs.name AS 'concept_source_name',
	crs.hl7_code,
    crt.code AS icd11_code,
    et.name as encounter_type,
    e.encounter_datetime
FROM
   amrs.person p
   join amrs.obs obs on (p.person_id = obs.person_id)
   join amrs.encounter e on (e.encounter_id = obs.encounter_id)
   join amrs.encounter_type et on (et.encounter_type_id = e.encounter_type)
   join amrs.provider_attribute pid on (pid.attribute_type_id = 5 AND pid.voided = 0 AND pid.value_reference = obs.value_numeric)
   join amrs.provider pr on (pr.provider_id = pid.provider_id)
   join amrs.provider_attribute pa on (pa.attribute_type_id = 5 AND pa.voided = 0 AND pa.provider_id = pr.provider_id)
   join amrs.provider_attribute sp on (sp.attribute_type_id = 8 AND sp.voided = 0 AND sp.provider_id = pr.provider_id AND sp.value_reference IS NOT NULL)
   join amrs.provider_attribute lb on (lb.attribute_type_id = 9 AND lb.voided = 0 AND lb.provider_id = pr.provider_id)
   join amrs.obs dobs on (dobs.encounter_id = obs.encounter_id AND dobs.concept_id = 5630 AND dobs.voided = 0)
   JOIN amrs.concept vc ON (vc.concept_id = dobs.value_coded)
   JOIN amrs.concept_reference_map crm ON (crm.concept_id = vc.concept_id)
   JOIN amrs.concept_reference_term crt ON (crm.concept_reference_term_id = crt.concept_reference_term_id)
   JOIN amrs.concept_reference_source crs ON (crs.concept_source_id = crt.concept_source_id AND crs.concept_source_id = 23)
WHERE
    obs.concept_id = 5507
    AND obs.voided = 0
    and p.uuid = '${patientUuid}'
    AND DATE(obs.obs_datetime) >= DATE('${billingDate}') 
    AND DATE(obs.obs_datetime) <= DATE_ADD('${billingDate}', INTERVAL 2 DAY)
    group by p.person_id) b`;
    const queryParts = {
      sql: sql
    };
    db.queryServer(queryParts, function (result) {
      result.sql = sql;
      resolve(result.result);
    });
  });
}

function getPatientFacilityPreAuthBills(locationUuid, billingDate) {
  if (!locationUuid) {
    throw new Error('Location not defined');
  }
  if (!billingDate) {
    throw new Error('Billing Date not defined');
  }
  return new Promise((resolve, reject) => {
    const sql = `SELECT 
    cp.name AS cash_point,
    DATE_FORMAT(cb.date_created, '%Y-%m-%d %H:%i') AS bill_date,
    UPPER(CONCAT_WS(' ',
                    pn.given_name,
                    pn.middle_name,
                    pn.family_name)) AS patient_name,
    p.uuid AS patient_uuid,
    cbl.status,
    cr.identifier as cr_no,
    u.identifier as amrs_universal_id,
    bo.intervention_code,
    bo.consent_token,
    bo.order_no,
    bo.service_type,
    bo.requires_preauth,
    bo.normal_preauth,
    bo.elective_preauth,
    bo.preauth_approved,
    bo.required_documents,
    bo.applicable_document_types,
    bo.required_preauth_document_types
FROM
    amrs.cashier_bill cb
        INNER JOIN
    amrs.cashier_cash_point cp ON (cp.cash_point_id = cb.cash_point_id)
        INNER JOIN
    amrs.location l ON (l.location_id = cp.location_id)
        LEFT JOIN
    amrs.person p ON (p.person_id = cb.patient_id
        AND p.voided = 0)
        LEFT JOIN
    amrs.person_name pn ON (pn.person_id = p.person_id
        AND pn.voided = 0)
        JOIN
    amrs.cashier_bill_line_item cbl ON (cbl.bill_id = cb.bill_id)
        JOIN
    amrs.cashier_billable_service cbs ON (cbs.service_id = cbl.service_id)
         LEFT JOIN
    amrs.patient_identifier cr ON (cr.patient_id = p.person_id
        AND cr.identifier_type = 55
        AND cr.voided = 0)
        LEFT JOIN
    amrs.patient_identifier u ON (u.patient_id = p.person_id
        AND u.identifier_type = 8
        AND u.voided = 0)
    JOIN
    hie.bill_orders bo ON (bo.line_item_uuid = cbl.uuid AND bo.requires_preauth = 1)
WHERE
    cb.voided = 0
        AND DATE(cb.date_created) = DATE('${billingDate}')
        AND l.uuid = '${locationUuid}'
        AND cbl.voided = 0
group by p.person_id
ORDER BY cb.date_created desc;`;
    const queryParts = {
      sql: sql
    };
    db.queryServer(queryParts, function (result) {
      result.sql = sql;
      resolve(result.result);
    });
  });
}

module.exports = {
  getFacilityBills,
  getPatientFacilityBillDetails,
  getPatientBillPayments,
  getPatientDiagnosis,
  getActiveProviders,
  getFacilityEncounterBills,
  getDischargeDiagnisisAndDictor,
  getPatientFacilityPreAuthBills
};
