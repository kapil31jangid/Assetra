import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";

import { useAttributesQuery, useDeleteAttributeMutation } from "../../services/queries";
import type { ProductAttribute } from "../../types";
import { LoadingState } from "../LoadingState";
import { ErrorState } from "../ErrorState";
import { AttributeForm } from "./AttributeForm";

export function AttributeManager() {
  const attributesQuery = useAttributesQuery();
  const deleteMutation = useDeleteAttributeMutation();

  const [search, setSearch] = useState("");
  const [selectedAttribute, setSelectedAttribute] = useState<ProductAttribute | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (attributesQuery.isLoading) return <LoadingState />;
  if (attributesQuery.isError) return <ErrorState />;

  const attributes = attributesQuery.data?.data || [];
  const filteredAttributes = attributes.filter((attr) =>
    attr.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleNew = () => {
    setSelectedAttribute({
      id: "new",
      name: "",
      displayType: "radio",
      values: [],
    });
    setIsNew(true);
  };

  const handleEdit = (attr: ProductAttribute) => {
    setSelectedAttribute(attr);
    setIsNew(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  if (selectedAttribute) {
    return (
      <AttributeForm
        attribute={selectedAttribute}
        isNew={isNew}
        onClose={() => setSelectedAttribute(null)}
      />
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <TextField
          placeholder="Search attributes..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ width: 300 }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleNew}>
          New
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Attribute Name</TableCell>
                <TableCell>Display Type</TableCell>
                <TableCell>Values Count</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAttributes.map((attr) => (
                <TableRow key={attr.id} hover sx={{ cursor: "pointer" }}>
                  <TableCell onClick={() => handleEdit(attr)}>
                    {attr.name}
                  </TableCell>
                  <TableCell onClick={() => handleEdit(attr)}>
                    <Chip label={attr.displayType} size="small" />
                  </TableCell>
                  <TableCell onClick={() => handleEdit(attr)}>
                    {attr.values.length}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEdit(attr)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteId(attr.id); }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredAttributes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No attributes found.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Attribute?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this attribute? If it is currently used by any products, deleting it may cause issues or remove those options from products.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
