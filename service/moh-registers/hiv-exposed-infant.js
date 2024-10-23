const db = require('../../etl-db');

const fetchHEISummary = (locationUuids) => {
  return new Promise((resolve, reject) => {
    const uuids = Array.isArray(locationUuids)
      ? locationUuids
      : locationUuids.split(',').map((uuid) => uuid.trim());

    const locationCondition = `l.uuid IN (${uuids
      .map((uuid) => `'${uuid}'`)
      .join(',')})`;

    const sql = `
    SELECT 
        fhi.person_id, 
        fhi.date_enrolled, 
        fhi.birth_date as 'dob', 
        fhi.gender, 
        CONCAT(p.given_name, ' ', p.middle_name, ' ', p.family_name) AS Infant_name, 
        l.name AS Location, 
        pi1.identifier AS Birth_Certificate_number, 
        pi2.identifier AS AMRS_Number, 
        pi3.identifier AS HEI_ID, 
        pi4.identifier AS NUPI, 
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
        CASE 
            WHEN fhi.antibody_screen_2 = 664 THEN 'N' 
            WHEN fhi.antibody_screen_2 = 703 THEN 'P' 
        END AS results_second_antibody, 
        CASE 
            WHEN fhi.infant_feeding_method IN (5, 15, 6, 9) THEN 'BF' 
            WHEN fhi.infant_feeding_method IN (17, 8, 3) THEN 'NBF' 
        END AS infant_feeding, 
        CASE 
            WHEN fhi.hei_outcome = 1 THEN 'Infected' 
            WHEN fhi.hei_outcome = 2 THEN 'Uninfected' 
            WHEN fhi.hei_outcome = 3 THEN 'Lost to Follow' 
            WHEN fhi.hei_outcome = 4 THEN 'Transfer Out' 
            WHEN fhi.hei_outcome = 5 THEN 'Dead' 
            WHEN fhi.hei_outcome = 6 THEN 'f' 
        END AS hei_outcome 
    FROM 
        etl.flat_hei_summary fhi 
        LEFT JOIN amrs.person_name p ON p.person_id = fhi.person_id 
        LEFT JOIN amrs.location l ON l.location_id = fhi.location_id 
        LEFT JOIN amrs.patient_identifier pi1 ON pi1.patient_id = fhi.person_id AND pi1.identifier_type = 46 
        LEFT JOIN amrs.patient_identifier pi2 ON pi2.patient_id = fhi.person_id AND pi2.identifier_type = 8 
        LEFT JOIN amrs.patient_identifier pi3 ON pi3.patient_id = fhi.person_id AND pi3.identifier_type = 38 
        LEFT JOIN amrs.patient_identifier pi4 ON pi4.patient_id = fhi.person_id AND pi4.identifier_type = 45 
        LEFT JOIN amrs.person_attribute pa ON pa.person_id = fhi.person_id AND pa.person_attribute_type_id = 12 
        LEFT JOIN amrs.person_attribute pa2 ON pa2.person_id = fhi.person_id AND pa2.person_attribute_type_id = 10 
    WHERE 
        fhi.birth_date >= DATE_SUB(CURRENT_DATE, INTERVAL 2 YEAR)
         AND ${locationCondition}
        -- AND fhi.location_id IN (23) 
    GROUP BY 
        fhi.person_id;

    `;

    const queryParts = {
      sql: sql
    };
    db.queryServer(queryParts, function (result) {
      result.sql = sql;
      resolve(result);
    });
  });
};

export const getHivExposedInfantData = (locationUuids) => {
  return new Promise((resolve, reject) => {
    fetchHEISummary(locationUuids)
      .then((results) => {
        const defaulterTracingData = {
          result: {}
        };
        if (results.size) {
          defaulterTracingData.result = results.result || [];
        }
        resolve(defaulterTracingData);
      })
      .catch((error) => {
        reject(error);
      });
  });
};
