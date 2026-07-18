import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";
import Drawer from "@mui/material/Drawer";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import OutlinedInput from "@mui/material/OutlinedInput";
import Chip from "@mui/material/Chip";

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

import { usePricelistQuery, useCreatePricelistMutation, useUpdatePricelistMutation, useProductsQuery } from "../../services/queries";
import type { Pricelist, PricingRule } from "../../types";
import { LoadingState } from "../LoadingState";
import { ErrorState } from "../ErrorState";

interface PricelistFormProps {
  pricelistId: string | null;
  isNew: boolean;
  onClose: () => void;
}

const defaultPricelist: Omit<Pricelist, "id"> = {
  name: "",
  isDefault: false,
  rules: [],
};

export function PricelistForm({ pricelistId, isNew, onClose }: PricelistFormProps) {
  const pricelistQuery = usePricelistQuery(pricelistId || undefined);
  const createMutation = useCreatePricelistMutation();
  const updateMutation = useUpdatePricelistMutation();
  const productsQuery = useProductsQuery({ includeInactive: false });

  const [pricelist, setPricelist] = useState<Omit<Pricelist, "id">>(defaultPricelist);
  const [error, setError] = useState<string | null>(null);
  
  // Rule panel state
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);
  const [activeRule, setActiveRule] = useState<Partial<PricingRule>>({});
  const [ruleError, setRuleError] = useState<string | null>(null);

  const allProducts = productsQuery.data?.data.items || [];

  useEffect(() => {
    if (!isNew && pricelistQuery.data?.data) {
      setPricelist({
        name: pricelistQuery.data.data.name || "",
        isDefault: pricelistQuery.data.data.isDefault || false,
        rules: pricelistQuery.data.data.rules || [],
      });
    }
  }, [isNew, pricelistQuery.data]);

  if (!isNew && pricelistQuery.isLoading) return <LoadingState />;
  if (!isNew && pricelistQuery.isError) return <ErrorState />;

  const handleSave = async () => {
    if (!pricelist.name.trim()) return setError("Pricelist Name is required.");
    setError(null);
    try {
      if (isNew) {
        await createMutation.mutateAsync(pricelist);
      } else {
        await updateMutation.mutateAsync({ id: pricelistId!, request: pricelist });
      }
      onClose();
    } catch (e) {
      setError("Failed to save pricelist.");
    }
  };

  const handleOpenRulePanel = (index?: number) => {
    if (index !== undefined) {
      setEditingRuleIndex(index);
      setActiveRule(pricelist.rules[index]);
    } else {
      setEditingRuleIndex(null);
      setActiveRule({
        appliesTo: "all",
        priceType: "discount",
        value: 0,
        minQty: 0,
        selectable: true,
      });
    }
    setRuleError(null);
    setPanelOpen(true);
  };

  const handleSaveRule = () => {
    const r = activeRule as PricingRule;
    if (r.appliesTo !== "all" && (!r.appliesTo || r.appliesTo.length === 0)) {
      return setRuleError("Products field is required. Select 'All Products' or specific products.");
    }
    if (r.priceType !== "discount" && r.priceType !== "fixed") {
      return setRuleError("A valid Price Type must be selected.");
    }
    if (r.priceType === "fixed" && (r.value === undefined || r.value < 0)) {
      return setRuleError("Fixed Price must be a non-negative number.");
    }
    if (r.priceType === "discount" && (r.value === undefined || r.value < 0 || r.value > 100)) {
      return setRuleError("Discount must be between 0 and 100.");
    }
    if (r.minQty === undefined || r.minQty < 0 || !Number.isInteger(r.minQty)) {
      return setRuleError("Min Qty must be a non-negative integer.");
    }
    if (r.validityStart && r.validityEnd && new Date(r.validityEnd) <= new Date(r.validityStart)) {
      return setRuleError("Validity end date must be after start date.");
    }

    const newRules = [...pricelist.rules];
    const ruleToSave = { ...r, id: r.id || `rule-${Date.now()}` };
    
    if (editingRuleIndex !== null) {
      newRules[editingRuleIndex] = ruleToSave;
    } else {
      newRules.push(ruleToSave);
    }
    
    setPricelist({ ...pricelist, rules: newRules });
    setPanelOpen(false);
  };

  const handleDeleteRule = (index: number) => {
    const newRules = pricelist.rules.filter((_, i) => i !== index);
    setPricelist({ ...pricelist, rules: newRules });
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5">{isNew ? "New Pricelist" : `Edit Pricelist: ${pricelist.name}`}</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" color="inherit" startIcon={<CloseIcon />} onClick={onClose}>Discard</Button>
          <Button variant="contained" startIcon={<CheckIcon />} onClick={() => void handleSave()}>Save</Button>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card sx={{ mb: 3, p: 2 }}>
        <Stack spacing={3}>
          <TextField
            label="Pricelist Name"
            fullWidth
            required
            value={pricelist.name}
            onChange={(e) => setPricelist({ ...pricelist, name: e.target.value })}
            variant="outlined"
            placeholder="e.g. My Price List"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={pricelist.isDefault}
                onChange={(e) => setPricelist({ ...pricelist, isDefault: e.target.checked })}
                disabled={!isNew && pricelistQuery.data?.data?.isDefault}
              />
            }
            label="Default Pricelist"
          />
          {pricelist.isDefault && (
            <Typography variant="caption" color="text.secondary">
              The default pricelist cannot be deleted and applies automatically if no other pricelist matches.
            </Typography>
          )}
        </Stack>
      </Card>

      <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6">Rules</Typography>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => handleOpenRulePanel()}>Rule</Button>
      </Box>

      <TableContainer component={Card}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Apply On</TableCell>
              <TableCell>Min Qty</TableCell>
              <TableCell>Validity</TableCell>
              <TableCell align="center">Selectable</TableCell>
              <TableCell>Price / Discount</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pricelist.rules.map((rule, index) => {
              const applyOnText = rule.appliesTo === "all" ? "All Products" : `${rule.appliesTo.length} Product(s)`;
              const validityText = (rule.validityStart || rule.validityEnd) 
                ? `${rule.validityStart || 'Always'} - ${rule.validityEnd || 'Always'}` 
                : "Always";
              
              return (
                <TableRow key={rule.id || index} hover>
                  <TableCell onClick={() => handleOpenRulePanel(index)} sx={{ cursor: "pointer" }}>{applyOnText}</TableCell>
                  <TableCell onClick={() => handleOpenRulePanel(index)} sx={{ cursor: "pointer" }}>{rule.minQty}</TableCell>
                  <TableCell onClick={() => handleOpenRulePanel(index)} sx={{ cursor: "pointer" }}>{validityText}</TableCell>
                  <TableCell align="center" onClick={() => handleOpenRulePanel(index)} sx={{ cursor: "pointer" }}>
                    <Checkbox checked={rule.selectable} disabled size="small" />
                  </TableCell>
                  <TableCell onClick={() => handleOpenRulePanel(index)} sx={{ cursor: "pointer" }}>
                    {rule.priceType === "discount" ? `${rule.value}% Discount` : `$${rule.value.toFixed(2)}`}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenRulePanel(index)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteRule(index)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            {pricelist.rules.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No rules added. Click "Rule" to add one.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Rule Form Side Panel */}
      <Drawer anchor="right" open={panelOpen} onClose={() => setPanelOpen(false)}>
        <Box sx={{ width: { xs: '100vw', sm: 400 }, p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
            <Typography variant="h6">{editingRuleIndex !== null ? "Edit Rule" : "Create Rule"}</Typography>
            <IconButton onClick={() => setPanelOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {ruleError && <Alert severity="error" sx={{ mb: 2 }}>{ruleError}</Alert>}

          <Stack spacing={3} sx={{ flex: 1, overflowY: "auto" }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Products</Typography>
              <RadioGroup
                row
                value={activeRule.appliesTo === "all" ? "all" : "specific"}
                onChange={(e) => setActiveRule({ ...activeRule, appliesTo: e.target.value === "all" ? "all" : [] })}
              >
                <FormControlLabel value="all" control={<Radio />} label="All Products" />
                <FormControlLabel value="specific" control={<Radio />} label="Specific Product(s)" />
              </RadioGroup>
              
              {activeRule.appliesTo !== "all" && (
                <Select
                  fullWidth
                  multiple
                  value={(activeRule.appliesTo as string[]) || []}
                  onChange={(e) => setActiveRule({ ...activeRule, appliesTo: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                  input={<OutlinedInput />}
                  displayEmpty
                  renderValue={(selected) => {
                    if (selected.length === 0) return <Typography color="text.disabled">Select products</Typography>;
                    return (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((val) => {
                          const prod = allProducts.find(p => p.id === val);
                          return <Chip key={val} label={prod ? prod.name : val} size="small" />;
                        })}
                      </Box>
                    );
                  }}
                  sx={{ mt: 1 }}
                >
                  {allProducts.map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                  ))}
                </Select>
              )}
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Price Type</Typography>
              <RadioGroup
                row
                value={activeRule.priceType || "discount"}
                onChange={(e) => setActiveRule({ ...activeRule, priceType: e.target.value as any })}
              >
                <FormControlLabel value="discount" control={<Radio />} label="Discount" />
                <FormControlLabel value="fixed" control={<Radio />} label="Fixed Price" />
              </RadioGroup>
            </Box>

            {activeRule.priceType === "fixed" ? (
              <TextField
                label="Fixed Price ($)"
                type="number"
                fullWidth
                value={activeRule.value ?? ""}
                onChange={(e) => setActiveRule({ ...activeRule, value: Number(e.target.value) })}
              />
            ) : (
              <TextField
                label="Discount (%)"
                type="number"
                fullWidth
                helperText="% on sales price"
                value={activeRule.value ?? ""}
                onChange={(e) => setActiveRule({ ...activeRule, value: Number(e.target.value) })}
              />
            )}

            <TextField
              label="Min Qty"
              type="number"
              fullWidth
              value={activeRule.minQty ?? 0}
              onChange={(e) => setActiveRule({ ...activeRule, minQty: Number(e.target.value) })}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Validity Start"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={activeRule.validityStart || ""}
                  onChange={(e) => setActiveRule({ ...activeRule, validityStart: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Validity End"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={activeRule.validityEnd || ""}
                  onChange={(e) => setActiveRule({ ...activeRule, validityEnd: e.target.value })}
                />
              </Grid>
            </Grid>

            <FormControlLabel
              control={
                <Checkbox
                  checked={activeRule.selectable || false}
                  onChange={(e) => setActiveRule({ ...activeRule, selectable: e.target.checked })}
                />
              }
              label="Selectable (customer can pick this manually)"
            />
          </Stack>

          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button onClick={() => setPanelOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveRule}>Save Rule</Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}
