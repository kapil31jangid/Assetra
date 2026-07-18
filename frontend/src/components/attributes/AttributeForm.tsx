import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
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

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

import { useCreateAttributeMutation, useUpdateAttributeMutation } from "../../services/queries";
import type { ProductAttribute, ProductAttributeValue } from "../../types";

interface AttributeFormProps {
  attribute: ProductAttribute;
  isNew: boolean;
  onClose: () => void;
}

export function AttributeForm({ attribute, isNew, onClose }: AttributeFormProps) {
  const createMutation = useCreateAttributeMutation();
  const updateMutation = useUpdateAttributeMutation();

  const [name, setName] = useState(attribute.name);
  const [displayType, setDisplayType] = useState(attribute.displayType);
  const [values, setValues] = useState<ProductAttributeValue[]>(attribute.values);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(
    attribute.values.length === 0 ? "Warning: No values added yet. You may want to add some before saving." : null
  );

  const handleAddLine = () => {
    setValues([
      ...values,
      {
        id: `temp-${Date.now()}`,
        value: "",
        extraPrice: 0,
      },
    ]);
    setWarning(null);
  };

  const handleRemoveLine = (id: string) => {
    const newValues = values.filter((v) => v.id !== id);
    setValues(newValues);
    if (newValues.length === 0) {
      setWarning("Warning: No values added yet. You may want to add some before saving.");
    }
  };

  const handleChangeLine = (id: string, field: keyof ProductAttributeValue, val: string | number) => {
    setValues(values.map((v) => (v.id === id ? { ...v, [field]: val } : v)));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Attribute Name is required.");
      return;
    }
    if (values.some((v) => v.extraPrice !== undefined && v.extraPrice < 0)) {
      setError("Default Extra Price cannot be negative.");
      return;
    }
    setError(null);

    const payload = {
      name,
      displayType,
      values,
    };

    try {
      if (isNew) {
        await createMutation.mutateAsync(payload);
      } else {
        await updateMutation.mutateAsync({ id: attribute.id, request: payload });
      }
      onClose();
    } catch (err) {
      setError("Failed to save attribute.");
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5">
          {isNew ? "New Attribute" : `Edit Attribute: ${attribute.name}`}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" color="inherit" startIcon={<CloseIcon />} onClick={onClose}>
            Discard
          </Button>
          <Button variant="contained" startIcon={<CheckIcon />} onClick={() => void handleSave()}>
            Save
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {warning && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {warning}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack spacing={3}>
                <TextField
                  label="Attribute Name"
                  fullWidth
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <TextField
                  label="Display Type"
                  fullWidth
                  select
                  value={displayType}
                  onChange={(e) => setDisplayType(e.target.value as any)}
                >
                  <MenuItem value="radio">Radio</MenuItem>
                  <MenuItem value="pills">Pills</MenuItem>
                  <MenuItem value="checkbox">Check Box</MenuItem>
                  <MenuItem value="image">Image</MenuItem>
                </TextField>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Value</TableCell>
                    <TableCell>Default Extra Price</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {values.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={v.value}
                          onChange={(e) => handleChangeLine(v.id, "value", e.target.value)}
                          placeholder="e.g. Red, XL, Dell"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          type="number"
                          value={v.extraPrice ?? 0}
                          onChange={(e) => handleChangeLine(v.id, "extraPrice", Number(e.target.value))}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="error" onClick={() => handleRemoveLine(v.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Button startIcon={<AddIcon />} size="small" onClick={handleAddLine}>
                        Add a Line
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
