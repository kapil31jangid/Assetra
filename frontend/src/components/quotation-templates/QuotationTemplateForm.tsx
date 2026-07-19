import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/GridLegacy";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ViewQuiltIcon from "@mui/icons-material/ViewQuilt";

import { useQuotationTemplateQuery, useCreateQuotationTemplateMutation, useUpdateQuotationTemplateMutation, useProductsQuery } from "../../services/queries";
import type { QuotationTemplate, QuotationTemplateLine } from "../../types";
import { LoadingState } from "../LoadingState";
import { ErrorState } from "../ErrorState";

interface QuotationTemplateFormProps {
  templateId: string | null;
  isNew: boolean;
  onClose: () => void;
}

const defaultTemplate: Omit<QuotationTemplate, "id"> = {
  name: "",
  validityDays: 30,
  paymentTermsPercent: 100,
  lines: [],
  header: "",
  footer: "",
};

export function QuotationTemplateForm({ templateId, isNew, onClose }: QuotationTemplateFormProps) {
  const templateQuery = useQuotationTemplateQuery(templateId || undefined);
  const createMutation = useCreateQuotationTemplateMutation();
  const updateMutation = useUpdateQuotationTemplateMutation();
  const productsQuery = useProductsQuery({ includeInactive: false });

  const [template, setTemplate] = useState<Omit<QuotationTemplate, "id">>(defaultTemplate);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const [builderOpen, setBuilderOpen] = useState(false);

  const allProducts = productsQuery.data?.data || [];

  useEffect(() => {
    if (!isNew && templateQuery.data?.data) {
      setTemplate({
        name: templateQuery.data.data.name || "",
        validityDays: templateQuery.data.data.validityDays || 30,
        paymentTermsPercent: templateQuery.data.data.paymentTermsPercent || 100,
        lines: templateQuery.data.data.lines || [],
        header: templateQuery.data.data.header || "",
        footer: templateQuery.data.data.footer || "",
      });
    }
  }, [isNew, templateQuery.data]);

  if (!isNew && templateQuery.isLoading) return <LoadingState />;
  if (!isNew && templateQuery.isError) return <ErrorState />;

  const handleSave = async () => {
    if (!template.name.trim()) return setError("Template Name is required.");
    if (!Number.isInteger(template.validityDays) || template.validityDays <= 0) {
      return setError("Quotation Validity must be a positive integer.");
    }
    if (template.paymentTermsPercent < 0 || template.paymentTermsPercent > 100) {
      return setError("Payment Terms must be between 0 and 100%.");
    }
    if (template.lines.length === 0) {
      // Just a warning, we won't block it, but maybe show a subtle message or we can let it pass
      // The prompt says "At least one product line recommended before saving (warn, don't hard-block)."
      // I will implement a warning but proceed to save if they try again. 
      // For simplicity, we just save without hard block.
    }

    // Ensure all lines have valid productId and qty
    for (let i = 0; i < template.lines.length; i++) {
      const line = template.lines[i];
      if (!line.productId) return setError(`Line ${i + 1}: Product must be selected.`);
      if (line.quantity <= 0) return setError(`Line ${i + 1}: Quantity must be greater than 0.`);
    }

    setError(null);
    try {
      if (isNew) {
        await createMutation.mutateAsync(template);
      } else {
        await updateMutation.mutateAsync({ id: templateId!, request: template });
      }
      onClose();
    } catch (e) {
      setError("Failed to save quotation template.");
    }
  };

  const handleAddLine = () => {
    setTemplate({
      ...template,
      lines: [...template.lines, { productId: "", quantity: 1, unit: "Units" }]
    });
  };

  const handleLineChange = (index: number, field: keyof QuotationTemplateLine, value: any) => {
    const newLines = [...template.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setTemplate({ ...template, lines: newLines });
  };

  const handleRemoveLine = (index: number) => {
    const newLines = template.lines.filter((_, i) => i !== index);
    setTemplate({ ...template, lines: newLines });
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5">{isNew ? "New Quotation Template" : `Edit Template: ${template.name}`}</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" color="inherit" startIcon={<CloseIcon />} onClick={onClose}>Discard</Button>
          <Button variant="contained" startIcon={<CheckIcon />} onClick={() => void handleSave()}>Save</Button>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {template.lines.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>It is recommended to add at least one product line to this template.</Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Template Name"
                fullWidth
                required
                value={template.name}
                onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                variant="standard"
                placeholder="e.g. Home Rental Furniture"
                InputProps={{ sx: { fontSize: "1.5rem" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Confirmation
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Quotation Validity"
                  type="number"
                  inputProps={{ min: 0, step: 1 }}
                  fullWidth
                  value={template.validityDays}
                  onChange={(e) => setTemplate({ ...template, validityDays: Number(e.target.value) })}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">Days</InputAdornment>,
                  }}
                />
                <TextField
                  label="Payment Terms"
                  type="number"
                  inputProps={{ min: 0, max: 100, step: 1 }}
                  fullWidth
                  value={template.paymentTermsPercent}
                  onChange={(e) => setTemplate({ ...template, paymentTermsPercent: Number(e.target.value) })}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">% upfront</InputAdornment>,
                  }}
                />
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Lines" />
          <Tab label="Header / Footer" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ViewQuiltIcon />}
              onClick={() => setBuilderOpen(true)}
            >
              Quote Builder
            </Button>
          </Box>
          <TableContainer component={Card} sx={{ mb: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell width={150}>Quantity</TableCell>
                  <TableCell width={150}>Unit</TableCell>
                  <TableCell width={60} align="center"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {template.lines.map((line, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Select
                        size="small"
                        fullWidth
                        displayEmpty
                        value={line.productId}
                        onChange={(e) => handleLineChange(index, "productId", e.target.value)}
                      >
                        <MenuItem value="" disabled>Select Product</MenuItem>
                        {allProducts.map((p) => (
                          <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        inputProps={{ min: 0, step: 1 }}
                        fullWidth
                        value={line.quantity}
                        onChange={(e) => handleLineChange(index, "quantity", Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        value={line.unit}
                        onChange={(e) => handleLineChange(index, "unit", e.target.value)}
                        placeholder="e.g. Units"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => handleRemoveLine(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button startIcon={<AddIcon />} onClick={handleAddLine}>Add a Line</Button>
        </Box>
      )}

      {tab === 1 && (
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>Header Configuration</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Enter branding, letterhead details, or legal text for the top of the quotation..."
                  value={template.header}
                  onChange={(e) => setTemplate({ ...template, header: e.target.value })}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" gutterBottom>Footer Configuration</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Enter terms & conditions, signatures, or thank you notes for the bottom of the quotation..."
                  value={template.footer}
                  onChange={(e) => setTemplate({ ...template, footer: e.target.value })}
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Quote Builder Placeholder */}
      <Dialog open={builderOpen} onClose={() => setBuilderOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Quote Builder</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 4, textAlign: "center" }}>
            <ViewQuiltIcon sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" gutterBottom>Coming Soon</Typography>
            <Typography color="text.secondary">
              The visual drag-and-drop Quote Builder is under construction. It will allow you to design custom rich-text sections alongside your product lines.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBuilderOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
