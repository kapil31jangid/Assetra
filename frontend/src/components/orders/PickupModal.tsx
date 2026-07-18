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
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import { useState } from "react";
import type { RentalOrder } from "../../types";

interface PickupModalProps {
  order: RentalOrder;
  open: boolean;
  onClose: () => void;
  onConfirm: (pickupData: any) => void;
}

const CHECKLIST_ITEMS = [
  "Product condition verified",
  "Accessories included",
  "Customer ID verified",
];

export function PickupModal({ order, open, onClose, onConfirm }: PickupModalProps) {
  const [pickupDate, setPickupDate] = useState(dayjs().format("YYYY-MM-DDTHH:mm"));
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [productChecks, setProductChecks] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");

  const allProductsChecked = order.lines
    .filter((l) => !l.isNote)
    .every((l) => productChecks[l.id || l.product_id || ""]);

  const handleConfirm = () => {
    onConfirm({
      confirmed_at: pickupDate,
      checklist,
      notes,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Confirm Pickup for {order.ref || order.number}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Customer</Typography>
            <Typography variant="body1" fontWeight="bold">{order.customer?.name}</Typography>
          </Box>

          <TextField
            fullWidth
            label="Pickup Date/Time"
            type="datetime-local"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Products to Pickup</Typography>
            <FormGroup>
              {order.lines.filter(l => !l.isNote).map((line, idx) => {
                const key = line.id || line.product_id || String(idx);
                return (
                  <FormControlLabel
                    key={key}
                    control={
                      <Checkbox
                        checked={!!productChecks[key]}
                        onChange={(e) => setProductChecks({ ...productChecks, [key]: e.target.checked })}
                      />
                    }
                    label={`${line.productName || "Product"} (Qty: ${line.qty})`}
                  />
                );
              })}
            </FormGroup>
          </Box>
          <Divider />
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Checklist</Typography>
            <FormGroup>
              {CHECKLIST_ITEMS.map((item) => (
                <FormControlLabel
                  key={item}
                  control={
                    <Checkbox
                      checked={!!checklist[item]}
                      onChange={(e) => setChecklist({ ...checklist, [item]: e.target.checked })}
                    />
                  }
                  label={item}
                />
              ))}
            </FormGroup>
          </Box>
          
          <TextField
            fullWidth
            label="Pickup Notes (Optional)"
            multiline
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={handleConfirm}
          disabled={!allProductsChecked}
        >
          Confirm Pickup
        </Button>
      </DialogActions>
    </Dialog>
  );
}
