import QueryService from '../../app/database-access/query.service';

export class DQAChartAbstractionDAO {
  constructor() {}

  getDQAChartAbstractionReport(locations, limit, offset) {
    let runner = this.getSqlRunner();
    let sqlQuery =
      `SELECT
      GROUP_CONCAT(DISTINCT identifier
                   SEPARATOR ', ') AS identifiers,
      uuid,
      person_id,
      NUPI,
      ccc_number,
      person_name,
      birthdate,
      gender,
      hiv_start_date                                                                                  as date_confirmed_hiv_positive,
      arv_start_date,
      vl_1,
      cd4_1,
      enrolled_in_dc,
      last_clinical_encounter,
      IF(timestampdiff(year, birthdate, now()) > 0, round(timestampdiff(year, birthdate, now()), 0),
         round(timestampdiff(month, birthdate, now()) / 12, 2))                                       as age,
      encounter_datetime                                                                              as last_appointment_date,
      rtc_date                                                                                        as next_appointment,
      etl.get_arv_names(cur_arv_meds)                                                                 AS drugs_given,
      weight,
      height,
      IF(height is not null and weight is not null, weight / ((height / 100) * (height / 100)), null) as BMI,
      condom_provided_this_visit,
      tb_screened_this_visit,
      ipt_start_date,
      ipt_stop_date,
      ipt_completion_date,
      tb_screen
FROM (SELECT h.uuid,
            h.person_id,
            CONCAT(COALESCE(person_name.given_name, ''), ' ', COALESCE(person_name.middle_name, ''), ' ',
                   COALESCE(person_name.family_name, ''))             AS person_name,
            id.identifier,
            cc.identifier                                             as ccc_number,
            inu.identifier                                            as NUPI,
            gender,
            pp.program_id,
            birthdate,
            encounter_id,
            encounter_datetime,
            rtc_date,
            h.hiv_start_date,
            h.arv_start_date,
            h.location_id,
            h.cd4_1,
            h.vl_1,
            h.weight,
            h.height,
            IF(is_clinical_encounter = 1, encounter_datetime, null)   AS last_clinical_encounter,
            is_clinical_encounter,
            cur_arv_meds,
            tb_screen,
            tb_screening_datetime,
            IF((pp.program_id is not null AND pp.date_completed is null), 1,0) as enrolled_in_dc,
            IF(tb_screening_datetime = encounter_datetime, 1, 0)      AS tb_screened_this_visit,
            ipt_start_date,
            IF(ipt_start_date = encounter_datetime, 1, 0)             AS ipt_started_this_visit,
            ipt_stop_date,
            ipt_completion_date,
            IF(ipt_stop_date = encounter_datetime
                   OR ipt_completion_date = encounter_datetime, 1, 0) AS ipt_ended_this_visit,
            condoms_provided_date,
            IF(condoms_provided_date = encounter_datetime, 1, 0)      AS condom_provided_this_visit
     FROM etl.flat_hiv_summary_v15b h
              INNER JOIN amrs.person t1 ON (h.person_id = t1.person_id)
              INNER JOIN amrs.person_name person_name ON (t1.person_id = person_name.person_id
         AND (person_name.voided = 0
             || person_name.voided = 0))
         LEFT JOIN amrs.patient_program pp on (t1.person_id = pp.patient_id and pp.program_id = 9 AND pp.voided = 0)
              LEFT JOIN amrs.patient_identifier id ON (t1.person_id = id.patient_id
         AND (id.voided = 0))
              INNER JOIN amrs.patient_identifier inu ON (t1.person_id = inu.patient_id
         AND (inu.voided = 0 AND inu.identifier_type = 45))
              INNER JOIN amrs.patient_identifier cc ON (t1.person_id = cc.patient_id
         AND (cc.voided = 0 AND cc.identifier_type = 28))
     WHERE is_clinical_encounter = 1
       AND encounter_datetime > '2018-01-01'
       AND h.location_id IN (` +
      locations +
      `)
     ORDER BY encounter_datetime DESC) clinical
GROUP BY person_id DESC limit ` +
      limit +
      ` offset ` +
      offset +
      `;`;
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
