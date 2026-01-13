var db = require('../../etl-db');

var defs = {
  getPrEPRegisterData: (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      let sql = `
            SELECT  distinct
                l.name AS location_name,
                fps.person_id,
                fps.encounter_id,
                pi.identifier AS PrEP_Number,
                pi2.identifier AS National_ID,
                pi3.identifier AS NUPI,
                pi4.identifier AS amrsId,
                fps.encounter_datetime AS Date_Of_Visit,
                EXTRACT(YEAR FROM fps.encounter_datetime) - EXTRACT(YEAR FROM fps.birthdate) - CASE
                    WHEN
                        (EXTRACT(MONTH FROM fps.encounter_datetime) < EXTRACT(MONTH FROM fps.birthdate))
                            OR (EXTRACT(MONTH FROM fps.encounter_datetime) = EXTRACT(MONTH FROM fps.birthdate)
                            AND EXTRACT(DAY FROM fps.encounter_datetime) < EXTRACT(DAY FROM fps.birthdate))
                    THEN
                        1
                    ELSE 0
                END Age,
                fps.gender AS Sex,
                (
                  SELECT 
                  CASE 
                    WHEN t2.population_type = 3 THEN '1'
                    WHEN t2.population_type = 10 THEN '1'
                    WHEN t2.population_type = 1 THEN '2'
                    WHEN t2.population_type = 5 THEN '3'
                    WHEN t2.population_type = 6 THEN '4'
                    WHEN t2.population_type = 7 THEN '5'
                    WHEN t2.population_type = 8 THEN '6'
                    WHEN t2.population_type = 11 THEN '6'
                   ELSE ''
                  END
                  FROM etl.flat_prep_summary_v1_1 t2
                  WHERE t2.person_id = fps.person_id AND t2.population_type IS NOT NULL
                  ORDER BY t2.encounter_datetime DESC
                  LIMIT 1
                ) AS population_type,
                CASE
                    WHEN fps.encounter_type = 133 THEN 'N'
                    WHEN fps.discontinued_prep = 1 THEN 'D'
                    WHEN
                        fps.discontinued_prep IS NULL
                        AND fps.encounter_type <> 133
                        -- AND fps.next_encounter_datetime IS NOT NULL
                    THEN
                        'C'
                    WHEN
                        fps.prev_discontinued_prep = 1
                            AND fps.discontinued_prep <> 1
                    THEN
                        'R'
                END AS client_prep_status,
                o.*,
                CASE
                    WHEN COALESCE(fps.hiv_rapid_test_result) = 664 THEN 'N'
                    WHEN COALESCE(fps.hiv_rapid_test_result) = 703 THEN 'P'
                END AS HIV_result,
                case when fps.has_sti=1 then 'Y' else 'N' end  AS with_STI,
                TRIM(
              SUBSTRING_INDEX(
              REPLACE(
                REPLACE(
                REPLACE(oa_latest.value_text, '\r\n', '\n'),
                ',', '\n'),
              '.', '\n'),
              '\n', 1)
            ) AS remarks
            FROM
                etl.flat_prep_summary_v1_1 fps
                    LEFT JOIN
                amrs.location l ON l.location_id = fps.location_id
                    LEFT JOIN
                amrs.patient_identifier pi ON fps.person_id = pi.patient_id
                    AND pi.identifier_type = 44
                    LEFT JOIN
                amrs.patient_identifier pi2 ON fps.person_id = pi2.patient_id
                    AND pi2.identifier_type = 5 
                    LEFT JOIN
                amrs.patient_identifier pi3 ON fps.person_id = pi3.patient_id
                    AND pi3.identifier_type = 45
                    LEFT JOIN
                amrs.patient_identifier pi4 ON fps.person_id = pi4.patient_id
                    AND pi4.identifier_type = 8
                    LEFT JOIN (
				SELECT o.person_id, o.value_text
				FROM amrs.obs o
				INNER JOIN (
					SELECT person_id, MAX(CONCAT(obs_datetime, LPAD(obs_id, 10, '0'))) AS max_key
					FROM amrs.obs
					WHERE concept_id = 7222
					GROUP BY person_id
				) latest
				  ON latest.person_id = o.person_id
				 AND latest.max_key = CONCAT(o.obs_datetime, LPAD(o.obs_id, 10, '0'))
				WHERE o.concept_id = 7222
			) oa_latest ON oa_latest.person_id = fps.person_id
                INNER JOIN (
            SELECT person_id,
                CASE 
                     WHEN value_coded = 12430 THEN 1
                     WHEN value_coded = 7447 THEN 1
                     WHEN value_coded = 12431 THEN 2
                     WHEN value_coded = 12432 THEN 3
                     WHEN value_coded = 12433 THEN 4
                     ELSE ''
                END AS prep_method
                FROM (
                  SELECT *,
                        ROW_NUMBER() OVER (PARTITION BY person_id ORDER BY obs_datetime DESC) AS rn
                      FROM amrs.obs
                      WHERE concept_id IN (12444, 12443, 12442)
                      ) ranked_obs
                    WHERE rn = 1
                    ) o ON o.person_id = fps.person_id
            WHERE
                DATE(fps.encounter_datetime) BETWEEN '${params.startDate}' AND '${params.endDate}'
                AND l.uuid in (${params.locationUuids})
                AND fps.encounter_type in (133, 134,261,262,263,280,281,282,292,302,303,304)
                group by fps.person_id, o.person_id
                order by fps.encounter_datetime desc;
        `;
      queryParts = {
        sql: sql
      };
      return db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result.result);
      });
    });
  },
  getDefaulterTracingRegisterData: (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      const sql = `
        select	
            d.identifier as 'client_id_No',
            pi.identifier nupi,
            g.identifier as amrsID,
            pn.given_name as first_name, 
            pn.middle_name as middle, 
            pn.family_name as last_name, 
            pa.city_village as village,
            pt.value as 'telephone_number',
            max(if(o.concept_id=1592,(o.value_datetime),null)) as date_of_missed_appointment,
            max(if(o.concept_id=9082,(case  
                when o.value_coded = 159 then "Dead" 
                when o.value_coded = 12296 then "Return to care" 
                when o.value_coded = 10353 then "Return to care" 
                when o.value_coded = 10652 then "Transferred"
                when o.value_coded = 9504 then "Transferred" 
                when o.value_coded = 1732 then "Transferred"
                when o.value_coded = 1285 then "Transferred"
                when o.value_coded = 1679 then "Stopped Treatment" 
                when o.value_coded = 9036 then "Stopped Treatment" 
                when o.value_coded = 9580 then "On Follow Up" 
                when o.value_coded = 9079 then "On Follow Up"
                when o.value_coded = 9080 then "On Follow Up"
                else "" end),null)) as defaulter_tracing_outcomes,
                max(o.obs_datetime) as 'date_of_outcomes', 
             MAX(
              IF(
                o.concept_id = 9467,
                TRIM(
                  SUBSTRING_INDEX(
                    REPLACE(
                      REPLACE(
                        REPLACE(o.value_text, '\r\n', '\n'),
                      ',', '\n'),
                    '.', '\n'),
                  '\n', 1)
                ),
                NULL
              )
            ) AS remarks
        from 
            etl.flat_obs fo
            LEFT JOIN amrs.encounter e ON fo.encounter_id = e.encounter_id
            inner join amrs.location l on l.location_id=e.location_id
            inner join amrs.person p on p.person_id=e.patient_id and p.voided=0
            inner join amrs.patient_identifier d on d.patient_id=p.person_id AND d.identifier_type = 5
            inner join amrs.patient_identifier pi on pi.patient_id=p.person_id AND pi.identifier_type = 45
            inner join amrs.person_name pn on pn.person_id = d.patient_id and pn.voided = 0 and pn.preferred = 1
            inner join amrs.person_address pa on pn.person_id = pa.person_id
            left join amrs.person_attribute pt on pt.person_id = pa.person_id and person_attribute_type_id = 10 and pt.voided =0
            INNER JOIN amrs.patient_identifier g ON fo.person_id = g.patient_id AND g.identifier_type = 8
            inner join amrs.form f on f.form_id = e.form_id and f.uuid = "f3ba9242-9bbb-4284-a0c0-56ac6f0cec65"
            left join amrs.obs o on o.encounter_id = e.encounter_id 
                and o.concept_id in (1592, 9082, 9467) 
                and o.voided=0
        where e.voided=0
            and DATE(e.encounter_datetime) BETWEEN '${params.startDate}' AND '${params.endDate}'
            AND l.uuid in (${params.locationUuids})
        group by e.encounter_id
        order by fo.encounter_datetime desc, e.encounter_datetime desc, o.obs_datetime desc
      `;
      queryParts = {
        sql: sql
      };
      return db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result.result);
      });
    });
  },
  getHEIRegisterData: (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      const sql = `
  WITH distinct_pcr AS (
  SELECT DISTINCT
    person_id,
    DATE(test_datetime) AS test_date,
    hiv_dna_pcr
  FROM etl.flat_labs_and_imaging
),
ordered_pcr AS (
  SELECT
    person_id,
    test_date,
    hiv_dna_pcr,
    ROW_NUMBER() OVER (PARTITION BY person_id ORDER BY test_date) AS dna_pcr_number
  FROM distinct_pcr
),
pcr_final AS (
  SELECT
    person_id,
    MAX(CASE WHEN dna_pcr_number = 1 THEN test_date END) AS pcr1_date,
    MAX(CASE WHEN dna_pcr_number = 1 THEN hiv_dna_pcr END) AS pcr1_result,
    MAX(CASE WHEN dna_pcr_number = 2 THEN test_date END) AS pcr2_date,
    MAX(CASE WHEN dna_pcr_number = 2 THEN hiv_dna_pcr END) AS pcr2_result,
    MAX(CASE WHEN dna_pcr_number = 3 THEN test_date END) AS pcr3_date,
    MAX(CASE WHEN dna_pcr_number = 3 THEN hiv_dna_pcr END) AS pcr3_result,
    MAX(CASE WHEN dna_pcr_number = 4 THEN test_date END) AS confirm_date,
    MAX(CASE WHEN dna_pcr_number = 4 THEN hiv_dna_pcr END) AS confirm_result
  FROM ordered_pcr
  GROUP BY person_id
)

SELECT 
    fhi.person_id, 
    fhi.date_enrolled, 
    fhi.birth_date AS dob, 
    fhi.gender,
    p.given_name, 
    p.middle_name,
    p.family_name,
    l.name AS Location,
    TIMESTAMPDIFF(MONTH, fhi.birth_date, CURDATE()) AS age_in_months,
    pi1.identifier AS Birth_Certificate_number, 
    pi2.identifier AS AMRS_Number, 
    pi3.identifier AS HEI_ID, 
    pi4.identifier AS NUPI, 
    CASE
      WHEN arv.value_coded = 797 THEN 2
      WHEN arv.value_coded = 631 THEN 1
      WHEN arv.value_coded = 6467 THEN 3
      WHEN arv.value_coded = 1107 THEN 4
    END AS infant_prophylaxis,
    pa.value AS parent_name, 
    pa2.value AS Phone_Number, 
    fhi.initial_hiv_dna_pcr_order_date,
    FLOOR(DATEDIFF(fhi.initial_hiv_dna_pcr_order_date, fhi.birth_date) / 7) AS age_in_weeks_on_first_pcr,  
    fhi.hiv_dna_pcr_1_date AS first_pcr_date,
    CASE 
        WHEN COALESCE(fhi.hiv_dna_pcr_resulted, fhi.hiv_dna_pcr_1) = 664 THEN 'N' 
        WHEN COALESCE(fhi.hiv_dna_pcr_resulted, fhi.hiv_dna_pcr_1) = 703 THEN 'P' 
    END AS results_pcr_first_pcr,
    (EXTRACT(YEAR FROM fhi.hiv_dna_pcr_2_date) - EXTRACT(YEAR FROM fhi.birth_date)) * 12 + 
    (EXTRACT(MONTH FROM fhi.hiv_dna_pcr_2_date) - EXTRACT(MONTH FROM fhi.birth_date)) AS age_in_months_on_second_pcr, 
    fhi.hiv_dna_pcr_2_date AS second_pcr_date,
    CASE 
        WHEN COALESCE(fhi.hiv_dna_pcr_2) = 664 THEN 'N' 
        WHEN COALESCE(fhi.hiv_dna_pcr_2) = 703 THEN 'P' 
    END AS results_pcr_second_pcr,
    (EXTRACT(YEAR FROM fhi.hiv_dna_pcr_3_date) - EXTRACT(YEAR FROM fhi.birth_date)) * 12 + 
    (EXTRACT(MONTH FROM fhi.hiv_dna_pcr_3_date) - EXTRACT(MONTH FROM fhi.birth_date)) AS age_in_months_on_third_pcr, 
    fhi.hiv_dna_pcr_3_date AS third_pcr_date,
    CASE 
        WHEN COALESCE(fhi.hiv_dna_pcr_3) = 664 THEN 'N' 
        WHEN COALESCE(fhi.hiv_dna_pcr_3) = 703 THEN 'P' 
    END AS results_pcr_third_pcr,
    (EXTRACT(YEAR FROM fhi.hiv_dna_pcr_4_date) - EXTRACT(YEAR FROM fhi.birth_date)) * 12 + 
    (EXTRACT(MONTH FROM fhi.hiv_dna_pcr_4_date) - EXTRACT(MONTH FROM fhi.birth_date)) AS age_in_months_on_confirm_pcr, 
    fhi.hiv_dna_pcr_4_date AS confirm_pcr_date, 
    CASE 
        WHEN COALESCE(fhi.hiv_dna_pcr_4) = 664 THEN 'N' 
        WHEN COALESCE(fhi.hiv_dna_pcr_4) = 703 THEN 'P' 
    END AS results_confirm_pcr, 
    (EXTRACT(YEAR FROM fhi.antibody_screen_1_date) - EXTRACT(YEAR FROM fhi.birth_date)) * 12 + 
    (EXTRACT(MONTH FROM fhi.antibody_screen_1_date) - EXTRACT(MONTH FROM fhi.birth_date)) AS age_in_months_on_first_antibody, 
    fhi.antibody_screen_1_date AS first_antibody_date, 
    CASE 
        WHEN COALESCE(fhi.antibody_screen_1) = 664 THEN 'N' 
        WHEN COALESCE(fhi.antibody_screen_1) = 703 THEN 'P' 
    END AS results_first_antibody, 
    (EXTRACT(YEAR FROM fhi.antibody_screen_2_date) - EXTRACT(YEAR FROM fhi.birth_date)) * 12 + 
    (EXTRACT(MONTH FROM fhi.antibody_screen_2_date) - EXTRACT(MONTH FROM fhi.birth_date)) AS age_in_months_on_second_antibody, 
    fhi.antibody_screen_2_date AS second_antibody_date, 

    -- PCR columns now pulled from new pcr_final pivot
    CASE
      WHEN pcr_final.pcr1_result = 703 THEN 'P'
      WHEN pcr_final.pcr1_result = 664 THEN 'N'
      WHEN pcr_final.pcr1_result = 1138 THEN 'I'
      ELSE NULL
    END AS pcr_one,
    pcr_final.pcr1_date AS pcr_one_date,
    FLOOR(DATEDIFF(pcr_final.pcr1_date, fhi.birth_date) / 7) AS pcr_one_age_weeks, 

    CASE
      WHEN pcr_final.pcr2_result = 703 THEN 'P'
      WHEN pcr_final.pcr2_result = 664 THEN 'N'
      WHEN pcr_final.pcr2_result = 1138 THEN 'I'
      ELSE NULL
    END AS pcr_two,
    pcr_final.pcr2_date AS pcr_two_date,
    (EXTRACT(YEAR FROM pcr_final.pcr2_date) - EXTRACT(YEAR FROM fhi.birth_date)) * 12 +
    (EXTRACT(MONTH FROM pcr_final.pcr2_date) - EXTRACT(MONTH FROM fhi.birth_date)) AS pcr_two_age_months, 

    CASE
      WHEN pcr_final.pcr3_result = 703 THEN 'P'
      WHEN pcr_final.pcr3_result = 664 THEN 'N'
      WHEN pcr_final.pcr3_result = 1138 THEN 'I'
      ELSE NULL
    END AS pcr_three,
    pcr_final.pcr3_date AS pcr_three_date, 
    (EXTRACT(YEAR FROM pcr_final.pcr3_date) - EXTRACT(YEAR FROM fhi.birth_date)) * 12 +
    (EXTRACT(MONTH FROM pcr_final.pcr3_date) - EXTRACT(MONTH FROM fhi.birth_date)) AS pcr_three_age_months, 

    CASE
      WHEN pcr_final.confirm_result = 703 THEN 'P'
      WHEN pcr_final.confirm_result = 664 THEN 'N'
      WHEN pcr_final.confirm_result = 1138 THEN 'I'
      ELSE NULL
    END AS confirm_pcr,
    pcr_final.confirm_date AS confirm_pcr_date,
    (EXTRACT(YEAR FROM pcr_final.confirm_date) - EXTRACT(YEAR FROM fhi.birth_date)) * 12 +
    (EXTRACT(MONTH FROM pcr_final.confirm_date) - EXTRACT(MONTH FROM fhi.birth_date)) AS confirm_pcr_age_months, 

    CASE 
        WHEN fhi.antibody_screen_2 = 664 THEN 'N' 
        WHEN fhi.antibody_screen_2 = 703 THEN 'P' 
    END AS results_second_antibody,
    CASE
       WHEN o.value_coded = 664 THEN 'N' 
        WHEN o.value_coded = 703 THEN 'P'
        WHEN o.value_coded = 1118 THEN 'I'
        ELSE NULL
    END AS antibody_test,
    o.obs_datetime AS antibody_date,
    CASE 
        WHEN fhi.infant_feeding_method IN (5, 15, 6, 9) THEN 'BF' 
        WHEN fhi.infant_feeding_method IN (17, 8, 3) THEN 'NBF' 
    END AS infant_feeding,
    CASE 
        WHEN death.value_coded = 6137 THEN 5 
        ELSE NULL
    END AS death_date,  
    hei_latest.hei_outcome AS hei_outcome,
    TRIM(
      SUBSTRING_INDEX(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(oa_latest.value_text, '\r\n', '\n'),
              ',', '\n'),
            '.', '\n'),
          'and', '\n'),
        '\n',
        1
      )
    ) AS remarks
FROM 
  etl.flat_hei_summary fhi
  LEFT JOIN amrs.person_name p ON p.person_id = fhi.person_id AND p.voided = 0 AND p.preferred = 1
  LEFT JOIN amrs.location l ON l.location_id = fhi.location_id 
  LEFT JOIN amrs.patient_identifier pi1 ON pi1.patient_id = fhi.person_id AND pi1.identifier_type = 46 
  LEFT JOIN amrs.patient_identifier pi2 ON pi2.patient_id = fhi.person_id AND pi2.identifier_type = 8 
  LEFT JOIN amrs.patient_identifier pi3 ON pi3.patient_id = fhi.person_id AND pi3.identifier_type = 38 
  LEFT JOIN amrs.patient_identifier pi4 ON pi4.patient_id = fhi.person_id AND pi4.identifier_type = 45 
  LEFT JOIN amrs.person_attribute pa ON pa.person_id = fhi.person_id AND pa.person_attribute_type_id = 12 
  LEFT JOIN amrs.person_attribute pa2 ON pa2.person_id = fhi.person_id AND pa2.person_attribute_type_id = 10 
  LEFT JOIN amrs.obs o ON o.person_id = fhi.person_id AND o.concept_id = 6342
  LEFT JOIN amrs.obs death ON death.person_id = fhi.person_id AND death.concept_id = 6108
  LEFT JOIN pcr_final ON pcr_final.person_id = fhi.person_id
  LEFT JOIN (
    SELECT o.person_id, o.value_text
    FROM amrs.obs o
    INNER JOIN (
      SELECT person_id, MAX(CONCAT(obs_datetime, LPAD(obs_id, 10, '0'))) AS max_key
      FROM amrs.obs
      WHERE concept_id = 9021
      GROUP BY person_id
    ) latest
      ON latest.person_id = o.person_id
     AND latest.max_key = CONCAT(o.obs_datetime, LPAD(o.obs_id, 10, '0'))
    WHERE o.concept_id = 9021
  ) oa_latest ON oa_latest.person_id = fhi.person_id
  LEFT JOIN (
    SELECT o.person_id, o.value_coded
    FROM amrs.obs o
    INNER JOIN (
      SELECT person_id, MAX(CONCAT(obs_datetime, LPAD(obs_id, 10, '0'))) AS max_key
      FROM amrs.obs
      WHERE concept_id = 1250
      GROUP BY person_id
    ) latest
      ON latest.person_id = o.person_id
     AND latest.max_key = CONCAT(o.obs_datetime, LPAD(o.obs_id, 10, '0'))
    WHERE o.concept_id = 1250
  ) arv ON arv.person_id = fhi.person_id
  LEFT JOIN (
    SELECT o.person_id, 
      CASE 
         WHEN o.value_coded = 1594 THEN 4
         WHEN o.value_coded = 5240 THEN 3
         WHEN o.value_coded = 1593 THEN 5 
         WHEN o.value_coded = 8585 THEN 2  
         WHEN o.value_coded = 12267 THEN 2 
         WHEN o.value_coded = 2240 THEN 1
      END AS hei_outcome
    FROM amrs.obs o
    INNER JOIN (
      SELECT person_id, MAX(CONCAT(obs_datetime, LPAD(obs_id, 10, '0'))) AS max_key
      FROM amrs.obs
      WHERE concept_id = 8586
      GROUP BY person_id
    ) latest
      ON latest.person_id = o.person_id
     AND latest.max_key = CONCAT(o.obs_datetime, LPAD(o.obs_id, 10, '0'))
    WHERE o.concept_id = 8586
  ) hei_latest ON hei_latest.person_id = fhi.person_id
WHERE 
    fhi.birth_date >= DATE_SUB(CURRENT_DATE, INTERVAL 2 YEAR)
    AND DATE(fhi.birth_date) BETWEEN '${params.startDate}' AND '${params.endDate}'
    AND l.uuid IN (${params.locationUuids})
GROUP BY fhi.person_id     
ORDER BY fhi.encounter_datetime DESC;

      `;
      queryParts = {
        sql: sql
      };
      return db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result.result);
      });
    });
  },
  getCNTRegisterData: (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      const sql = `
        select
            null as serial_number,
            a.encounter_datetime as date,
            a.rtc_date as rtc_date,
            b.identifier as national_id_number,
            c.identifier as NUPI,
            d.identifier as ccc_number,
            g.identifier as amrsID,
            timestampdiff(year,
            e.birthdate,
            a.encounter_datetime) as age,
            e.gender,
            case
				    when a.encounter_type = 1 then 'Y'
                else 'N'
			      end as started_on_art,
            case
                when a.tb_screen = 1 THEN 'Y'
                when a.tb_screen = 0 THEN 'N'
            end as screened_for_tb,
            case
                when a.on_ipt = 1 THEN 'Y'
                when a.on_ipt = 0 THEN 'N'
            end as started_on_tpt,
            timestampdiff(month, a.encounter_datetime, a.rtc_date) as current_on_art,
            case
                when ob.value_coded = 12106 THEN 'E'
                when ob.value_coded = 12107 THEN 'NE'
                else ''
            end as 'dsd_status',
            case
                when o.value_coded = 11936 THEN 'FT'
                when o.value_coded = 11937 THEN 'HFAG'
                when o.value_coded = 11939 THEN 'IACD'
                when o.value_coded = 11940 THEN 'CADP'
                when o.value_coded = 10992 THEN 'PCAG'
                when o.value_coded =  10991 THEN 'HCAG'
                when o.value_coded =  11938 THEN 'CADP'
                else ''
            end as 'dsd_type',
            CASE
                 WHEN  a.next_encounter_type_hiv != 99999 AND a.encounter_type = 1 THEN 'R'
                ELSE NULL
            END AS revisit,
            TRIM(
              SUBSTRING_INDEX(
              REPLACE(
                REPLACE(
                REPLACE(oa_latest.value_text, '\r\n', '\n'),
                ',', '\n'),
              '.', '\n'),
              '\n', 1)
            ) AS 'remarks'
        from
            etl.flat_hiv_summary_v15b a
        LEFT JOIN
          amrs.encounter en ON en.encounter_id = a.encounter_id 
        LEFT JOIN 
            amrs.location l ON l.location_id = en.location_id
        LEFT JOIN
            amrs.patient_identifier b ON
            a.person_id = b.patient_id
            AND b.identifier_type = 5
        LEFT JOIN
            amrs.patient_identifier c ON
            a.person_id = c.patient_id
            AND c.identifier_type = 45
        LEFT JOIN
            amrs.patient_identifier d ON
            a.person_id = d.patient_id
            AND d.identifier_type = 28
        LEFT JOIN
            amrs.patient_identifier g ON
            a.person_id = g.patient_id
            AND g.identifier_type = 8
        left join amrs.person e on
            e.person_id = a.person_id
        LEFT JOIN (
				SELECT o.person_id, o.value_text
				FROM amrs.obs o
				INNER JOIN (
					SELECT person_id, MAX(CONCAT(obs_datetime, LPAD(obs_id, 10, '0'))) AS max_key
					FROM amrs.obs
					WHERE concept_id = 7222
					GROUP BY person_id
				) latest
				  ON latest.person_id = o.person_id
				 AND latest.max_key = CONCAT(o.obs_datetime, LPAD(o.obs_id, 10, '0'))
				WHERE o.concept_id = 7222
			) oa_latest ON oa_latest.person_id = a.person_id
        left join amrs.obs o on
           o.encounter_id = a.encounter_id and o.concept_id in (11931,11932)
        left join amrs.obs ob on
           ob.encounter_id = a.encounter_id and ob.concept_id in (12108)
        where
            a.is_clinical_encounter = 1
            -- and a.next_clinical_datetime_hiv is null
            and DATE(a.encounter_datetime) BETWEEN '${params.startDate}' AND '${params.endDate}'
            AND l.uuid in (${params.locationUuids})
        group by
            a.person_id, a.encounter_id, o.concept_id
        order by
            a.encounter_datetime desc;
      `;
      queryParts = {
        sql: sql
      };
      return db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result.result);
      });
    });
  },
  getANCRegisterData: (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      const sql = `
        select
            a.encounter_datetime as date_of_visit,
            c.identifier as anc_number,
            d.identifier as NUPI,
            i.identifier as amrsID,
            d.identifier as anc_number_NUPI,
            a.anc_visit_no as number_of_anc_visits,
            concat(f.given_name, ' ', f.middle_name, ' ', f.family_name) as full_names,
            b.birthdate as date_of_birth,
            timestampdiff(year,
            b.birthdate,
            a.encounter_datetime) as age,
            e.county_district as subcounty_county,
            e.city_village as village_estate_landmark,
            h.value as phone_number,
            g.*,
            a.parity as parity,
            a.gravidae as gravidae,
            a.last_lmp_date as last_lmp_date,
            a.edd as edd,
            a.gestation_in_weeks as gestation_in_weeks,
            a.mother_muac as muac,
            a.height as height,
            a.weight as weight,
            a.blood_pressure as blood_pressure,
            a.breast_exam as breast_exam,
            a.fgm_done as fgm,
            a.fgm_complications as fgm_complications,
            a.haemoglobin as haemoglobin,
            a.blood_sugar_test as blood_sugar_test,
            a.blood_group_status as blood_group_rhesus,
            a.urinalysis as urinalysis,
            a.duo_test_result as rpr_vdrl_duo,
            a.rpr_test_result as rpr_vdrl_duo_results,
            a.hep_b_screening_result as hepatitisB,
            a.hep_b_screening_tx as hepatitisB_treatment,
            a.tb_screening as tb_screening,
            -- a.hiv_test_type as hiv_test_type,
            MAX(CASE
                WHEN ob.value_coded = 10434 THEN 'INITIAL TEST'
                WHEN ob.value_coded = 10200 THEN 'REVISIT'
                WHEN ob.value_coded = 10407 THEN 'KNOWN POSITIVE'
                WHEN ob.value_coded = 12074 THEN 'KNOWN POSITIVE'
                WHEN ob.value_coded = 10973 THEN 'RETEST'
                ELSE ''
            END) AS hiv_test_type,
            a.hiv_test_1_kit_name as hiv_test_1_kit_name,
            a.hiv_test_1_lot_no as hiv_test_1_lot_no,
            a.hiv_test_1_expiry_date as hiv_test_1_expiry_date,
            a.hiv_test_1_test_result,
            a.hiv_test_2_kit_name as hiv_test_2_kit_name,
            a.hiv_test_2_lot_no as hiv_test_2_lot_number,
            a.hiv_test_2_expiry_date as hiv_test_2_expiry_date,
            a.hiv_test_2_test_result,
            a.hiv_test_3_kit_name as hiv_test_3_kit_name,
            a.hiv_test_3_lot_no as hiv_test_3_lot_number,
            a.hiv_test_3_expiry_date as hiv_test_3_expiry_date,
            a.hiv_test_3_test_result,
            -- a.patient_hiv_result as hiv_results,
            MAX(CASE
                    WHEN oc.value_coded = 703 THEN 'P'
                    WHEN oc.value_coded = 664 then 'N'
                    WHEN oc.value_coded = 1175 then 'NA'
                    WHEN oc.value_coded = 1138 then 'In'
                    WHEN oc.value_coded = 1067 then 'U'
                END) AS hiv_results,
            a.maternal_haart as maternal_haart,
            a.infant_prophylaxis as infant_prophylaxis,
            a.partner_hiv_status as partner_hiv_testing,
            a.other_complications as other_conditions,
            a.other_conditions_tx as other_conditions_treatment,
            a.deworming as deworming,
            a.ipt_dose as ipt_1_3,
            a.tt_dose as tt_dose,
            null as supplementation,
            a.llitns as llitns,
            MAX(CASE
                    WHEN o.value_coded = 6881 THEN 'PRIVATE HEALTH FACILITY'
                    WHEN o.value_coded = 6880 then 'PUBLIC HEALTH FACILITY'
                    WHEN o.value_coded = 9613 then 'COMMUNITY'
                    WHEN o.value_coded = 6708 then 'HEALTH FACILITY'
                    WHEN o.value_coded = 7308 then 'ANOTHER FACILITY, NOS'
                    WHEN o.value_coded = 11870 then 'THIS HEALTH FACILITY'
                END) AS referrals_from,
            MAX(CASE
                    WHEN o.value_coded = 6881 THEN 'PRIVATE HEALTH FACILITY'
                    WHEN o.value_coded = 6880 then 'PUBLIC HEALTH FACILITY'
                    WHEN o.value_coded = 9613 then 'COMMUNITY'
                    WHEN o.value_coded = 6708 then 'HEALTH FACILITY'
                    WHEN o.value_coded = 7308 then 'ANOTHER FACILITY, NOS'
                    WHEN o.value_coded = 11870 then 'THIS HEALTH FACILITY'
                END) AS referrals_to,
            MAX(CASE
                when o.value_coded = 1578 then  'TRANSPORT COSTS'
                when o.value_coded = 5622 then  'OTHER NON-CODED' 
                when o.value_coded = 1548 then  'HEALTH ISSUES' 
                when o.value_coded = 2329 then  'ACUTE' 
                when o.value_coded = 2330 then  'CHRONIC' 
                when o.value_coded = 5484 then  'NUTRITIONAL SUPPORT'
                when o.value_coded = 6510 then  'CORE NEEDLE BIOPSY'
                when o.value_coded = 7465 then  'SURGERY' 
                when o.value_coded = 6511 then  'EXCISIONAL OR SURGICAL BIOPSY' 
                when o.value_coded = 6502 then  'ULTRASOUND' 
                when o.value_coded = 7190 then  'FINE NEEDLE ASPIRATION, NOS' 
                when o.value_coded = 8262 then  'DEBRIDEMENT'
                when o.value_coded = 6411 then  'BLOOD PRESSURE'
                when o.value_coded = 6583 then  'LAB TESTS ORDERED FOR NEXT VISIT' 
                when o.value_coded = 10496 then  'HYPERTENSION WITH COMPLICATIONS' 
                when o.value_coded = 1664 then  'SIDE EFFECTS FROM TAKING MEDICATIONS' 
                when o.value_coded = 6451 then  'PERSONAL PREFERENCE' 
                when o.value_coded = 1486 then  'HYPOTENSION'
                when o.value_coded = 7342 then  'HYPERTENSION MANAGEMENT' 
                when o.value_coded = 9302 then  'TRANSITION TO ADULT CLINIC' 
                when o.value_coded = 10649 then  'TUBERCULOSIS TREATMENT PROGRAM' 
                when o.value_coded = 2050 then  'MATERNAL CHILD HEALTH PROGRAM' 
                when o.value_coded = 9838 then  'ACTG'
                when o.value_coded = 10739 then  'HIV CARE PROGRAM' 
                when o.value_coded = 11864 then  'PUBLIC PRIVATE PARTNERSHIP PROGRAM' 
                when o.value_coded = 11948 then  'ADVICE BY THE CLINICIAN' 
                when o.value_coded = 12436 then  'CONFIRMATORY HIV SELF TEST RESULTS' 
                when o.value_coded = 1776 then  'PREVENTION OF MOTHER-TO-CHILD TRANSMISSION OF HIV'
	            else ''
	          end) as reason_for_referral,
            TRIM(
              SUBSTRING_INDEX(
              REPLACE(
                REPLACE(
                REPLACE(oa_latest.value_text, '\r\n', '\n'),
                ',', '\n'),
              '.', '\n'),
              '\n', 1)
            ) AS remarks
        from 
            etl.flat_mnch_summary a
        left join amrs.person b on
            b.person_id = a.person_id
        left JOIN
            amrs.patient_identifier c ON
            a.person_id = c.patient_id
            AND c.identifier_type = 48
        INNER JOIN
            amrs.patient_identifier d ON
            a.person_id = d.patient_id
            AND d.identifier_type = 45
        left join amrs.location e on
            e.location_id = a.location_id
        left join amrs.person_name f on
            f.person_id = a.person_id and f.voided = 0 and f.preferred = 1
        left join amrs.person_attribute h on
            h.person_id = a.person_id
            AND h.person_attribute_type_id = 10
        INNER JOIN amrs.patient_identifier i ON a.person_id = i.patient_id AND i.identifier_type = 8
        LEFT JOIN amrs.obs o on o.person_id = a.person_id and o.concept_id in (10926, 10927, 2327, 12019)
        left JOIN amrs.obs ob on ob.person_id = a.person_id and ob.concept_id = 12019
        LEFT JOIN amrs.obs oc on oc.person_id = a.person_id and oc.concept_id = 1357
        INNER JOIN (
             SELECT person_id,
                 CASE
                     WHEN value_coded = 5555 THEN 'MM'
                     WHEN value_coded = 6290 THEN 'MP'
                     WHEN value_coded = 1059 THEN 'W'
                     WHEN value_coded = 1057 THEN 'NM'
                     WHEN value_coded = 1056 THEN 'S'
                     WHEN value_coded = 1058 THEN 'D'
                 END AS marital_status
           FROM (
             SELECT 
 					person_id,
 					concept_id,
 					value_coded,
             ROW_NUMBER() OVER (PARTITION BY person_id ORDER BY obs_datetime DESC) AS rn
             FROM amrs.obs
             WHERE concept_id = 1054
           ) ranked_obs
           WHERE rn = 1
         ) g ON g.person_id = a.person_id
        LEFT JOIN (
				SELECT o.person_id, o.value_text
				FROM amrs.obs o
				INNER JOIN (
					SELECT person_id, MAX(CONCAT(obs_datetime, LPAD(obs_id, 10, '0'))) AS max_key
					FROM amrs.obs
					WHERE concept_id = 7222
					GROUP BY person_id
				) latest
				  ON latest.person_id = o.person_id
				 AND latest.max_key = CONCAT(o.obs_datetime, LPAD(o.obs_id, 10, '0'))
				WHERE o.concept_id = 7222
			) oa_latest ON oa_latest.person_id = a.person_id
        where
            DATE(a.encounter_datetime) BETWEEN '${params.startDate}' AND '${params.endDate}'
            AND e.uuid in (${params.locationUuids})
            AND a.encounter_type in (264,265)
            group by a.person_id
            order by a.encounter_datetime desc, o.obs_datetime desc, oc.obs_datetime desc;
      `;
      queryParts = {
        sql: sql
      };
      return db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result.result);
      });
    });
  },
  getHtsReferrealAndLinkage: (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      const sql = `
      SELECT
  ROW_NUMBER() OVER (ORDER BY patient_data.encounter_datetime) AS serial_number,
  patient_data.person_id AS patient_id,
  patient_data.nupi,
  patient_data.amrsID,
  patient_data.id_number,
  patient_data.first_name,
  patient_data.middle_name,
  patient_data.last_name,
  patient_data.age,
  patient_data.sex,
  patient_data.telephone,
  patient_data.date_of_visit,
  patient_data.hts_provider,
  patient_data.population_type,
  patient_data.sub_population,
  patient_data.priority_population,
  patient_data.setting,
  patient_data.hiv_test1,
  patient_data.client_tested_as,
  patient_data.kit1_name,
  patient_data.lot1,
  patient_data.expiry1,
  patient_data.hiv_test2,
  patient_data.kit2_name,
  patient_data.lot2,
  patient_data.expiry2,
  patient_data.hiv_test3,
  patient_data.kit3_name,
  patient_data.lot3,
  patient_data.expiry3,
  patient_data.final_result,
  patient_data.discordant_couple,
  patient_data.referral_services,
  patient_data.screening_remarks,
  patient_data.referral_to,
  patient_data.handed_to,
  patient_data.art_start_date,
  patient_data.ccc_number,
  patient_data.initial_remarks
FROM (
  -- Get the most recent encounter for each patient
  SELECT
    p.person_id,
    pi_nupi.identifier AS nupi,
    pi_id.identifier AS id_number,
    i.identifier as amrsID,
    pn.given_name AS first_name,
    pn.middle_name AS middle_name,
    pn.family_name AS last_name,
    FLOOR(DATEDIFF(e.encounter_datetime, p.birthdate)/365) AS age,
    p.gender AS sex,
    pa_phone.value AS telephone,
    DATE(e.encounter_datetime) AS date_of_visit,
    e.encounter_datetime,
    pr.name AS hts_provider,
    case
        when g.value = 5555 THEN 1
        when g.value = 1059 THEN 2
        when g.value = 1057 THEN 3
        when g.value = 1058 THEN 4
        when g.value = 1056 THEN 5
    end as marital_status,
    obs_screening.population_type,
    obs_screening.sub_population,
    obs_screening.priority_population,
    obs_screening.setting,
    obs_testing.test1 AS hiv_test1,
    obs_screening.client_tested_as,
    obs_testing.kit1_name,
    obs_testing.lot1,
    obs_testing.expiry1,
    obs_testing.test2 AS hiv_test2,
    obs_testing.kit2_name,
    obs_testing.lot2,
    obs_testing.expiry2,
    obs_testing.test3 AS hiv_test3,
    obs_testing.kit3_name,
    obs_testing.lot3,
    obs_testing.expiry3,
    CASE
        WHEN obs_screening.final_result = 'NEGATIVE' THEN 'N'
        WHEN obs_screening.final_result = 'POSITIVE' THEN 'P'
        WHEN obs_screening.final_result = 'INVALID' THEN 'I'
        WHEN obs_screening.final_result = 'NA' THEN 'NA'
        ELSE ''
    END AS final_result,
    obs_screening.discordant_couple,
    obs_screening.referral_services,
    obs_screening.screening_remarks,
    obs_initial.referral_to,
    obs_initial.handed_to,
    obs_initial.art_start_date,
    obs_initial.ccc_number,
    obs_initial.initial_remarks,
    ROW_NUMBER() OVER (PARTITION BY p.person_id ORDER BY e.encounter_datetime DESC) AS rn
  FROM amrs.encounter e
  JOIN amrs.location l ON e.location_id = l.location_id
  JOIN amrs.person p ON e.patient_id = p.person_id
  LEFT JOIN amrs.person_name pn ON pn.person_id = p.person_id AND pn.preferred = 1 AND pn.voided = 0
  LEFT JOIN amrs.patient_identifier pi_nupi ON pi_nupi.patient_id = p.person_id AND pi_nupi.identifier_type = 45 AND pi_nupi.voided = 0
  LEFT JOIN amrs.patient_identifier pi_id ON pi_id.patient_id = p.person_id AND pi_id.identifier_type = 5 AND pi_id.voided = 0
  LEFT JOIN amrs.person_attribute pa_phone ON pa_phone.person_id = p.person_id AND pa_phone.person_attribute_type_id = 10 AND pa_phone.voided = 0
  LEFT join amrs.person_attribute g on g.person_id = p.person_id AND g.person_attribute_type_id = 5
  INNER JOIN amrs.patient_identifier i ON p.person_id = i.patient_id AND i.identifier_type = 8
  LEFT JOIN (
    SELECT
      o.encounter_id,
        MAX(CASE 
                WHEN o.concept_id = 9782 AND o.value_coded = 9783 THEN 1 
                WHEN o.concept_id = 9782 AND o.value_coded = 12251 THEN 2 
                WHEN o.concept_id = 9782 AND o.value_coded = 6578 THEN 2 
                ELSE ''
            END) AS population_type,
      MAX(CASE 
                WHEN o.concept_id = 9782 AND o.value_coded = 6096 THEN 'DC' 
                WHEN o.concept_id = 9782 AND o.value_coded = 8291 THEN 'MSM/MSW' 
                WHEN o.concept_id = 9782 AND o.value_coded = 9785 THEN 'MSM/MSW' 
                WHEN o.concept_id = 9782 AND o.value_coded = 9786 THEN 'FSW' 
                WHEN o.concept_id = 9782 AND o.value_coded = 105 THEN 'PWID/PWUD' 
                WHEN o.concept_id = 9782 AND o.value_coded = 12251 THEN 'VP' 
                ELSE ''
      END) AS sub_population,
    MAX(CASE WHEN o.concept_id = 11288 THEN 
        CASE 
            WHEN o.value_coded = 1065 THEN 'YES'
            WHEN o.value_coded = 1066 THEN 'NO'
            ELSE o.value_text 
        END 
    END) AS priority_population,
    MAX(CASE 
             WHEN o.concept_id = 11873 AND o.value_coded = 9613 THEN 2
             WHEN o.concept_id = 11873 AND o.value_coded = 6708 THEN 1 
             ELSE '' 
        END) AS setting,
    MAX(CASE WHEN o.concept_id = 10867 THEN cn3.name END) AS client_tested_as,
    MAX(CASE WHEN o.concept_id = 1357 THEN cn4.name END) AS final_result,
    null AS discordant_couple,
    MAX(
      CASE 
        WHEN o.concept_id = 1272 THEN 
        CASE
            WHEN o.value_coded = 9823 THEN 1
            WHEN o.value_coded = 9822 THEN 2
            WHEN o.value_coded = 8707 THEN 3
            WHEN o.value_coded = 9821 THEN 4
            ELSE 'NA' 
        END 
    END) AS referral_services,
    MAX(CASE WHEN o.concept_id = 9467 THEN o.value_text END) AS screening_remarks
    FROM amrs.obs o
    LEFT JOIN amrs.concept_name cn ON cn.concept_id = o.value_coded AND cn.locale_preferred = 1 AND cn.voided = 0
      LEFT JOIN amrs.concept_name cn1 ON cn1.concept_id = o.value_coded AND cn1.locale_preferred = 1 AND cn1.voided = 0 AND o.concept_id = 9782
  LEFT JOIN amrs.concept_name cn2 ON cn2.concept_id = o.value_coded AND cn2.locale_preferred = 1 AND cn2.voided = 0 AND o.concept_id = 11873
  LEFT JOIN amrs.concept_name cn3 ON cn3.concept_id = o.value_coded AND cn3.locale_preferred = 1 AND cn3.voided = 0 AND o.concept_id = 10867
  LEFT JOIN amrs.concept_name cn4 ON cn4.concept_id = o.value_coded AND cn4.locale_preferred = 1 AND cn4.voided = 0 AND o.concept_id = 1357
    WHERE o.voided = 0
    GROUP BY o.encounter_id
  ) AS obs_screening ON obs_screening.encounter_id = e.encounter_id
  LEFT JOIN (
    SELECT
      encounter_id,
      MAX(CASE WHEN concept_id = 10926 THEN value_text END) AS referral_to,
      MAX(CASE WHEN concept_id = 10869 THEN value_text END) AS handed_to,
      MAX(CASE WHEN concept_id = 1499 THEN value_datetime END) AS art_start_date,
      MAX(CASE WHEN concept_id = 9775 THEN value_text END) AS ccc_number,
      MAX(CASE WHEN concept_id = 9467 THEN value_text END) AS initial_remarks
    FROM amrs.obs
    WHERE voided = 0
    GROUP BY encounter_id
  ) AS obs_initial ON obs_initial.encounter_id = e.encounter_id
  LEFT JOIN (
    SELECT
      encounter_id,
      MAX(CASE WHEN test_num = 1 THEN value_coded END) AS test1,
      MAX(CASE WHEN test_num = 1 THEN kit_name END) AS kit1_name,
      MAX(CASE WHEN test_num = 1 THEN lot END) AS lot1,
      MAX(CASE WHEN test_num = 1 THEN expiry END) AS expiry1,
      MAX(CASE WHEN test_num = 2 THEN value_coded END) AS test2,
      MAX(CASE WHEN test_num = 2 THEN kit_name END) AS kit2_name,
      MAX(CASE WHEN test_num = 2 THEN lot END) AS lot2,
      MAX(CASE WHEN test_num = 2 THEN expiry END) AS expiry2,
      MAX(CASE WHEN test_num = 3 THEN value_coded END) AS test3,
      MAX(CASE WHEN test_num = 3 THEN kit_name END) AS kit3_name,
      MAX(CASE WHEN test_num = 3 THEN lot END) AS lot3,
      MAX(CASE WHEN test_num = 3 THEN expiry END) AS expiry3
    FROM (
      SELECT 
        o.encounter_id,
        o.value_coded,
        ROW_NUMBER() OVER (PARTITION BY o.encounter_id ORDER BY o.obs_id) AS test_num,
        CASE
          WHEN kit_name.value_coded = 2341 THEN 'BIOLINE HIV RAPID TEST'
          WHEN kit_name.value_coded = 2342 THEN 'UNIGOLD HIV RAPID TEST'
          WHEN kit_name.value_coded = 6155 THEN 'DETERMINE HIV RAPID TEST'
          WHEN kit_name.value_coded = 11021 THEN 'FIRST RESPONSE TEST KIT'
          WHEN kit_name.value_coded = 11022 THEN 'DUAL TEST KIT'
          WHEN kit_name.value_coded = 12484 THEN 'TRINITY BIOTECH TRINSCREEN HIV TEST'
          WHEN kit_name.value_coded = 12485 THEN 'ONE STEP HIV 1/2 TESTING KIT'
          WHEN kit_name.value_coded = 12489 THEN 'STANDARD Q'
        END AS kit_name,
        lot.value_text AS lot,
        expiry.value_datetime AS expiry
      FROM amrs.obs o
      LEFT JOIN amrs.obs kit_name 
        ON kit_name.encounter_id = o.encounter_id 
        AND kit_name.concept_id = 2343
        AND kit_name.voided = 0
      LEFT JOIN amrs.obs lot 
        ON lot.encounter_id = o.encounter_id 
        AND lot.concept_id = 10412
        AND lot.voided = 0
      LEFT JOIN amrs.obs expiry 
        ON expiry.encounter_id = o.encounter_id 
        AND expiry.concept_id = 10413
        AND expiry.voided = 0
      WHERE o.concept_id = 10868
        AND o.voided = 0
    ) AS tests
    GROUP BY encounter_id
  ) AS obs_testing ON obs_testing.encounter_id = e.encounter_id
   LEFT JOIN (
  SELECT encounter_id,
         CONCAT_WS(' ', pn.given_name, pn.middle_name, pn.family_name) AS name

    FROM (
    SELECT e.encounter_id,
           e.creator,
           ROW_NUMBER() OVER (PARTITION BY e.encounter_id ORDER BY e.encounter_datetime DESC) AS rn
      FROM amrs.encounter e
      WHERE e.voided = 0
    ) latest
    LEFT JOIN amrs.users u ON u.user_id = latest.creator
    LEFT JOIN amrs.person_name pn ON pn.person_id = u.person_id
    WHERE latest.rn = 1
  ) pr ON pr.encounter_id = e.encounter_id

  WHERE e.encounter_type IN (290,291, 295, 296, 290)
    AND e.voided = 0
    AND l.uuid IN (${params.locationUuids})
    AND DATE(e.encounter_datetime) BETWEEN ('${params.startDate}') AND ('${params.endDate}')
) AS patient_data
WHERE patient_data.rn = 1 
ORDER BY patient_data.encounter_datetime;
      `;
      queryParts = {
        sql: sql
      };
      return db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result.result);
      });
    });
  },
  getMaternityRegister: (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      const sql = `
      select 
      distinct
a.maternity_admission_date as date_of_admission,
b.identifier as admission_number,
c.identifier as nupi,
i.identifier as amrsID,
concat(d.given_name, ' ', d.middle_name, ' ', d.family_name) as full_names,
e.birthdate as date_of_birth,
timestampdiff(year, e.birthdate, a.encounter_datetime) as age,
f.county_district as subcounty_county,
f.city_village as village_estate_landmark,
h.value as phone_number,
g.*,
a.parity as parity,
a.gravidae as gravidae,
a.anc_visit_no as no_of_anc_visits,
a.last_lmp_date as lmp,
a.edd as edd,
a.diagnosis as diagnosis,
a.duration_of_delivery as duration_of_labour,
a.day_of_delivery as date_of_delivery,
a.time_of_delivery as time_of_delivery,
a.gestation_at_birth as gestation_at_birth,
a.mode_of_delivery as mode_of_delivery,
a.no_of_babies as no_of_babies_delivered,
a.placenta_complete as placenta_complete,
a.uterotonic_given as uterotonic_given,
a.vaginal_examination as vaginal_examination,
a.blood_loss as blood_loss,
a.mothers_status_after_delivery as mother_status_after_delivery,
case
	when a.maternal_death_notified is not null THEN 'Y'
    else 'N'
end as maternal_deaths_notified,
a.maternal_death_notified as date_maternal_death_notified,
a.delivery_complications as delivery_complications,
a.apgar_score as apgar_score,
a.birth_outcome as birth_outcome,
a.birth_weight as birth_weight,
a.baby_sex as sex,
a.BF_in_one_hour as initiated_on_bf_less_one_hour,
a.kangaroo_mother_care as kangaroo_mother_care,
a.teo_at_birth as teo_given_at_birth,
a.chlorhexidine_for_cord as chlorhexdine_applied_on_cord_stump,
a.birth_with_deformity as birth_with_deformity,
a.type_of_deformity,
a.vitamin_k as given_vitamin_k,
a.rpr_test_result,
a.vdrl_test_result,
a.duo_test_result as vdrl_rpr_results,
a.hiv_test_1_kit_name as hiv_test_1_kit_name,
a.hiv_test_1_lot_no as hiv_test_1_lot_no,
a.hiv_test_1_expiry_date as hiv_test_1_expiry_date,
a.hiv_test_1_test_result,
a.hiv_test_2_kit_name as hiv_test_2_kit_name,
a.hiv_test_2_lot_no as hiv_test_2_lot_no,
a.hiv_test_2_expiry_date as hiv_test_2_expiry_date,
a.hiv_test_2_test_result,
a.hiv_test_3_kit_name as hiv_test_3_kit_name,
a.hiv_test_3_lot_no as hiv_test_3_lot_no,
a.hiv_test_3_expiry_date as hiv_test_3_expiry_date,
a.hiv_test_3_test_result,
a.patient_hiv_result as hiv_test_results_maternity,
MAX(CASE
    WHEN ob.value_coded = 10434 THEN 'INITIAL TEST'
    WHEN ob.value_coded = 10200 THEN 'REVISIT'
    WHEN ob.value_coded = 10407 THEN 'KNOWN POSITIVE'
    WHEN ob.value_coded = 12074 THEN 'KNOWN POSITIVE'
    WHEN ob.value_coded = 10973 THEN 'RETEST'
    ELSE ''
END) AS hiv_test_type,
-- a.hiv_test_type as hiv_test_type,
a.maternal_haart as maternal_haart,
a.infant_prophylaxis as infant_prophylaxis,
a.partner_hiv_status as partner_tested_for_hiv,
a.infant_feeding_counselling as counselled_on_infant_feeding,
a.delivery_conducted_by as deleivery_conducted_by,
a.birth_notification_number as birth_notification_number,
a.discharge_date as discharge_date,
a.baby_status_on_discharge as discharge_status_of_baby,
MAX(CASE
        WHEN o.value_coded = 6881 THEN 'PRIVATE HEALTH FACILITY'
        WHEN o.value_coded = 6880 then 'PUBLIC HEALTH FACILITY'
        WHEN o.value_coded = 9613 then 'COMMUNITY'
        WHEN o.value_coded = 6708 then 'HEALTH FACILITY'
        WHEN o.value_coded = 7308 then 'ANOTHER FACILITY, NOS'
        WHEN o.value_coded = 11870 then 'THIS HEALTH FACILITY'
END) AS referrals_from,
MAX(CASE
        WHEN o.value_coded = 6881 THEN 'PRIVATE HEALTH FACILITY'
        WHEN o.value_coded = 6880 then 'PUBLIC HEALTH FACILITY'
        WHEN o.value_coded = 9613 then 'COMMUNITY'
        WHEN o.value_coded = 6708 then 'HEALTH FACILITY'
        WHEN o.value_coded = 7308 then 'ANOTHER FACILITY, NOS'
        WHEN o.value_coded = 11870 then 'THIS HEALTH FACILITY'
END) AS referrals_to,
MAX(CASE
        when o.value_coded = 1578 then  'TRANSPORT COSTS'
        when o.value_coded = 5622 then  'OTHER NON-CODED' 
        when o.value_coded = 1548 then  'HEALTH ISSUES' 
        when o.value_coded = 2329 then  'ACUTE' 
        when o.value_coded = 2330 then  'CHRONIC' 
        when o.value_coded = 5484 then  'NUTRITIONAL SUPPORT'
        when o.value_coded = 6510 then  'CORE NEEDLE BIOPSY'
        when o.value_coded = 7465 then  'SURGERY' 
        when o.value_coded = 6511 then  'EXCISIONAL OR SURGICAL BIOPSY' 
        when o.value_coded = 6502 then  'ULTRASOUND' 
        when o.value_coded = 7190 then  'FINE NEEDLE ASPIRATION, NOS' 
        when o.value_coded = 8262 then  'DEBRIDEMENT'
        when o.value_coded = 6411 then  'BLOOD PRESSURE'
        when o.value_coded = 6583 then  'LAB TESTS ORDERED FOR NEXT VISIT' 
        when o.value_coded = 10496 then  'HYPERTENSION WITH COMPLICATIONS' 
        when o.value_coded = 1664 then  'SIDE EFFECTS FROM TAKING MEDICATIONS' 
        when o.value_coded = 6451 then  'PERSONAL PREFERENCE' 
        when o.value_coded = 1486 then  'HYPOTENSION'
        when o.value_coded = 7342 then  'HYPERTENSION MANAGEMENT' 
        when o.value_coded = 9302 then  'TRANSITION TO ADULT CLINIC' 
        when o.value_coded = 10649 then  'TUBERCULOSIS TREATMENT PROGRAM' 
        when o.value_coded = 2050 then  'MATERNAL CHILD HEALTH PROGRAM' 
        when o.value_coded = 9838 then  'ACTG'
        when o.value_coded = 10739 then  'HIV CARE PROGRAM' 
        when o.value_coded = 11864 then  'PUBLIC PRIVATE PARTNERSHIP PROGRAM' 
        when o.value_coded = 11948 then  'ADVICE BY THE CLINICIAN' 
        when o.value_coded = 12436 then  'CONFIRMATORY HIV SELF TEST RESULTS' 
        when o.value_coded = 1776 then  'PREVENTION OF MOTHER-TO-CHILD TRANSMISSION OF HIV'
	    else ''
end) as reason_for_referral,
        TRIM(
              SUBSTRING_INDEX(
              REPLACE(
                REPLACE(
                REPLACE(oa_latest.value_text, '\r\n', '\n'),
                ',', '\n'),
              '.', '\n'),
              '\n', 1)
          ) AS comments
from
etl.flat_mnch_summary a
LEFT JOIN
	amrs.patient_identifier b ON a.person_id = b.patient_id AND b.identifier_type = 49
LEFT JOIN
	amrs.patient_identifier c ON a.person_id = c.patient_id AND c.identifier_type = 45
left join amrs.person_name d on d.person_id = a.person_id and d.voided = 0 and d.preferred = 1
left join amrs.person e on e.person_id = a.person_id
left join amrs.location f on f.location_id = a.location_id
left join amrs.person_attribute h on h.person_id = a.person_id AND h.person_attribute_type_id = 10
INNER JOIN amrs.patient_identifier i ON a.person_id = i.patient_id AND i.identifier_type = 8
INNER JOIN amrs.obs o on o.person_id = a.person_id and o.concept_id in (10926, 10927, 2327, 12019)
INNER JOIN amrs.obs ob on ob.person_id = a.person_id and ob.concept_id = 12019
LEFT JOIN (
				SELECT o.person_id, o.value_text
				FROM amrs.obs o
				INNER JOIN (
					SELECT person_id, MAX(CONCAT(obs_datetime, LPAD(obs_id, 10, '0'))) AS max_key
					FROM amrs.obs
					WHERE concept_id = 7222
					GROUP BY person_id
				) latest
				  ON latest.person_id = o.person_id
				 AND latest.max_key = CONCAT(o.obs_datetime, LPAD(o.obs_id, 10, '0'))
				WHERE o.concept_id = 7222
			) oa_latest ON oa_latest.person_id = a.person_id
INNER JOIN (
            SELECT person_id,
                CASE
                    WHEN value_coded = 5555 THEN 'MM'
                    WHEN value_coded = 6290 THEN 'MP'
                    WHEN value_coded = 1059 THEN 'W'
                    WHEN value_coded = 1057 THEN 'NM'
                    WHEN value_coded = 1056 THEN 'S'
                    WHEN value_coded = 1058 THEN 'D'
                END AS marital_status
          FROM (
            SELECT *,
            ROW_NUMBER() OVER (PARTITION BY person_id ORDER BY obs_datetime DESC) AS rn
            FROM amrs.obs
            WHERE concept_id = 1054
          ) ranked_obs
          WHERE rn = 1
        ) g ON g.person_id = a.person_id
        where
            DATE(a.encounter_datetime) BETWEEN '${params.startDate}' AND '${params.endDate}'
            AND a.encounter_type in (196,273,274)
            AND f.uuid in (${params.locationUuids})
            group by a.person_id
            order by a.encounter_datetime desc, ob.obs_datetime desc;
      `;
      queryParts = {
        sql: sql
      };
      return db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result.result);
      });
    });
  },
  getPncRegister: (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      const sql = `
      select 
      distinct
a.encounter_datetime as date_of_visit,
b.identifier as pnc_number,
c.identifier as nupi,
h.identifier as amrsID,
concat(d.given_name, ' ', d.middle_name, ' ', d.family_name) as full_names,
e.birthdate as date_of_birth,
timestampdiff(year, e.birthdate, a.encounter_datetime) as age,
f.county_district as subcounty_county,
f.city_village as village_estate_landmark,
g.value as phone_number,
a.day_of_delivery as date_of_delivery,
a.place_of_delivery as place_of_delivery,
a.mode_of_delivery as mode_of_delivery,
null as timing_mother,
null as timing_baby,
a.temperature as temperature,
a.pulse as pulse,
a.blood_pressure as blood_pressure,
case
 when a.pallor is not null then 'Y'
 else 'N'
end as pallor_present,
a.pallor as pallor,
a.breast as breast,
a.uterus as uterus,
a.pph as pph,
a.c_section_site as c_section_site,
a.lochia as lochia,
a.episiotomy as episiotomy,
a.fistula as fistula,
a.tb_screening as tb_screening,
null as tested_pnc,
a.hiv_test_1_kit_name as hiv_test_1_kit_name,
a.hiv_test_1_lot_no as hiv_test_1_lot_no,
a.hiv_test_1_expiry_date as hiv_test_1_expiry_date,
a.hiv_test_1_test_result,
a.hiv_test_2_kit_name as hiv_test_2_kit_name,
a.hiv_test_2_lot_no as hiv_test_2_lot_no,
a.hiv_test_2_expiry_date as hiv_test_2_expiry_date,
a.hiv_test_2_test_result,
a.hiv_test_3_kit_name as hiv_test_3_kit_name,
a.hiv_test_3_lot_no as hiv_test_3_lot_no,
a.hiv_test_3_expiry_date as hiv_test_3_expiry_date,
a.hiv_test_3_test_result,
a.patient_hiv_result as hiv_test_results_pnc,
a.pnc_at_6_weeks_or_less as results_less_6_weeks,
a.pnc_at_more_than_6_weeks as results_greater_6_weeks,
a.infant_prophylaxis_at_6_weeks_or_less as infant_prophylaxis_less_6_weeks,
a.maternal_haart_at_6_weeks_or_less as maternal_haart_less_6_weeks,
a.infant_prophylaxis_at_more_than_6_weeks as infant_prophylaxis_greater_6_weeks,
a.maternal_haart_at_more_than_6_weeks as maternal_haart_greater_6_weeks,
a.cervical_cancer_method as cervical_cancer_method,
a.cervical_cancer_result as cervical_cancer_results,
a.postpartum_visit_baby,
a.postpartum_visit_mother,
MAX(CASE
    WHEN ob.value_coded = 10434 THEN 'INITIAL TEST'
    WHEN ob.value_coded = 10200 THEN 'REVISIT'
    WHEN ob.value_coded = 10407 THEN 'KNOWN POSITIVE'
    WHEN ob.value_coded = 12074 THEN 'KNOWN POSITIVE'
    WHEN ob.value_coded = 10973 THEN 'RETEST'
    ELSE ''
END) AS tested_pnc,
-- a.tested_pnc,
a.maternal_haart,
a.infant_prophylaxis,
a.ppfp_done as counselled,
a.ppfp_method as family_planning_method,
a.other_complications as other_maternal_complications,
a.haematinics as haematinics,
MAX(CASE
        WHEN o.value_coded = 6881 THEN 'PRIVATE HEALTH FACILITY'
        WHEN o.value_coded = 6880 then 'PUBLIC HEALTH FACILITY'
        WHEN o.value_coded = 9613 then 'COMMUNITY'
        WHEN o.value_coded = 6708 then 'HEALTH FACILITY'
        WHEN o.value_coded = 7308 then 'ANOTHER FACILITY, NOS'
        WHEN o.value_coded = 11870 then 'THIS HEALTH FACILITY'
        END) AS referrals_from,
MAX(CASE
        WHEN o.value_coded = 6881 THEN 'PRIVATE HEALTH FACILITY'
        WHEN o.value_coded = 6880 then 'PUBLIC HEALTH FACILITY'
        WHEN o.value_coded = 9613 then 'COMMUNITY'
        WHEN o.value_coded = 6708 then 'HEALTH FACILITY'
        WHEN o.value_coded = 7308 then 'ANOTHER FACILITY, NOS'
        WHEN o.value_coded = 11870 then 'THIS HEALTH FACILITY'
END) AS referrals_to,
MAX(CASE
        when o.value_coded = 1578 then  'TRANSPORT COSTS'
        when o.value_coded = 5622 then  'OTHER NON-CODED' 
        when o.value_coded = 1548 then  'HEALTH ISSUES' 
        when o.value_coded = 2329 then  'ACUTE' 
        when o.value_coded = 2330 then  'CHRONIC' 
        when o.value_coded = 5484 then  'NUTRITIONAL SUPPORT'
        when o.value_coded = 6510 then  'CORE NEEDLE BIOPSY'
        when o.value_coded = 7465 then  'SURGERY' 
        when o.value_coded = 6511 then  'EXCISIONAL OR SURGICAL BIOPSY' 
        when o.value_coded = 6502 then  'ULTRASOUND' 
        when o.value_coded = 7190 then  'FINE NEEDLE ASPIRATION, NOS' 
        when o.value_coded = 8262 then  'DEBRIDEMENT'
        when o.value_coded = 6411 then  'BLOOD PRESSURE'
        when o.value_coded = 6583 then  'LAB TESTS ORDERED FOR NEXT VISIT' 
        when o.value_coded = 10496 then  'HYPERTENSION WITH COMPLICATIONS' 
        when o.value_coded = 1664 then  'SIDE EFFECTS FROM TAKING MEDICATIONS' 
        when o.value_coded = 6451 then  'PERSONAL PREFERENCE' 
        when o.value_coded = 1486 then  'HYPOTENSION'
        when o.value_coded = 7342 then  'HYPERTENSION MANAGEMENT' 
        when o.value_coded = 9302 then  'TRANSITION TO ADULT CLINIC' 
        when o.value_coded = 10649 then  'TUBERCULOSIS TREATMENT PROGRAM' 
        when o.value_coded = 2050 then  'MATERNAL CHILD HEALTH PROGRAM' 
        when o.value_coded = 9838 then  'ACTG'
        when o.value_coded = 10739 then  'HIV CARE PROGRAM' 
        when o.value_coded = 11864 then  'PUBLIC PRIVATE PARTNERSHIP PROGRAM' 
        when o.value_coded = 11948 then  'ADVICE BY THE CLINICIAN' 
        when o.value_coded = 12436 then  'CONFIRMATORY HIV SELF TEST RESULTS' 
        when o.value_coded = 1776 then  'PREVENTION OF MOTHER-TO-CHILD TRANSMISSION OF HIV'
	    else ''
end) as reason_for_referral,
TRIM(
              SUBSTRING_INDEX(
              REPLACE(
                REPLACE(
                REPLACE(oa_latest.value_text, '\r\n', '\n'),
                ',', '\n'),
              '.', '\n'),
              '\n', 1)
          ) AS remarks

from
etl.flat_mnch_summary a
left JOIN
	amrs.patient_identifier b ON b.patient_id = a.person_id AND b.identifier_type = 48
left JOIN
	amrs.patient_identifier c ON a.person_id = c.patient_id AND c.identifier_type = 45
left join amrs.person_name d on d.person_id = a.person_id and d.voided = 0 and d.preferred = 1
left join amrs.person e on e.person_id = a.person_id
left join amrs.location f on f.location_id = a.location_id
left join amrs.person_attribute g on g.person_id = a.person_id AND g.person_attribute_type_id = 10
INNER JOIN amrs.patient_identifier h ON a.person_id = h.patient_id AND h.identifier_type = 8
INNER JOIN amrs.obs o on o.person_id = a.person_id and o.concept_id in (10926, 10927, 2327)
INNER JOIN amrs.obs ob on ob.person_id = a.person_id and ob.concept_id = 12019
LEFT JOIN (
				SELECT o.person_id, o.value_text
				FROM amrs.obs o
				INNER JOIN (
					SELECT person_id, MAX(CONCAT(obs_datetime, LPAD(obs_id, 10, '0'))) AS max_key
					FROM amrs.obs
					WHERE concept_id = 7222
					GROUP BY person_id
				) latest
				  ON latest.person_id = o.person_id
				 AND latest.max_key = CONCAT(o.obs_datetime, LPAD(o.obs_id, 10, '0'))
				WHERE o.concept_id = 7222
			) oa_latest ON oa_latest.person_id = a.person_id
        where
            DATE(a.encounter_datetime) BETWEEN '${params.startDate}' AND '${params.endDate}'
            AND a.encounter_type in (266,267)
            AND f.uuid in (${params.locationUuids})
            group by a.person_id
            order by a.encounter_datetime desc, ob.obs_datetime desc;
      `;
      queryParts = {
        sql: sql
      };
      return db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result.result);
      });
    });
  },
  getNutritionRegister: (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      const sql = `
      select 
o.obs_datetime as date,
pi.identifier as id_number,
pi2.identifier as nupi,
pi1.identifier as ccc_number,
CONCAT_WS('/', pn.given_name, pn.middle_name, pn.family_name) AS full_names,
null as visit_type,
CONCAT_WS('/', pa.value, pa1.value, pa2.value) AS village_estate_landmark,
null as residence,
p.gender as sex,
null as type_of_addmission,
null as admission_criteria,
pa3.value as phone_number,
CASE WHEN o.concept_id = 5089 THEN o.value_numeric END AS weight,
CASE WHEN o.concept_id = 5090 THEN o.value_numeric END AS height,
TIMESTAMPDIFF(YEAR, p.birthdate, CURDATE()) AS age_years,
TIMESTAMPDIFF(MONTH, p.birthdate, CURDATE()) AS age_months,
CASE
	WHEN o.concept_id = 8351 and o.value_coded = 1484 THEN 'Y'
    WHEN o.concept_id = 8351 and o.value_coded = 9608 THEN 'N'
    WHEN o.concept_id = 8351 and o.value_coded = 1175 THEN 'NA'
    ELSE NULL
END AS pregnant_lactating,
CASE
    WHEN o.concept_id = 8238 THEN 1          -- Weight for Height
    WHEN o.concept_id = 1342 THEN 3          -- Weight for Age
    WHEN o.concept_id = 1343 THEN 5          -- MUAC
    ELSE NULL
END AS nutritional_assessment_code,
CASE
    WHEN o.concept_id IN (8238, 1343, 1342) THEN o.value_numeric
    ELSE NULL
END AS nutritional_assessment_value,
CASE
	WHEN o.concept_id = 7369 and o.value_coded = 9471 THEN 1
    WHEN o.concept_id = 7369 and o.value_coded = 9472 THEN 2
    WHEN o.concept_id = 7369 and o.value_coded = 1115 THEN 4
    WHEN o.concept_id = 7369 and o.value_coded = 10277 THEN 3
    WHEN o.concept_id = 7369 and o.value_coded = 7764 THEN 5
    ELSE NULL
END AS nutritional_status,
CASE
	WHEN o.concept_id = 6709 and o.value_coded = 703 THEN 'P'
    WHEN o.concept_id = 6709 and o.value_coded = 664 THEN 'N'
    WHEN o.concept_id = 6709 and o.value_coded = 1067 THEN 'U'
    ELSE NULL
END AS serostatus,
CASE
	WHEN o.concept_id = 9474 and o.value_coded = 9326 THEN 2
    WHEN o.concept_id = 9474 and o.value_coded = 903 THEN 3
    WHEN o.concept_id = 9474 and o.value_coded = 5622 THEN 4
    WHEN o.concept_id = 9474 and o.value_coded = 1107 THEN 5
    ELSE NULL
END AS cormobidities,
CASE
	WHEN o.concept_id = 8201 and o.value_coded = 6684 THEN 1
    WHEN o.concept_id = 8201 and o.value_coded = 6656 THEN 2
    ELSE NULL
END AS food_secure,
CASE WHEN o.concept_id = 8238 THEN o.value_numeric END AS weight_for_height_z_score,
CASE WHEN o.concept_id = 8239 THEN o.value_numeric END AS bmi_for_age_z_score,
CASE WHEN o.concept_id = 1342 THEN o.value_numeric END AS bmi_kg_m2,
CASE WHEN o.concept_id = 1343 THEN o.value_numeric END AS muac,
CASE
	WHEN o.concept_id = 9499 and o.value_coded = 9498 THEN 3
    WHEN o.concept_id = 9499 and o.value_coded = 9482 THEN '1/2'
    WHEN o.concept_id = 9499 and o.value_coded = 9495 THEN 4
    WHEN o.concept_id = 9499 and o.value_coded = 5622 THEN 5
    WHEN o.concept_id = 9499 and o.value_coded = 1107 THEN 6
    ELSE NULL
END AS nutritional_intervention,
null as exit_date,
null as length_of_stay,
null as exit_outcome,
null as weeks,
TRIM(
              SUBSTRING_INDEX(
              REPLACE(
                REPLACE(
                REPLACE(oa_latest.value_text, '\r\n', '\n'),
                ',', '\n'),
              '.', '\n'),
              '\n', 1)
          ) AS remarks
from
amrs.obs o
left join amrs.patient_identifier pi on pi.patient_id = o.person_id and pi.identifier_type = 5
left join amrs.patient_identifier pi1 on pi1.patient_id = o.person_id and pi1.identifier_type = 28
left join amrs.patient_identifier pi2 on pi2.patient_id = o.person_id and pi2.identifier_type = 45
left join amrs.person_name pn on pn.person_id = o.person_id and pn.preferred = 1
left join amrs.person_attribute pa on pa.person_id = o.person_id and pa.person_attribute_type_id = 120
left join amrs.person_attribute pa1 on pa1.person_id = o.person_id and pa1.person_attribute_type_id = 116
left join amrs.person_attribute pa2 on pa2.person_id = o.person_id and pa2.person_attribute_type_id = 31
left join amrs.person_attribute pa3 on pa3.person_id = o.person_id and pa3.person_attribute_type_id = 10
left join amrs.person p on p.person_id = o.person_id 
left join amrs.location l on l.location_id = o.location_id
LEFT JOIN (
				SELECT o.person_id, o.value_text
				FROM amrs.obs o
				INNER JOIN (
					SELECT person_id, MAX(CONCAT(obs_datetime, LPAD(obs_id, 10, '0'))) AS max_key
					FROM amrs.obs
					WHERE concept_id = 9467
					GROUP BY person_id
				) latest
				  ON latest.person_id = o.person_id
				 AND latest.max_key = CONCAT(o.obs_datetime, LPAD(o.obs_id, 10, '0'))
				WHERE o.concept_id = 9467
			) oa_latest ON oa_latest.person_id = o.person_id
where o.concept_id in (7369,9474, 8351, 6709, 8238, 1343, 1342, 5089, 5090)
        AND
            DATE(o.obs_datetime) BETWEEN '${params.startDate}' AND '${params.endDate}'
            AND l.uuid in (${params.locationUuids})
            group by o.person_id;
      `;
      queryParts = {
        sql: sql
      };
      return db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result.result);
      });
    });
  },
  getOTZRegisterData: (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      const sql = `
         SELECT
  ROW_NUMBER() OVER (ORDER BY e.encounter_datetime) AS serial_number,
  DATE(e.encounter_datetime) AS date_of_enrollment,
  pi_id.identifier AS CCC,
  pn.given_name AS first_name,
  pn.middle_name AS middle_name,
  pn.family_name AS last_name,
  p.birthdate AS date_of_birth,
  p.person_id AS personId,
  fhs.arv_start_date,
  FLOOR(DATEDIFF(e.encounter_datetime, p.birthdate)/365) AS age,
  p.gender AS sex,
  DATE(e.encounter_datetime) AS date_of_visit,
  fhs.arv_start_date,
  CASE 
	  WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fhs.cur_arv_meds, '##', -1), '##', 1)) = 631 THEN 'NEVIIRAPINE'
      WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fhs.cur_arv_meds, '##', -1), '##', 1)) = 792 THEN 'STAVUDINE LAMIVUDINE AND NEVIRAPINE'
      WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fhs.cur_arv_meds, '##', -1), '##', 1)) = 794 THEN 'LOPINAVIR AND RITONAVIR'
      WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fhs.cur_arv_meds, '##', -1), '##', 1)) = 630 THEN 'ZIDOVUDINE AND LAMIVUDINE'
      WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fhs.cur_arv_meds, '##', -1), '##', 1)) = 625 THEN 'STAVUDINE'
      WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fhs.cur_arv_meds, '##', -1), '##', 1)) = 796 THEN 'DIDANOSINE'
      WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fhs.cur_arv_meds, '##', -1), '##', 1)) = 814 THEN 'ABACAVIR'
      WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fhs.cur_arv_meds, '##', -1), '##', 1)) = 635 THEN 'NELFINAVIR'
      WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fhs.cur_arv_meds, '##', -1), '##', 1)) = 633 THEN 'EFAVIRENZ'
      WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fhs.cur_arv_meds, '##', -1), '##', 1)) = 628 THEN 'LAMIVUDINE'
      WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fhs.cur_arv_meds, '##', -1), '##', 1)) = 802 THEN 'TENOFOVIR'
      WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fhs.cur_arv_meds, '##', -1), '##', 1)) = 749 THEN 'INDINAVIR'
      WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fhs.cur_arv_meds, '##', -1), '##', 1)) = 9052 THEN 'EFAVIRENZ LAMIVUDINE AND STADUVINE'
      WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fhs.cur_arv_meds, '##', -1), '##', 1)) = 797 THEN 'ZIDOVUDINE'
      WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fhs.cur_arv_meds, '##', -1), '##', 1)) = 791 THEN 'EMTRICITABINE'
      WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fhs.cur_arv_meds, '##', -1), '##', 1)) = 9026 THEN 'LOPINAVIR'
      WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fhs.cur_arv_meds, '##', -1), '##', 1)) = 795 THEN 'RITONAVIR'
      WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fhs.cur_arv_meds, '##', -1), '##', 1)) = 6159 THEN 'ATAZANAVIR'
      WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fhs.cur_arv_meds, '##', -1), '##', 1)) = 6467 THEN 'NEVIRAPINE LAMIVUDINE AND ZIDOVUDINE'
      WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fhs.cur_arv_meds, '##', -1), '##', 1)) = 10795 THEN 'EFAVIRENZ AND LAMIVUDINE AND TENOFOVIR DISOPROXIL'
      WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fhs.cur_arv_meds, '##', -1), '##', 1)) = 10796 THEN 'EFAVIRENZ AND EMTRICITABINE AND TENOFOVIR DISOPROXIL'
      WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fhs.cur_arv_meds, '##', -1), '##', 1)) = 9055 THEN 'LAMIVUDINE LOPINAVIR RITONAVIR AND TENOFOVIR'
      WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fhs.cur_arv_meds, '##', -1), '##', 1)) = 817 THEN 'ABACAVIR LAMIVUDINE AND ZIDOVUDINE '
      WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fhs.cur_arv_meds, '##', -1), '##', 1)) = 9050 THEN 'ABACAVIR NEVIRAPINE AND LAMIVUDINE'
      WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fhs.cur_arv_meds, '##', -1), '##', 1)) = 9051 THEN 'ABACAVIR LAMIVUDINE LOPINAVIR AND RITONAVIR'
      WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fhs.cur_arv_meds, '##', -1), '##', 1)) = 9759 THEN 'DTG/3TC/TDF'
  END AS art_regimen,
  fhs.cur_arv_line_reported,
  obs_otz.otz_orientation,
  obs_otz.otz_treatment_literacy,
  obs_otz.otz_participation,
  obs_otz.otz_mentorship,
  obs_otz.otz_leadership,
  obs_otz.otz_edu_prevention,
  obs_otz.otz_future_decision,
  obs_otz.otz_transition,
  TRIM(
      SUBSTRING_INDEX(
              REPLACE(
                REPLACE(
                REPLACE(comments.value_text, '\r\n', '\n'),
                ',', '\n'),
              '.', '\n'),
              '\n', 1)
          ) AS remarks,
CASE 
  WHEN regimen_switch.has_regimen_switch = TRUE 
       AND hiv.first_substitution_regimen IS NOT NULL
  THEN TRUE ELSE FALSE 
END AS first_substitution_regimen,
CASE 
  WHEN regimen_switch.has_regimen_switch = TRUE 
       AND hiv.second_substitution_regimen IS NOT NULL
  THEN TRUE ELSE FALSE 
END AS second_substitution_regimen,
CASE 
  WHEN regimen_switch.has_regimen_switch = TRUE 
       AND hiv.third_substitution_regimen IS NOT NULL
  THEN TRUE ELSE FALSE 
END AS third_substitution_regimen,
  hiv.first_substitution_date,
  switch_reason.reason,
  hiv.second_substitution_date,
  switch_reason.reason,
  hiv.third_substitution_date,
  switch_reason.reason,
  labs.vl_1_date,
  labs.vl_1,
  labs.vl_2_date,
  labs.vl_2,
  labs.vl_3_date,
  labs.vl_3,
  CASE
		WHEN o.value_coded = 1594 THEN 1
		WHEN o.value_coded = 5240 THEN 2
		WHEN o.value_coded = 1593 THEN 3
		WHEN o.value_coded = 6102 THEN 4
		WHEN o.value_coded = 9302 THEN 5
  END as outcomes,
  MAX(o.obs_datetime) as outcome_date

FROM (
  SELECT *
  FROM (
    SELECT 
      e.*, 
      ROW_NUMBER() OVER (PARTITION BY e.patient_id ORDER BY e.encounter_datetime) AS rn
    FROM amrs.encounter e
    JOIN amrs.location l ON e.location_id = l.location_id
    WHERE e.encounter_type IN (283,284,285,288)
      AND e.voided = 0
      AND l.uuid IN (${params.locationUuids})
        AND e.encounter_datetime BETWEEN ('${params.startDate}') AND ('${params.endDate}')
  ) AS ranked_encounters
  WHERE rn = 1
) AS e
JOIN amrs.person p ON e.patient_id = p.person_id
JOIN amrs.person_name pn ON pn.person_id = p.person_id AND pn.preferred = 1

 JOIN (
    SELECT f1.*
    FROM etl.flat_hiv_summary_v15b f1
    JOIN (
        SELECT person_id, MAX(encounter_datetime) AS max_date
        FROM etl.flat_hiv_summary_v15b
        WHERE is_clinical_encounter = 1
        GROUP BY person_id
    ) f2 ON f1.person_id = f2.person_id AND f1.encounter_datetime = f2.max_date
    WHERE f1.is_clinical_encounter = 1
) fhs ON fhs.person_id = pn.person_id

JOIN amrs.obs o on o.person_id = pn.person_id and o.concept_id = 1596

LEFT JOIN (
  SELECT patient_id, identifier
  FROM amrs.patient_identifier
  WHERE 
  identifier_type in (28, 29) 
  AND voided = 0
  GROUP BY patient_id
) AS pi_id ON pi_id.patient_id = p.person_id

LEFT JOIN (
  SELECT
    o.encounter_id,
    MAX(CASE WHEN o.concept_id = 11032 THEN 
        CASE 
            WHEN o.value_coded = 1065 THEN 'YES'
            WHEN o.value_coded = 1066 THEN 'NO'
            ELSE o.value_coded 
        END 
    END) AS otz_orientation,
    MAX(CASE WHEN o.concept_id = 11037 THEN 
        CASE 
            WHEN o.value_coded = 1065 THEN 'YES'
            WHEN o.value_coded = 1066 THEN 'NO'
            ELSE o.value_coded 
        END 
    END) AS otz_treatment_literacy,
    MAX(CASE WHEN o.concept_id = 11033 THEN 
        CASE 
            WHEN o.value_coded = 1065 THEN 'YES'
            WHEN o.value_coded = 1066 THEN 'NO'
            ELSE o.value_coded 
        END 
    END) AS otz_participation,
    MAX(CASE WHEN o.concept_id = 12300 THEN 
        CASE 
            WHEN o.value_coded = 1065 THEN 'YES'
            WHEN o.value_coded = 1066 THEN 'NO'
            ELSE o.value_coded 
        END 
    END) AS otz_mentorship,
    MAX(CASE WHEN o.concept_id = 11034 THEN 
        CASE 
            WHEN o.value_coded = 1065 THEN 'YES'
            WHEN o.value_coded = 1066 THEN 'NO'
            ELSE o.value_coded 
        END 
    END) AS otz_leadership,
    MAX(CASE WHEN o.concept_id = 12272 THEN 
        CASE 
            WHEN o.value_coded = 1065 THEN 'YES'
            WHEN o.value_coded = 1066 THEN 'NO'
            ELSE o.value_coded 
        END 
    END) AS otz_edu_prevention,
    MAX(CASE WHEN o.concept_id = 11035 THEN 
        CASE 
            WHEN o.value_coded = 1065 THEN 'YES'
            WHEN o.value_coded = 1066 THEN 'NO'
            ELSE o.value_coded 
        END 
    END) AS otz_future_decision,
    MAX(CASE WHEN o.concept_id = 9302 THEN 
        CASE 
            WHEN o.value_coded = 1065 THEN 'YES'
            WHEN o.value_coded = 1066 THEN 'NO'
            WHEN o.value_coded = 7084 THEN 'IN PROGRESS'
            ELSE o.value_coded 
        END 
    END) AS otz_transition,
    MAX(CASE WHEN o.concept_id = 7222 THEN o.value_text END) AS otz_remarks
  FROM amrs.obs o
  WHERE o.voided = 0
  GROUP BY o.encounter_id
) AS obs_otz ON obs_otz.encounter_id = e.encounter_id

INNER JOIN (
    SELECT o1.person_id,
           o1.concept_id,
           CASE
               WHEN o1.value_coded = 843 THEN 'REGIMEN FAILURE' 
               WHEN o1.value_coded = 102 THEN 'TOXICITY DRUG' 
               WHEN o1.value_coded = 1434 THEN 'POOR ADHERENCE' 
               WHEN o1.value_coded = 1504 THEN 'PATIENT REFUSAL' 
               WHEN o1.value_coded = 7391 THEN 'RESISTANT' 
               WHEN o1.value_coded = 1664 THEN 'SIDE EFFECTS' 
               WHEN o1.value_coded = 989 THEN 'PATIENT AGE' 
               WHEN o1.value_coded = 1930 THEN 'NEW MEDICATION' 
               WHEN o1.value_coded = 10395 THEN 'OPTIMIZATION' 
               WHEN o1.value_coded = 58 THEN 'TUBERCULOSIS' 
               WHEN o1.value_coded = 1259 THEN 'CHANGE REGIMEN'
               WHEN o1.value_coded = 7065 THEN 'PILL BURDEN' 
               WHEN o1.value_coded = 5622 THEN 'NA' 
               WHEN o1.value_coded = 44 THEN 'PREGNANCY' 
               WHEN o1.value_coded = 7061 THEN 'PREGNANCY RISK' 
           END AS reason,
           o1.obs_datetime
    FROM amrs.obs o1
    JOIN (
        SELECT person_id, MAX(obs_datetime) AS max_date
        FROM amrs.obs
        WHERE concept_id = 1252
        GROUP BY person_id
    ) o2
      ON o1.person_id = o2.person_id
     AND o1.obs_datetime = o2.max_date
    WHERE o1.concept_id = 1252
) switch_reason 
  ON switch_reason.person_id = pn.person_id

INNER JOIN (
    SELECT o1.person_id, o1.concept_id, o1.value_text, o1.obs_datetime
    FROM amrs.obs o1
    JOIN (
        SELECT person_id, MAX(obs_datetime) AS max_date
        FROM amrs.obs
        WHERE concept_id = 7222
        GROUP BY person_id
    ) o2
      ON o1.person_id = o2.person_id 
     AND o1.obs_datetime = o2.max_date
    WHERE o1.concept_id = 7222
) comments ON comments.person_id = pn.person_id

LEFT JOIN (
    SELECT person_id,
           CASE 
             WHEN COUNT(*) > 0 THEN TRUE 
             ELSE FALSE 
           END AS has_regimen_switch
    FROM (
        SELECT person_id, MAX(obs_datetime) AS max_date
        FROM amrs.obs
        WHERE concept_id = 1255 
          AND value_coded IN (1259, 1849, 1258)
        GROUP BY person_id
    ) latest
    GROUP BY person_id
) regimen_switch 
  ON regimen_switch.person_id = pn.person_id

LEFT JOIN (
  SELECT 
    person_id,
    MAX(CASE WHEN value_coded = 6693 THEN 1 END) AS first_substitution_regimen,
    MAX(CASE WHEN value_coded = 6693 THEN obs_datetime END) AS first_substitution_date,
    'N/A' AS first_substitution_reason,
    MAX(CASE WHEN value_coded = 6694 THEN 2 END) AS second_substitution_regimen,
    MAX(CASE WHEN value_coded = 6692 THEN obs_datetime END) AS second_substitution_date,
    'N/A' AS second_substitution_reason,
    MAX(CASE WHEN value_coded = 6695 THEN 3 END) AS third_substitution_regimen,
    MAX(CASE WHEN value_coded = 6695 THEN obs_datetime END) AS third_substitution_date,
    'N/A' AS third_substitution_reason
  FROM amrs.obs
  WHERE concept_id = 6976
  GROUP BY person_id
) AS hiv ON hiv.person_id = e.patient_id

INNER JOIN (
  SELECT 
    person_id,
    MAX(CASE WHEN rn = 1 THEN test_datetime END) AS vl_1_date,
    MAX(CASE WHEN rn = 1 THEN hiv_viral_load END) AS vl_1,
    MAX(CASE WHEN rn = 2 THEN test_datetime END) AS vl_2_date,
    MAX(CASE WHEN rn = 2 THEN hiv_viral_load END) AS vl_2,
    MAX(CASE WHEN rn = 3 THEN test_datetime END) AS vl_3_date,
    MAX(CASE WHEN rn = 3 THEN hiv_viral_load END) AS vl_3,
    MAX(CASE WHEN rn = 4 THEN test_datetime END) AS vl_4_date,
    MAX(CASE WHEN rn = 4 THEN hiv_viral_load END) AS vl_4,
    MAX(CASE WHEN rn = 5 THEN test_datetime END) AS vl_5_date,
    MAX(CASE WHEN rn = 5 THEN hiv_viral_load END) AS vl_5,
    MAX(CASE WHEN rn = 6 THEN test_datetime END) AS vl_6_date,
    MAX(CASE WHEN rn = 6 THEN hiv_viral_load END) AS vl_6,
	  MAX(CASE WHEN rn = 7 THEN test_datetime END) AS vl_7_date,
    MAX(CASE WHEN rn = 7 THEN hiv_viral_load END) AS vl_7,
    MAX(CASE WHEN rn = 8 THEN test_datetime END) AS vl_8_date,
    MAX(CASE WHEN rn = 8 THEN hiv_viral_load END) AS vl_8,
    MAX(CASE WHEN rn = 9 THEN test_datetime END) AS vl_9_date,
    MAX(CASE WHEN rn = 9 THEN hiv_viral_load END) AS vl_9,
    MAX(CASE WHEN rn = 10 THEN test_datetime END) AS vl_10_date,
    MAX(CASE WHEN rn = 10 THEN hiv_viral_load END) AS vl_10
  FROM (
    SELECT 
      person_id, 
      test_datetime, 
      hiv_viral_load,
      ROW_NUMBER() OVER (PARTITION BY person_id ORDER BY test_datetime desc) AS rn
    FROM etl.flat_labs_and_imaging
    WHERE hiv_viral_load IS NOT NULL
  ) AS ranked_vls
  GROUP BY person_id
) AS labs ON labs.person_id = e.patient_id AND e.encounter_type in (283,284,285,288)
 group by e.encounter_id

ORDER BY e.encounter_datetime desc, fhs.encounter_datetime desc;
          `;
      queryParts = {
        sql: sql
      };
      return db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result.result);
      });
    });
  }
};

module.exports = defs;
