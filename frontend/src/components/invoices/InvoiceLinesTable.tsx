import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import { formatMoney } from "../../utils/catalog";
import type { InvoiceLine, Product } from "../../types";

interface InvoiceLinesTableProps {
  lines: InvoiceLine[];
  onChange: (lines: InvoiceLine[]) => void;
  products: Product[];
  readOnly?: boolean;
}

export function InvoiceLinesTable({ lines, onChange, products, readOnly }: InvoiceLinesTableProps) {
  const handleLineChange = (index: number, updates: Partial<InvoiceLine>) => {
    if (readOnly) return;
    const newLines = [...lines];
    const updatedLine = { ...newLines[index], ...updates };
    
    // Auto-calculate amount if quantity or unit price changes
    if ("qty" in updates || "unit_price" in updates || "tax_percent" in updates) {
      const amount = updatedLine.qty * updatedLine.unit_price * (1 + updatedLine.tax_percent / 100);
      updatedLine.amount = amount;
    }
    
    newLines[index] = updatedLine;
    onChange(newLines);
  };

  const addProductLine = () => {
    if (readOnly) return;
    onChange([
      ...lines,
      {
        qty: 1,
        unit: "Days",
        unit_price: 0,
        tax_percent: 0,
        amount: 0,
      } as InvoiceLine,
    ]);
  };

  const addNoteLine = () => {
    if (readOnly) return;
    onChange([
      ...lines,
      {
        qty: 0,
        unit: "",
        unit_price: 0,
        tax_percent: 0,
        amount: 0,
        description: "",
      } as InvoiceLine,
    ]);
  };

  const removeLine = (index: number) => {
    if (readOnly) return;
    onChange(lines.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Table size="small" sx={{ mb: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell>Product / Description</TableCell>
            <TableCell width={100}>Quantity</TableCell>
            <TableCell width={120}>Unit</TableCell>
            <TableCell width={150}>Unit Price</TableCell>
            <TableCell width={100}>Taxes (%)</TableCell>
            <TableCell width={150}>Amount</TableCell>
            {!readOnly && <TableCell width={50} />}
          </TableRow>
        </TableHead>
        <TableBody>
          {lines.map((line, index) => (
            <TableRow key={index}>
              {line.qty === 0 ? (
                <TableCell colSpan={6}>
                  <TextField
                    fullWidth
                    placeholder="Note..."
                    size="small"
                    value={line.description || ""}
                    onChange={(e) => handleLineChange(index, { description: e.target.value })}
                    variant="standard"
                    disabled={readOnly}
                  />
                </TableCell>
              ) : (
                <>
                  <TableCell>
                    <TextField
                      fullWidth
                      select
                      size="small"
                      value={line.product_id || ""}
                      onChange={(e) => {
                        const product = products.find((p) => p.id === e.target.value);
                        handleLineChange(index, {
                          product_id: e.target.value,
                          unit_price: product ? (product.variants[0]?.price?.amount || 0) : 0,
                        });
                      }}
                      variant="standard"
                      disabled={readOnly}
                    >
                      <MenuItem value="">Custom / None</MenuItem>
                      {products.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.name}
                        </MenuItem>
                      ))}
                    </TextField>
                    {(!line.product_id || line.description) && (
                      <TextField
                        fullWidth
                        placeholder="Description..."
                        size="small"
                        value={line.description || ""}
                        onChange={(e) => handleLineChange(index, { description: e.target.value })}
                        variant="standard"
                        disabled={readOnly}
                        sx={{ mt: 1 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      inputProps={{ min: 0, step: 1 }}
                      value={line.qty}
                      onChange={(e) => handleLineChange(index, { qty: Math.max(0, Number(e.target.value) || 0) })}
                      variant="standard"
                      disabled={readOnly}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      value={line.unit || ""}
                      onChange={(e) => handleLineChange(index, { unit: e.target.value })}
                      variant="standard"
                      disabled={readOnly}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      inputProps={{ min: 0, step: 0.01 }}
                      value={line.unit_price}
                      onChange={(e) => handleLineChange(index, { unit_price: Math.max(0, Number(e.target.value) || 0) })}
                      variant="standard"
                      disabled={readOnly}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      inputProps={{ min: 0, step: 0.01 }}
                      value={line.tax_percent || 0}
                      onChange={(e) => handleLineChange(index, { tax_percent: Math.max(0, Number(e.target.value) || 0) })}
                      variant="standard"
                      disabled={readOnly}
                    />
                  </TableCell>
                  <TableCell>{formatMoney({ amount: line.amount || 0, currency: "USD" })}</TableCell>
                </>
              )}
              {!readOnly && (
                <TableCell>
                  <IconButton color="error" onClick={() => removeLine(index)} size="small">
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
          {lines.length === 0 && (
            <TableRow>
              <TableCell colSpan={readOnly ? 6 : 7} sx={{ textAlign: "center", py: 4 }}>
                No lines added yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {!readOnly && (
        <Stack direction="row" spacing={2}>
          <Button onClick={addProductLine} size="small">
            Add a Product
          </Button>
          <Button onClick={addNoteLine} size="small">
            Add a note
          </Button>
        </Stack>
      )}
    </Box>
  );
}
