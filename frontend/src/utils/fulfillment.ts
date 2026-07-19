import dayjs from "dayjs";

export function calculateLateFee({
  expectedReturn,
  actualReturn,
  gracePeriodMinutes,
  lateFeeRate,
  periodicity,
  maxLateFee,
}: {
  expectedReturn: string;
  actualReturn: string;
  gracePeriodMinutes: number;
  lateFeeRate: number;
  periodicity: "hour" | "day" | "week" | "month";
  maxLateFee?: number;
}) {
  const expected = dayjs(expectedReturn);
  const actual = dayjs(actualReturn);

  const diffMinutes = actual.diff(expected, "minute");

  if (diffMinutes <= gracePeriodMinutes) {
    return {
      is_late: false,
      late_duration: "On time",
      calculated_fee: 0,
    };
  }

  let periods = 0;
  if (periodicity === "hour") periods = Math.ceil(diffMinutes / 60);
  else if (periodicity === "day") periods = Math.ceil(diffMinutes / (60 * 24));
  else if (periodicity === "week") periods = Math.ceil(diffMinutes / (60 * 24 * 7));
  else if (periodicity === "month") periods = Math.ceil(diffMinutes / (60 * 24 * 30));

  let fee = periods * lateFeeRate;
  if (maxLateFee !== undefined && fee > maxLateFee) {
    fee = maxLateFee;
  }

  // Format duration nicely
  const diffHours = actual.diff(expected, "hour");
  const diffDays = actual.diff(expected, "day");
  
  let durationStr = `${diffMinutes} minutes late`;
  if (diffDays > 0) durationStr = `${diffDays} days late`;
  else if (diffHours > 0) durationStr = `${diffHours} hours late`;

  return {
    is_late: true,
    late_duration: durationStr,
    calculated_fee: fee,
  };
}

export function calculateDepositSettlement(depositAmount: number, lateFee: number) {
  if (lateFee <= depositAmount) {
    return {
      refund_amount: depositAmount - lateFee,
      additional_due: 0,
    };
  } else {
    return {
      refund_amount: 0,
      additional_due: lateFee - depositAmount,
    };
  }
}
