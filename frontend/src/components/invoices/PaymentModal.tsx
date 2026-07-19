import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import dayjs from "dayjs";
import { useState } from "react";
import { formatMoney } from "../../utils/catalog";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payment: { amount: number; method: string; date: string }) => void;
  maxAmount: number;
}

const PAYMENT_METHODS = ["Cash", "Card", "Bank Transfer", "Other"];

export function PaymentModal({ open, onClose, onSubmit, maxAmount }: PaymentModalProps) {
  const [amount, setAmount] = useState<number>(maxAmount);
  const [method, setMethod] = useState<string>("Card");
  const [date, setDate] = useState<string>(dayjs().format("YYYY-MM-DD"));

  const isOverpaid = amount > maxAmount;

  const handleSubmit = () => {
    onSubmit({ amount, method, date });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Record Payment</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="Payment Amount"
            type="number"
            inputProps={{ min: 0, step: 0.01 }}
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
            error={isOverpaid}
            helperText={isOverpaid ? "Amount exceeds invoice total. This is not allowed." : `Max allowed: ${formatMoney({ amount: maxAmount, currency: "USD" })}`}
          />
          <TextField
            fullWidth
            select
            label="Payment Method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            {PAYMENT_METHODS.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Payment Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          {isOverpaid && (
            <Alert severity="error">
              Payment amount cannot exceed the remaining invoice balance.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isOverpaid || amount <= 0}>
          Confirm Payment
        </Button>
      </DialogActions>
    </Dialog>
  );
}
