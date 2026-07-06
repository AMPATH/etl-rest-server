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
    bo.consent_token
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
    cbl.payment_status,
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
    e.patient_id,
    e.encounter_id,
    e.encounter_datetime,
    l.name AS 'facility',
    et.name AS 'encounter_type',
    ob.concept_id,
    ob.value_coded,
    crs.name AS 'concept_source_name',
    crs.hl7_code,
    crt.code AS icd11_code
FROM
    amrs.encounter e
        JOIN
    amrs.person p ON (e.patient_id = p.person_id)
        JOIN
    amrs.location l ON (e.location_id = l.location_id)
        JOIN
    amrs.encounter_type et ON (et.encounter_type_id = e.encounter_type)
        JOIN
    amrs.obs ob ON (ob.encounter_id = e.encounter_id)
        JOIN
    amrs.concept c ON (c.concept_id = ob.concept_id)
        JOIN
    amrs.concept vc ON (vc.concept_id = ob.value_coded)
        JOIN
    amrs.concept_reference_map crm ON (crm.concept_id = vc.concept_id)
        JOIN
    amrs.concept_reference_term crt ON (crm.concept_reference_term_id = crt.concept_reference_term_id)
        JOIN
    amrs.concept_reference_source crs ON (crs.concept_source_id = crt.concept_source_id)
WHERE
    p.uuid = '${patientUuid}'
        AND DATE(e.encounter_datetime) = DATE('${visitDate}')
        AND l.uuid = '${locationUuid}'
        AND e.voided = 0
        AND c.uuid = '${problemAddedConceptUuid}'
        AND ob.voided = 0
        AND crs.uuid = '${icd11SourceUuid}'
        group by ob.value_coded;`;
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
  getPatientDiagnosis
};
