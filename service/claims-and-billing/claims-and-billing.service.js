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
    UPPER(CONCAT_WS(' ',
                    pn.given_name,
                    pn.middle_name,
                    pn.family_name)) AS patient_name,
    cp.name AS cash_point,
    DATE_FORMAT(MAX(cb.date_created), '%Y-%m-%d %H:%m') AS bill_date,
    GROUP_CONCAT(cb.status) AS paid_status,
    p.uuid AS patient_uuid
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
    UPPER(CONCAT_WS(' ',
                    pn.given_name,
                    pn.middle_name,
                    pn.family_name)) AS patient_name,
    cp.name AS cash_point,
    DATE_FORMAT(cb.date_created, '%Y-%m-%d %H:%m') AS bill_date,
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
    cbl.date_created as bill_item_time
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
WHERE
    cb.voided = 0
        AND DATE(cb.date_created) = DATE('${billingDate}')
        AND l.uuid = '${locationUuid}'
        AND p.uuid = '${patientUuid}'
        AND cbl.voided = 0
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
module.exports = { getFacilityBills, getPatientFacilityBillDetails };
