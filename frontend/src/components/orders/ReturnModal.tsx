import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import dayjs from "dayjs";
import { useState, useMemo } from "react";
import type { RentalOrder } from "../../types";
import { formatMoney } from "../../utils/catalog";
import { calculateLateFee, calculateDepositSettlement } from "../../utils/fulfillment";

interface ReturnModalProps {
  order: RentalOrder;
  open: boolean;
  onClose: () => void;
  onConfirm: (returnData: any) => void;
}

export function ReturnModal({ order, open, onClose, onConfirm }: ReturnModalProps) {
  const [returnDate, setReturnDate] = useState(dayjs().format("YYYY-MM-DDTHH:mm"));
  
  const [productChecks, setProductChecks] = useState<Record<string, boolean>>({});
  const [productConditions, setProductConditions] = useState<Record<string, "Good" | "Damaged" | "Missing">>({});
  const [damageNotes, setDamageNotes] = useState<Record<string, string>>({});

  const expectedReturn = order.rentalEnd || dayjs().format("YYYY-MM-DDTHH:mm");
  
  // Real app: fetch from product/org settings
  const gracePeriodMinutes = 60;
  const lateFeeRate = 50; // $50 per period
  const periodicity = "day";
  const depositAmount = order.deposit?.amount?.amount || 200; // Mock deposit

  const lateFeeResult = useMemo(() => {
    return calculateLateFee({
      expectedReturn,
      actualReturn: returnDate,
      gracePeriodMinutes,
      lateFeeRate,
      periodicity,
    });
  }, [expectedReturn, returnDate]);

  const settlement = useMemo(() => {
    return calculateDepositSettlement(depositAmount, lateFeeResult.calculated_fee);
  }, [depositAmount, lateFeeResult.calculated_fee]);

  const allProductsChecked = order.lines
    .filter((l) => !l.isNote)
    .every((l) => productChecks[l.id || l.product_id || ""]);

  const hasUnexplainedDamages = order.lines
    .filter((l) => !l.isNote)
    .some((l) => {
      const key = l.id || l.product_id || "";
      return productConditions[key] === "Damaged" && !(damageNotes[key] || "").trim();
    });

  const handleConfirm = () => {
    const conditions = order.lines
      .filter((l) => !l.isNote)
      .map((l) => {
        const key = l.id || l.product_id || "";
        return {
          product_id: key,
          condition: productConditions[key] || "Good",
          notes: damageNotes[key],
        };
      });

    onConfirm({
      actual_return_at: returnDate,
      product_conditions: conditions,
      late_fee_applied: lateFeeResult.is_late,
      late_fee_amount: lateFeeResult.calculated_fee,
      deposit_refund_amount: settlement.refund_amount,
      additional_due: settlement.additional_due,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Process Return for {order.ref || order.number}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">Expected Return</Typography>
              <Typography variant="body1" fontWeight="bold">{dayjs(expectedReturn).format("MMM D, YYYY h:mm A")}</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Actual Return Date/Time"
                type="datetime-local"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Products inspection</Typography>
            {order.lines.filter(l => !l.isNote).map((line, idx) => {
              const key = line.id || line.product_id || String(idx);
              const condition = productConditions[key] || "Good";
              return (
                <Box key={key} sx={{ mb: 2, p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!productChecks[key]}
                          onChange={(e) => setProductChecks({ ...productChecks, [key]: e.target.checked })}
                        />
                      }
                      label={`${line.productName || "Product"} (Qty: ${line.qty})`}
                      sx={{ flexGrow: 1 }}
                    />
                    <TextField
                      select
                      size="small"
                      label="Condition"
                      value={condition}
                      onChange={(e) => setProductConditions({ ...productConditions, [key]: e.target.value as any })}
                      sx={{ width: 150 }}
                    >
                      <MenuItem value="Good">Good</MenuItem>
                      <MenuItem value="Damaged">Damaged</MenuItem>
                      <MenuItem value="Missing">Missing</MenuItem>
                    </TextField>
                  </Stack>
                  {condition === "Damaged" && (
                    <TextField
                      fullWidth
                      size="small"
                      label="Damage Report Notes"
                      required
                      value={damageNotes[key] || ""}
                      onChange={(e) => setDamageNotes({ ...damageNotes, [key]: e.target.value })}
                    />
                  )}
                  {condition === "Missing" && (
                    <TextField
                      fullWidth
                      size="small"
                      label="Missing Accessories Notes (Optional)"
                      value={damageNotes[key] || ""}
                      onChange={(e) => setDamageNotes({ ...damageNotes, [key]: e.target.value })}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
          <Divider />
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Settlement Summary</Typography>
            <Box sx={{ bgcolor: "background.default", p: 2, borderRadius: 1 }}>
              {lateFeeResult.is_late ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Return is {lateFeeResult.late_duration}. A late fee will be applied to the invoice.
                </Alert>
              ) : (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Return is on time. No late fee applies.
                </Alert>
              )}
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Late Fee:</Typography>
                  <Typography color={lateFeeResult.calculated_fee > 0 ? "error.main" : "text.primary"}>
                    {formatMoney({ amount: lateFeeResult.calculated_fee, currency: "USD" })}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Security Deposit Held:</Typography>
                  <Typography>{formatMoney({ amount: depositAmount, currency: "USD" })}</Typography>
                </Stack>
                <Divider sx={{ my: 1 }} />
                <Stack direction="row" justifyContent="space-between">
                  <Typography fontWeight="bold">Deposit Refund Amount:</Typography>
                  <Typography fontWeight="bold" color="success.main">
                    {formatMoney({ amount: settlement.refund_amount, currency: "USD" })}
                  </Typography>
                </Stack>
                {settlement.additional_due > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography fontWeight="bold" color="error.main">Additional Amount Due:</Typography>
                    <Typography fontWeight="bold" color="error.main">
                      {formatMoney({ amount: settlement.additional_due, currency: "USD" })}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={handleConfirm}
          disabled={!allProductsChecked || hasUnexplainedDamages}
        >
          Confirm Return
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Needed Grid import
import Grid from "@mui/material/Grid";
