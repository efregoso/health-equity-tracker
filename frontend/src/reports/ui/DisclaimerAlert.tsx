import React from "react";
import Alert from "@material-ui/lab/Alert";
import AlertTitle from "@material-ui/lab/AlertTitle";
import Button from "@material-ui/core/Button";
import styles from "./DisclaimerAlert.module.scss";
import FlagIcon from "@material-ui/icons/Flag";

function DisclaimerAlert(props: { jumpToData: () => void }) {
  return (
    <div>
      <Alert
        severity="warning"
        className={styles.ReportAlert}
        icon={<FlagIcon />}
      >
        <AlertTitle id="onboarding-limits-in-the-data">
          Major gaps in the data
        </AlertTitle>
        Structural racism and oppression create health inequities, and lead to
        missing data. The maps and tables below reflect the best data we have,
        but there are major known gaps in the data. We're working to close these
        gaps which, in turn, will help us create more effective health policies
        in the United States.
        <Button
          onClick={() => props.jumpToData()}
          className={styles.LinkButton}
        >
          Read more about missing and misidentified people.
        </Button>
      </Alert>
    </div>
  );
}

export default DisclaimerAlert;
