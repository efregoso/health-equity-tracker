import { Breakdowns, ALL_RACES_DISPLAY_NAME } from "../Breakdowns";
import { Dataset } from "../DatasetTypes";
import { per100k } from "../datasetutils";
import { USA_FIPS, USA_DISPLAY_NAME, Fips } from "../../utils/madlib/Fips";
import VariableProvider from "./VariableProvider";
import { MetricQueryResponse } from "../MetricQuery";

class BrfssProvider extends VariableProvider {
  constructor() {
    super(
      "brfss_provider",
      ["diabetes_count", "diabetes_per_100k", "copd_count", "copd_per_100k"],
      ["brfss"]
    );
  }

  getDataInternal(
    datasets: Record<string, Dataset>,
    breakdowns: Breakdowns
  ): MetricQueryResponse {
    const brfss = datasets["brfss"];
    let df = brfss.toDataFrame();

    if (breakdowns.geography === "national") {
      df = df
        .pivot(breakdowns.demographicBreakdowns.race.columnName, {
          state_fips: (series) => USA_FIPS,
          state_name: (series) => USA_DISPLAY_NAME,
          diabetes_count: (series) => series.sum(),
          diabetes_no: (series) => series.sum(),
          copd_count: (series) => series.sum(),
          copd_no: (series) => series.sum(),
        })
        .resetIndex();
    }

    if (breakdowns.filterFips !== undefined) {
      const fips = breakdowns.filterFips as Fips;
      df = df.where((row) => row.state_fips === fips.code);
    }

    if (!breakdowns.demographicBreakdowns.race.enabled) {
      df = df.pivot(["state_name", "state_fips"], {
        race: (series) => ALL_RACES_DISPLAY_NAME,
        diabetes_count: (series) => series.sum(),
        diabetes_no: (series) => series.sum(),
        copd_count: (series) => series.sum(),
        copd_no: (series) => series.sum(),
      });
    }

    if (
      breakdowns.demographicBreakdowns.race.enabled &&
      breakdowns.demographicBreakdowns.race.includeTotal
    ) {
      const total = df
        .pivot(["state_fips", "state_name"], {
          diabetes_count: (series) => series.sum(),
          diabetes_no: (series) => series.sum(),
          copd_count: (series) => series.sum(),
          copd_no: (series) => series.sum(),
          race_and_ethnicity: (series) => "Total",
        })
        .resetIndex();
      df = df.concat(total).resetIndex();
    }

    df = df.generateSeries({
      diabetes_per_100k: (row) =>
        per100k(row.diabetes_count, row.diabetes_count + row.diabetes_no),
      copd_per_100k: (row) =>
        per100k(row.copd_count, row.copd_count + row.copd_no),
    });

    return new MetricQueryResponse(df.toArray(), ["brfss"]);
  }

  allowsBreakdowns(breakdowns: Breakdowns): boolean {
    const validDemographicBreakdownRequest =
      breakdowns.demographicBreakdownCount() === 0 || breakdowns.hasOnlyRace();

    return (
      !breakdowns.time &&
      (breakdowns.geography === "state" ||
        breakdowns.geography === "national") &&
      validDemographicBreakdownRequest
    );
  }
}

export default BrfssProvider;
