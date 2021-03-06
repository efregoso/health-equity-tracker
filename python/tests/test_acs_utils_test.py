import unittest

# pylint: disable=no-name-in-module
from ingestion.acs_utils import (
    MetadataKey,
    parseMetadata,
    trimMetadata,
)

# pylint: disable=no-name-in-module
from ingestion.constants import (
    HealthInsurancePopulation,
    Sex,
    PovertyPopulation,
)

_fake_metadata_to_trim = {
    "variables": {
        "B00001_001E": {
            "label": "Estimate!!Total:!!Male:!!25 to 29 years",
            "concept": "SEX BY AGE",
            "group": "B00001",
        },
        "B00001_001EA": {
            "label": "Estimate!!Total:!!Male:!!30 to 34 years",
            "concept": "SEX BY AGE",
            "group": "B00001",
        },
        "B00002_001E": {
            "label": "Estimate!!Total:!!Female:!!25 to 29 years",
            "concept": "SEX BY AGE",
            "group": "B00002",
        },
        "B00002_001EA": {
            "label": "Estimate!!Total:!!Female:!!30 to 34 years",
            "concept": "SEX BY AGE",
            "group": "B00002",
        },
    }
}


class AcsUtilsTest(unittest.TestCase):
    def testing_trim_metadata_removed_non_estimate_and_non_included_groups(self):
        result = trimMetadata(_fake_metadata_to_trim["variables"], ["B00002"])
        expected = {
            "B00002_001E": {
                "label": "Estimate!!Total:!!Female:!!25 to 29 years",
                "concept": "SEX BY AGE",
                "group": "B00002",
            }
        }
        self.assertEqual(result, expected)

    def testing_initializer(self):
        meta_in = {
            "B00001_001E": {
                "label": "Estimate",
                "concept": "SEX BY AGE",
                "group": "B00001",
            }
        }

        result = parseMetadata(
            meta_in, [], lambda grp: {"initialized": grp == "B00001_001E"}
        )
        expected = {"B00001_001E": {"initialized": True}}
        self.assertEqual(result, expected)

    def testing_age_under(self):
        meta_in = {
            "B00001_001E": {
                "label": "Estimate!! Under 5 years",
                "concept": "SEX BY AGE",
                "group": "B00001",
            }
        }

        result = parseMetadata(meta_in, [])
        expected = {"B00001_001E": {MetadataKey.AGE: "0-4"}}
        self.assertEqual(result, expected)

    def testing_age_range(self):
        meta_in = {
            "B00001_001E": {
                "label": "Estimate!! 5 to 10 years",
                "concept": "SEX BY AGE",
                "group": "B00001",
            }
        }

        result = parseMetadata(meta_in, [])
        expected = {"B00001_001E": {MetadataKey.AGE: "5-10"}}
        self.assertEqual(result, expected)

    def testing_age_over(self):
        meta_in = {
            "B00001_001E": {
                "label": "Estimate!! 10 years and over",
                "concept": "SEX BY AGE",
                "group": "B00001",
            }
        }

        result = parseMetadata(meta_in, [])
        expected = {"B00001_001E": {MetadataKey.AGE: "10+"}}
        self.assertEqual(result, expected)

    def testing_income_less_than(self):
        meta_in = {
            "B00001_001E": {
                "label": "Estimate!! Less Than $20,000",
                "concept": "SEX BY AGE",
                "group": "B00001",
            }
        }

        result = parseMetadata(meta_in, [])
        expected = {"B00001_001E": {MetadataKey.INCOME: "$0-$20,000"}}
        self.assertEqual(result, expected)

    def testing_income_range(self):
        meta_in = {
            "B00001_001E": {
                "label": "Estimate!! $10,000 to $200,000",
                "concept": "SEX BY AGE",
                "group": "B00001",
            }
        }

        result = parseMetadata(meta_in, [])
        expected = {"B00001_001E": {MetadataKey.INCOME: "$10,000-$200,000"}}
        self.assertEqual(result, expected)

    def testing_income_upper(self):
        meta_in = {
            "B00001_001E": {
                "label": "Estimate!! $10,000 or more",
                "concept": "SEX BY AGE",
                "group": "B00001",
            }
        }

        result = parseMetadata(meta_in, [])
        expected = {"B00001_001E": {MetadataKey.INCOME: "$10,000+"}}
        self.assertEqual(result, expected)

    def testing_female(self):
        meta_in = {
            "B00001_001E": {
                "label": "Estimate!!Female:",
                "concept": "SEX BY AGE",
                "group": "B00001",
            }
        }

        result = parseMetadata(meta_in, [])
        expected = {"B00001_001E": {MetadataKey.SEX: Sex.FEMALE}}
        self.assertEqual(result, expected)

    def testing_male(self):
        meta_in = {
            "B00001_001E": {
                "label": "Estimate!!Male:",
                "concept": "SEX BY AGE",
                "group": "B00001",
            }
        }

        result = parseMetadata(meta_in, [])
        expected = {"B00001_001E": {MetadataKey.SEX: Sex.MALE}}
        self.assertEqual(result, expected)

    def testing_with_health_insurance(self):
        meta_in = {
            "B00001_001E": {
                "label": "Estimate!! With Health Insurance Coverage",
                "concept": "SEX BY AGE",
                "group": "B00001",
            }
        }

        result = parseMetadata(meta_in, [])
        expected = {
            "B00001_001E": {MetadataKey.POPULATION: HealthInsurancePopulation.WITH}
        }
        self.assertEqual(result, expected)

    def testing_without_health_insurance(self):
        meta_in = {
            "B00001_001E": {
                "label": "Estimate!!No health insurance coverage",
                "concept": "SEX BY AGE",
                "group": "B00001",
            }
        }

        result = parseMetadata(meta_in, [])
        expected = {
            "B00001_001E": {MetadataKey.POPULATION: HealthInsurancePopulation.WITHOUT}
        }
        self.assertEqual(result, expected)

    def testing_above_poverty(self):
        meta_in = {
            "B00001_001E": {
                "label": "Estimate!!Income in the past 12 months below poverty level:",
                "concept": "SEX BY AGE",
                "group": "B00001",
            }
        }

        result = parseMetadata(meta_in, [])
        expected = {"B00001_001E": {MetadataKey.POPULATION: PovertyPopulation.BELOW}}
        self.assertEqual(result, expected)

    def testing_below_poverty(self):
        meta_in = {
            "B00001_001E": {
                "label": "Income in the past 12 months at or above poverty level:",
                "concept": "SEX BY AGE",
                "group": "B00001",
            }
        }

        result = parseMetadata(meta_in, [])
        expected = {"B00001_001E": {MetadataKey.POPULATION: PovertyPopulation.ABOVE}}
        self.assertEqual(result, expected)

    def testing_age_order(self):
        meta_in = {
            "B00001_001E": {
                "label": "Estimate!!Total:!!Income in the past 12 months below poverty level:!!Male:!!15 years",
                "concept": "SEX BY AGE",
                "group": "B00001",
            }
        }

        result = parseMetadata(meta_in, [])
        age_out = result["B00001_001E"][MetadataKey.AGE]
        self.assertEqual(age_out, "15")

    def testing_age_order_longer(self):
        meta_in = {
            "B00001_001E": {
                "label": "Estimate!!Total:!!Income in the past 12 months below poverty level:!!Male:!!12 to 14 years",
                "concept": "SEX BY AGE",
                "group": "B00001",
            }
        }

        result = parseMetadata(meta_in, [])
        age_out = result["B00001_001E"][MetadataKey.AGE]
        self.assertEqual(age_out, "12-14")

    def testing_age_order_two(self):
        meta_in = {
            "B00001_001E": {
                "label": "Estimate!!Total:!!Income in the past 12 months below poverty level:!!Male:!!16 and 17 years",
                "concept": "SEX BY AGE",
                "group": "B00001",
            }
        }

        result = parseMetadata(meta_in, [])
        age_out = result["B00001_001E"][MetadataKey.AGE]
        self.assertEqual(age_out, "16-17")
