import CdcCovidProvider from "./CdcCovidProvider";
import AcsPopulationProvider from "./AcsPopulationProvider";
import { Breakdowns, BreakdownVar } from "../query/Breakdowns";
import { MetricQuery, MetricQueryResponse } from "../query/MetricQuery";
import { Fips } from "../utils/Fips";
import { FakeDatasetMetadataMap } from "../config/FakeDatasetMetadata";
import {
  autoInitGlobals,
  getDataFetcher,
  resetCacheDebug,
} from "../../utils/globals";
import FakeDataFetcher from "../../testing/FakeDataFetcher";
import { FipsSpec, NC, AL, DURHAM, CHATAM, USA } from "./TestUtils";
import {
  WHITE_NH,
  ALL,
  FORTY_TO_FORTY_NINE,
  FEMALE,
  MALE,
  UNKNOWN,
} from "../utils/Constants";
import { MetricId } from "../config/MetricConfig";
import { excludeAll } from "../query/BreakdownFilter";

function covidAndAcsRows(
  fips: FipsSpec,
  breakdownColumnName: string,
  breakdownValue: string,
  cases: number | null,
  deaths: number | null,
  hosp: number | null,
  population: number
) {
  return [
    {
      state_fips: fips.code,
      state_name: fips.name,
      cases: cases,
      death_y: deaths,
      hosp_y: hosp,
      [breakdownColumnName]: breakdownValue,
      population: population,
    },
    {
      state_fips: fips.code,
      state_name: fips.name,
      [breakdownColumnName]: breakdownValue,
      population: population,
    },
  ];
}

function covidAndCountyAcsRows(
  fips: FipsSpec,
  breakdownColumnName: string,
  breakdownValue: string,
  cases: number | null,
  deaths: number | null,
  hosp: number | null,
  population: number
) {
  return [
    {
      county_fips: fips.code,
      county_name: fips.name,
      cases: cases,
      death_y: deaths,
      hosp_y: hosp,
      [breakdownColumnName]: breakdownValue,
      population: population,
    },
    {
      county_fips: fips.code,
      county_name: fips.name,
      [breakdownColumnName]: breakdownValue,
      population: population,
    },
  ];
}

const METRIC_IDS: MetricId[] = [
  "covid_cases",
  "covid_cases_per_100k",
  "covid_cases_share",
  "covid_cases_share_of_known",
  "covid_cases_reporting_population",
  "covid_cases_reporting_population_pct",
];

export async function evaluateWithAndWithoutAll(
  covidDatasetId: string,
  rawCovidData: any[],
  acsDatasetId: string,
  rawAcsData: any[],
  baseBreakdown: Breakdowns,
  breakdownVar: BreakdownVar,
  rowsExcludingAll: any[],
  rowsIncludingAll: any[]
) {
  const acsProvider = new AcsPopulationProvider();
  const cdcCovidProvider = new CdcCovidProvider(acsProvider);

  dataFetcher.setFakeDatasetLoaded(covidDatasetId, rawCovidData);
  dataFetcher.setFakeDatasetLoaded(acsDatasetId, rawAcsData);

  // Evaluate the response with requesting "All" field
  const responseIncludingAll = await cdcCovidProvider.getData(
    new MetricQuery(METRIC_IDS, baseBreakdown.addBreakdown(breakdownVar))
  );
  expect(responseIncludingAll).toEqual(
    new MetricQueryResponse(rowsIncludingAll, [covidDatasetId, acsDatasetId])
  );

  // Evaluate the response without requesting "All" field
  const responseExcludingAll = await cdcCovidProvider.getData(
    new MetricQuery(
      METRIC_IDS,
      baseBreakdown.addBreakdown(breakdownVar, excludeAll())
    )
  );
  expect(responseExcludingAll).toEqual(
    new MetricQueryResponse(rowsExcludingAll, [covidDatasetId, acsDatasetId])
  );
}

autoInitGlobals();
const dataFetcher = getDataFetcher() as FakeDataFetcher;

