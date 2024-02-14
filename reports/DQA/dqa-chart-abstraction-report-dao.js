import QueryService from '../../app/database-access/query.service';

export class DQAChartAbstractionDAO {
  constructor() {}

  getDQAChartAbstractionReport(
    locations,
    limit,
    offset,
    startDate,
    endDate,
    patientType
  ) {
    let where = '';
    switch (patientType) {
      case 'PEADS':
        where = `TIMESTAMPDIFF(YEAR, h.birthdate, '` + endDate + `') < 15`;
        break;
      case 'PMTCT':
        where = `p.program_id = 4`;
        break;
      default:
        where = `TIMESTAMPDIFF(YEAR, h.birthdate, '` + endDate + `') >= 15`;
    }
    let runner = this.getSqlRunner();

    const limitOffSetDefinition =
      limit === 'all' ? '' : `limit ` + limit + ` offset ` + offset;

    let sqlQuery =
      `SELECT 
h.person_uuid AS uuid,
fpiv.ccc AS ccc_number,
IF((fpiv.nupi IS NOT NULL),
    fpiv.nupi,
    'Missing') AS NUPI,
TIMESTAMPDIFF(YEAR,
    h.birthdate,
    '2023-12-31') AS age,
CASE
    WHEN e.tb_screen = 1 THEN 'Yes'
    ELSE 'No'
END AS 'tb_screened_this_visit',
CASE
    WHEN (h.gender = 'F') THEN 'Female'
    WHEN (h.gender = 'M') THEN 'Male'
    ELSE 'Missing'
END AS 'sex_gender',
e.height,
e.weight,
DATE_FORMAT(h.birthdate, '%d/%m/%Y') AS birthdate,
h.encounter_id,
DATE_FORMAT(h.encounter_date, '%d/%m/%Y') AS last_appointment_date,
h.rtc_date,
h.location_id,
h.cur_arv_meds,
CASE
    WHEN (h.cur_arv_meds_names REGEXP '[[:<:]]DTG[[:>:]]') THEN 'DTG-based'
    WHEN (h.cur_arv_meds_names NOT REGEXP '[[:<:]]DTG[[:>:]]') THEN 'Non-DTG-based'
    ELSE 'NON DTG'
END AS cur_arv_med_basis,
h.tb_screen,
DATE_FORMAT(h.tb_screening_datetime, '%d/%m/%Y') AS tb_screening_datetime,
CASE
    WHEN (e.hiv_start_date <= '1900-01-01') THEN ''
    ELSE DATE_FORMAT(e.hiv_start_date, '%d/%m/%Y')
END AS hiv_start_date,
h.arv_start_date,
CASE
    WHEN (h.arv_first_regimen_start_date <= '1900-01-01') THEN ''
    ELSE DATE_FORMAT(h.arv_first_regimen_start_date,
            '%d/%m/%Y')
END AS arv_first_regimen_start_date,
e.cd4_1,
IF((e.cd4_1 IS NOT NULL), 'Yes', 'No') AS has_cd4_1,
DATE_FORMAT(e.encounter_datetime, '%d/%m/%Y') AS last_clinical_encounter,
DATE_FORMAT(h.rtc_date, '%d/%m/%Y') AS next_appointment,
h.vl_1,
CASE
    WHEN
        (TIMESTAMPDIFF(MONTH,
            h.arv_start_date,
            '` +
      endDate +
      `') < 6)
    THEN
        'NA'
    WHEN (h.vl_1 IS NOT NULL) THEN 'Yes'
    ELSE 'Missing'
END AS viral_load_validity,
h.cur_arv_meds_names AS drugs_given,
CASE
    WHEN
        e.height IS NOT NULL
            AND e.weight IS NOT NULL
    THEN
        e.weight / ((e.height / 100) * (e.height / 100))
    ELSE NULL
END AS BMI,
TIMESTAMPDIFF(DAY,
    h.encounter_date,
    h.rtc_date) AS drugs_duration,
IF(h.ipt_start_date = h.encounter_date,
    1,
    0) AS ipt_started_this_visit,
DATE_FORMAT(h.ipt_start_date, '%d/%m/%Y') AS last_ipt_start_date,
CASE
    WHEN h.on_ipt_this_month = 1 THEN 'Continuing'
    WHEN
        h.ipt_completion_date IS NULL
            AND h.ipt_stop_date IS NOT NULL
    THEN
        'Discontinued'
    WHEN h.ipt_completion_date IS NOT NULL THEN 'INH Completed'
    WHEN
        (h.on_ipt_this_month = 0
            AND h.on_tb_tx_this_month = 0)
    THEN
        'Missing'
    WHEN
        ((TIMESTAMPDIFF(MONTH,
            h.ipt_start_date,
            '` +
      endDate +
      `') < 3)
            AND h.on_ipt_this_month = 1)
    THEN
        'Defaulted'
    ELSE 'NA'
END AS tpt_status,
DATE_FORMAT(h.ipt_stop_date, '%d/%m/%Y') AS ipt_stop_date,
DATE_FORMAT(h.ipt_completion_date, '%d/%m/%Y') AS ipt_completion_date,
fv.muac AS muac,
IF(h.ipt_stop_date = h.encounter_date
        OR h.ipt_completion_date = h.encounter_date,
    1,
    0) AS ipt_ended_this_visit,
h.status,
IF((o.value_coded IS NULL), 'No', 'Yes') AS is_crag_screened,
CASE
    WHEN (h.vl_1 < 200) THEN 'Yes'
    WHEN (h.vl_1 >= 200) THEN 'No'
    ELSE 'Missing'
END AS vl_suppression,
CASE
    WHEN (e.tb_screening_result IN (6621 , 1118)) THEN 'TB Screening not done'
    WHEN (e.tb_screening_result = 6971) THEN 'Presumed TB'
    WHEN (e.tb_screening_result IN (6137 , 6176, 10767)) THEN 'TB confirmed'
    WHEN (e.tb_screening_result IN (1107 , 10678)) THEN 'No TB signs'
    ELSE 'Missing'
END AS tb_screening_result,
CASE
    WHEN (p.program_id = 4) THEN 'PMTCT'
    WHEN
        (TIMESTAMPDIFF(YEAR,
            h.birthdate,
            '` +
      endDate +
      `') < 15)
    THEN
        'Paeds (0-14yrs)'
    WHEN
        (TIMESTAMPDIFF(YEAR,
            h.birthdate,
            '` +
      endDate +
      `') >= 15)
    THEN
        'Adults (>15 yrs)'
END AS category,
CASE
    WHEN
        o.concept_id = 1109
            AND o.value_coded = 916
    THEN
        'COTRIMOXAZOLE'
    WHEN
        o.concept_id = 1109
            AND o.value_coded = 92
    THEN
        'DAPSONE'
    ELSE NULL
END AS pcp_prophylaxis,
CASE
    WHEN o.value_coded IN (916) THEN 'Yes'
    ELSE 'No'
END AS ctx_dispensed,
case 
    WHEN (h.gender = 'M') then 'Not Applicable'
    WHEN (h.gender = 'F' AND o.concept_id IN (5630) AND o.value_coded IN (1170)) then 'SVD'
    WHEN (h.gender = 'F' AND o.concept_id IN (5630) AND o.value_coded IN (1171)) then 'C-Section'
    WHEN (h.gender = 'F' AND o.concept_id IN (5630) AND o.value_coded IN (1172)) then 'Breech'
    WHEN (h.gender = 'F' AND o.concept_id IN (5630) AND o.value_coded IN (5622)) then 'Other'
    WHEN (h.gender = 'F' AND o.concept_id IN (5630) AND o.value_coded IN (1067)) then 'Uknown'
    WHEN (h.gender = 'F' AND o.concept_id IN (5630) AND o.value_coded IN (2167)) then 'Vacuum Assisted'
    WHEN (h.gender = 'F' AND o.concept_id IN (5630) AND o.value_coded IN (2166)) then 'Forceps Delivery'
    WHEN (h.gender = 'F' AND o.concept_id IN (5630) AND o.value_coded IN (6263)) then 'Elective C-Section'
    WHEN (h.gender = 'F' AND o.concept_id IN (5630) AND o.value_coded IN (6442)) then 'Emergency C-Section'
    WHEN (h.gender = 'F' AND o.concept_id IN (5630) AND o.value_coded IN (8316)) then 'Vertex Delivery'
    ELSE NULL
end as delivery_method,
case
    WHEN (h.gender = 'M') then 'Not Applicable' 
    WHEN (h.gender = 'F' AND o.concept_id IN (6224) AND o.value_coded IN (1844)) then 'Early Neonatal Mortality'
    WHEN (h.gender = 'F' AND o.concept_id IN (6224) AND o.value_coded IN (48)) then 'Miscarriage'
    WHEN (h.gender = 'F' AND o.concept_id IN (6224) AND o.value_coded IN (46)) then 'Ectopic'
    WHEN (h.gender = 'F' AND o.concept_id IN (6224) AND o.value_coded IN (1993)) then 'Stillbirth'
    WHEN (h.gender = 'F' AND o.concept_id IN (6224) AND o.value_coded IN (1845)) then 'Late Neonatal Mortality'
    WHEN (h.gender = 'F' AND o.concept_id IN (6224) AND o.value_coded IN (5622)) then 'Other'
    WHEN (h.gender = 'F' AND o.concept_id IN (6224) AND o.value_coded IN (1843)) then 'Live Birth'
    WHEN (h.gender = 'F' AND o.concept_id IN (6224) AND o.value_coded IN (6782)) then 'Normal Term Deliver'
    WHEN (h.gender = 'F' AND o.concept_id IN (6224) AND o.value_coded IN (6648)) then 'Preterm Deliery'
    WHEN (h.gender = 'F' AND o.concept_id IN (6224) AND o.value_coded IN (10424)) then 'Macerated Stillbirth'
    WHEN (h.gender = 'F' AND o.concept_id IN (6224) AND o.value_coded IN (10877)) then 'Fresh Stillbirth'
    WHEN (h.gender = 'F' AND o.concept_id IN (6224) AND o.value_coded IN (10878)) then 'Spontaneous Abortion'
    ELSE NULL
end as pregnancy_outcome,

case 
    WHEN (h.gender = 'F' AND o.concept_id IN (5630, 6224)
    AND o.value_coded IN (1170, 1843)) THEN 'Yes'
    WHEN h.gender = 'M' THEN 'Not Applicable'
    ELSE null
END as svd_and_live_birth
    
FROM
etl.hiv_monthly_report_dataset_v1_2 h
    LEFT JOIN
etl.flat_hiv_summary_v15b e ON (h.encounter_id = e.encounter_id)
    LEFT JOIN
etl.flat_vitals fv ON (e.person_id = fv.person_id)
    INNER JOIN
amrs.person t1 ON (h.person_id = t1.person_id)
    INNER JOIN
etl.flat_patient_identifiers_v1 fpiv ON (t1.person_id = fpiv.patient_id)
    LEFT JOIN
amrs.patient_program p ON (p.patient_id = h.person_id
    AND p.program_id IN (4)
    AND p.date_completed IS NULL
    AND p.voided = 0)
Left JOIN 
amrs.obs o ON (o.encounter_id = e.encounter_id
    AND o.person_id = h.person_id
    AND o.location_id IN (` +
      locations +
      `)
    AND (o.obs_datetime between '` +
      startDate +
      `'AND '` +
      endDate +
      `')
    AND o.concept_id IN (5630, 6224, 1109, 9812, 1109)
    AND o.value_coded in (1170, 1843, 916)
    AND o.voided = 0 
    )
WHERE
h.status = 'active' AND 
h.endDate >= '` +
      startDate +
      `'
AND h.endDate <= '` +
      endDate +
      `'
AND h.location_id IN (` +
      locations +
      `)
AND ` +
      where +
      `
GROUP BY
h.person_id
` +
      limitOffSetDefinition;

    return new Promise((resolve, reject) => {
      runner
        .executeQuery(sqlQuery)
        .then((results) => {
          resolve({
            results: results
          });
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  getSqlRunner() {
    return new QueryService();
  }
}