describe("cdcCovidProvider", () => {
  beforeEach(() => {
    resetCacheDebug();
    dataFetcher.resetState();
    dataFetcher.setFakeMetadataLoaded(FakeDatasetMetadataMap);
  });

  test("County and Race Breakdown", async () => {
    // Raw rows with cases, hospitalizations, death, population
    const [CHATAM_WHITE_ROW, CHATAM_ACS_WHITE_ROW] = covidAndCountyAcsRows(
      /*fips=*/ CHATAM,
      /*breakdownColumnName=*/ "race_and_ethnicity",
      /*breakdownValue=*/ WHITE_NH,
      /*cases=*/ 10,
      /*deaths=*/ 1,
      /*hosp=*/ 5,
      /*population=*/ 2000
    );
    const [CHATAM_ALL_ROW, CHATAM_ACS_ALL_ROW] = covidAndCountyAcsRows(
      /*fips=*/ CHATAM,
      /*breakdownColumnName=*/ "race_and_ethnicity",
      /*breakdownValue=*/ ALL,
      /*cases=*/ 200,
      /*deaths=*/ 500,
      /*hosp=*/ 1000,
      /*population=*/ 100000
    );
    const [DURHAM_WHITE_ROW, DURHAM_ACS_WHITE_ROW] = covidAndCountyAcsRows(
      /*fips=*/ DURHAM,
      /*breakdownColumnName=*/ "race_and_ethnicity",
      /*breakdownValue=*/ WHITE_NH,
      /*cases=*/ 10,
      /*deaths=*/ 1,
      /*hosp=*/ 5,
      /*population=*/ 2000
    );
    const [DURHAM_ALL_ROW, DURHAM_ACS_ALL_ROW] = covidAndCountyAcsRows(
      /*fips=*/ DURHAM,
      /*breakdownColumnName=*/ "race_and_ethnicity",
      /*breakdownValue=*/ ALL,
      /*cases=*/ 10,
      /*deaths=*/ 1,
      /*hosp=*/ 5,
      /*population=*/ 2000
    );

    const rawCovidData = [
      CHATAM_WHITE_ROW,
      CHATAM_ALL_ROW,
      DURHAM_WHITE_ROW,
      DURHAM_ALL_ROW,
    ];
    const rawAcsData = [
      CHATAM_ACS_WHITE_ROW,
      CHATAM_ACS_ALL_ROW,
      DURHAM_ACS_ALL_ROW,
      DURHAM_ACS_WHITE_ROW,
    ];

    const CHATAM_WHITE_FINAL_ROW = {
      fips: CHATAM.code,
      fips_name: CHATAM.name,
      race_and_ethnicity: WHITE_NH,
      covid_cases: 10,
      covid_cases_per_100k: 500,
      covid_cases_share: 5,
      covid_cases_share_of_known: 100,
      covid_cases_reporting_population: 2000,
      covid_cases_reporting_population_pct: 2,
    };
    const CHATAM_ALL_FINAL_ROW = {
      fips: CHATAM.code,
      fips_name: CHATAM.name,
      race_and_ethnicity: ALL,
      covid_cases: 200,
      covid_cases_per_100k: 200,
      covid_cases_share: 100,
      covid_cases_share_of_known: 100,
      covid_cases_reporting_population: 100000,
      covid_cases_reporting_population_pct: 100,
    };

    await evaluateWithAndWithoutAll(
      "cdc_restricted_data-by_race_county",
      rawCovidData,
      "acs_population-by_race_county_std",
      rawAcsData,
      Breakdowns.forFips(new Fips(CHATAM.code)),
      "race_and_ethnicity",
      [CHATAM_WHITE_FINAL_ROW],
      [CHATAM_ALL_FINAL_ROW, CHATAM_WHITE_FINAL_ROW]
    );
  });

  test("State and Age Breakdown", async () => {
    const [AL_FORTY_ROW, AL_ACS_FORTY_ROW] = covidAndAcsRows(
      /*fips=*/ AL,
      /*breakdownColumnName=*/ "age",
      /*breakdownValue=*/ FORTY_TO_FORTY_NINE,
      /*cases=*/ 10,
      /*hosp=*/ 1,
      /*death=*/ 5,
      /*population=*/ 2000
    );
    const [AL_ALL_ROW, AL_ACS_ALL_ROW] = covidAndAcsRows(
      /*fips=*/ AL,
      /*breakdownColumnName=*/ "age",
      /*breakdownValue=*/ ALL,
      /*cases=*/ 10,
      /*hosp=*/ 1,
      /*death=*/ 5,
      /*population=*/ 2000
    );
    const [NC_FORTY_ROW, NC_ACS_FORTY_ROW] = covidAndAcsRows(
      /*fips=*/ NC,
      /*breakdownColumnName=*/ "age",
      /*breakdownValue=*/ FORTY_TO_FORTY_NINE,
      /*cases=*/ 10,
      /*hosp=*/ 1,
      /*death=*/ 5,
      /*population=*/ 2000
    );
    const [NC_ALL_ROW, NC_ACS_ALL_ROW] = covidAndAcsRows(
      /*fips=*/ NC,
      /*breakdownColumnName=*/ "age",
      /*breakdownValue=*/ ALL,
      /*cases=*/ 200,
      /*hosp=*/ 500,
      /*death=*/ 1000,
      /*population=*/ 100000
    );

    const rawCovidData = [NC_FORTY_ROW, NC_ALL_ROW, AL_FORTY_ROW, AL_ALL_ROW];
    const rawAcsData = [
      NC_ACS_FORTY_ROW,
      NC_ACS_ALL_ROW,
      AL_ACS_ALL_ROW,
      AL_ACS_FORTY_ROW,
    ];

    const NC_FORTY_FINAL_ROW = {
      fips: NC.code,
      fips_name: NC.name,
      age: FORTY_TO_FORTY_NINE,
      covid_cases: 10,
      covid_cases_per_100k: 500,
      covid_cases_share: 5,
      covid_cases_share_of_known: 100,
      covid_cases_reporting_population: 2000,
      covid_cases_reporting_population_pct: 2,
    };
    const NC_ALL_FINAL_ROW = {
      fips: NC.code,
      fips_name: NC.name,
      age: ALL,
      covid_cases: 200,
      covid_cases_per_100k: 200,
      covid_cases_share: 100,
      covid_cases_share_of_known: 100,
      covid_cases_reporting_population: 100000,
      covid_cases_reporting_population_pct: 100,
    };

    await evaluateWithAndWithoutAll(
      "cdc_restricted_data-by_age_state",
      rawCovidData,
      "acs_population-by_age_state",
      rawAcsData,
      Breakdowns.forFips(new Fips(NC.code)),
      "age",
      [NC_FORTY_FINAL_ROW],
      [NC_ALL_FINAL_ROW, NC_FORTY_FINAL_ROW]
    );
  });

  test("National and Sex Breakdown", async () => {
    const [NC_ALL_ROW, NC_ACS_ALL_ROW] = covidAndAcsRows(
      /*fips=*/ NC,
      /*breakdownColumnName=*/ "sex",
      /*breakdownValue=*/ ALL,
      /*cases=*/ 200,
      /*death=*/ 500,
      /*hosp=*/ 1000,
      /*population=*/ 100000
    );
    const [AL_ALL_ROW, AL_ACS_ALL_ROW] = covidAndAcsRows(
      /*fips=*/ AL,
      /*breakdownColumnName=*/ "sex",
      /*breakdownValue=*/ ALL,
      /*cases=*/ 100,
      /*death=*/ 200,
      /*hosp=*/ 1000,
      /*population=*/ 80000
    );
    const [NC_FEMALE_ROW, NC_ACS_FEMALE_ROW] = covidAndAcsRows(
      /*fips=*/ NC,
      /*breakdownColumnName=*/ "sex",
      /*breakdownValue=*/ FEMALE,
      /*cases=*/ 240,
      /*death=*/ 80,
      /*hosp=*/ 34,
      /*population=*/ 50000
    );
    const [AL_FEMALE_ROW, AL_ACS_FEMALE_ROW] = covidAndAcsRows(
      /*fips=*/ AL,
      /*breakdownColumnName=*/ "sex",
      /*breakdownValue=*/ FEMALE,
      /*cases=*/ 730,
      /*death=*/ 250,
      /*hosp=*/ 45,
      /*population=*/ 60000
    );

    const rawCovidData = [NC_FEMALE_ROW, NC_ALL_ROW, AL_FEMALE_ROW, AL_ALL_ROW];
    const rawAcsData = [
      NC_ACS_FEMALE_ROW,
      NC_ACS_ALL_ROW,
      AL_ACS_ALL_ROW,
      AL_ACS_FEMALE_ROW,
    ];

    const FINAL_FEMALE_ROW = {
      fips: USA.code,
      fips_name: USA.name,
      sex: FEMALE,
      covid_cases: 970,
      covid_cases_per_100k: 882,
      covid_cases_share: 323.3,
      covid_cases_share_of_known: 100,
      covid_cases_reporting_population: 110000,
      covid_cases_reporting_population_pct: 61.1,
    };
    const FINAL_ALL_ROW = {
      fips: USA.code,
      fips_name: USA.name,
      sex: ALL,
      covid_cases: 300,
      covid_cases_per_100k: 167,
      covid_cases_share: 100,
      covid_cases_share_of_known: 100,
      covid_cases_reporting_population: 180000,
      covid_cases_reporting_population_pct: 100,
    };

    await evaluateWithAndWithoutAll(
      "cdc_restricted_data-by_sex_state",
      rawCovidData,
      "acs_population-by_sex_state",
      rawAcsData,
      Breakdowns.national(),
      "sex",
      [FINAL_FEMALE_ROW],
      [FINAL_ALL_ROW, FINAL_FEMALE_ROW]
    );
  });

  test("Calculates share of known with unknown present", async () => {
    const [NC_UNKNOWN_ROW, UNUSED_NC_UNKNOWN] = covidAndAcsRows(
      /*fips=*/ NC,
      /*breakdownColumnName=*/ "sex",
      /*breakdownValue=*/ UNKNOWN,
      /*cases=*/ 100,
      /*death=*/ 100,
      /*hosp=*/ 100,
      /*population=*/ 1
    );
    const [NC_ALL_ROW, NC_ACS_ALL_ROW] = covidAndAcsRows(
      /*fips=*/ NC,
      /*breakdownColumnName=*/ "sex",
      /*breakdownValue=*/ ALL,
      /*cases=*/ 300,
      /*death=*/ 600,
      /*hosp=*/ 1100,
      /*population=*/ 100000
    );
    const [AL_ALL_ROW, AL_ACS_ALL_ROW] = covidAndAcsRows(
      /*fips=*/ AL,
      /*breakdownColumnName=*/ "sex",
      /*breakdownValue=*/ ALL,
      /*cases=*/ 100,
      /*death=*/ 200,
      /*hosp=*/ 1000,
      /*population=*/ 80000
    );
    const [NC_FEMALE_ROW, NC_ACS_FEMALE_ROW] = covidAndAcsRows(
      /*fips=*/ NC,
      /*breakdownColumnName=*/ "sex",
      /*breakdownValue=*/ FEMALE,
      /*cases=*/ 240,
      /*death=*/ 80,
      /*hosp=*/ 34,
      /*population=*/ 50000
    );
    const [AL_MALE_ROW, AL_ACS_MALE_ROW] = covidAndAcsRows(
      /*fips=*/ AL,
      /*breakdownColumnName=*/ "sex",
      /*breakdownValue=*/ MALE,
      /*cases=*/ 730,
      /*death=*/ 250,
      /*hosp=*/ 45,
      /*population=*/ 60000
    );

    const rawCovidData = [
      NC_UNKNOWN_ROW,
      NC_FEMALE_ROW,
      NC_ALL_ROW,
      AL_MALE_ROW,
      AL_ALL_ROW,
    ];
    const rawAcsData = [
      NC_ACS_FEMALE_ROW,
      NC_ACS_ALL_ROW,
      AL_ACS_ALL_ROW,
      AL_ACS_MALE_ROW,
    ];

    const FINAL_MALE_ROW = {
      fips: USA.code,
      fips_name: USA.name,
      sex: MALE,
      covid_cases: 730,
      covid_cases_per_100k: 1217,
      covid_cases_share: 182.5,
      covid_cases_share_of_known: 75.3,
      covid_cases_reporting_population: 60000,
      covid_cases_reporting_population_pct: 33.3,
    };
    const FINAL_FEMALE_ROW = {
      fips: USA.code,
      fips_name: USA.name,
      sex: FEMALE,
      covid_cases: 240,
      covid_cases_per_100k: 480,
      covid_cases_share: 60,
      covid_cases_share_of_known: 24.7,
      covid_cases_reporting_population: 50000,
      covid_cases_reporting_population_pct: 27.8,
    };
    const FINAL_ALL_ROW = {
      fips: USA.code,
      fips_name: USA.name,
      sex: ALL,
      covid_cases: 400,
      covid_cases_per_100k: 222,
      covid_cases_share: 100,
      covid_cases_share_of_known: 100,
      covid_cases_reporting_population: 180000,
      covid_cases_reporting_population_pct: 100,
    };
    // Note that covid_cases_share_of_known is not present.
    const FINAL_UNKNOWN_ROW = {
      fips: USA.code,
      fips_name: USA.name,
      sex: UNKNOWN,
      covid_cases: 100,
      covid_cases_per_100k: 10000000,
      covid_cases_share: 25,
      covid_cases_reporting_population: 1,
      covid_cases_reporting_population_pct: undefined,
    };

    await evaluateWithAndWithoutAll(
      "cdc_restricted_data-by_sex_state",
      rawCovidData,
      "acs_population-by_sex_state",
      rawAcsData,
      Breakdowns.national(),
      "sex",
      [FINAL_FEMALE_ROW, FINAL_MALE_ROW, FINAL_UNKNOWN_ROW],
      [FINAL_ALL_ROW, FINAL_FEMALE_ROW, FINAL_MALE_ROW, FINAL_UNKNOWN_ROW]
    );
  });
});
