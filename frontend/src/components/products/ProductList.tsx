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
import Avatar from "@mui/material/Avatar";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";

import { useProductsQuery, useDeleteProductMutation, useSessionQuery } from "../../services/queries";
import { LoadingState } from "../LoadingState";
import { ErrorState } from "../ErrorState";
import { ProductForm } from "./ProductForm";

export function ProductList() {
  const productsQuery = useProductsQuery({ includeInactive: true });
  const deleteMutation = useDeleteProductMutation();

  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (productsQuery.isLoading) return <LoadingState />;
  if (productsQuery.isError) return <ErrorState />;

  const products = productsQuery.data?.data || [];
  const filteredProducts = products.filter((prod) =>
    prod.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleNew = () => {
    setSelectedProductId(null);
    setIsNew(true);
  };

  const handleEdit = (id: string) => {
    setSelectedProductId(id);
    setIsNew(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  if (isNew || selectedProductId) {
    return (
      <ProductForm
        productId={selectedProductId}
        isNew={isNew}
        onClose={() => {
          setIsNew(false);
          setSelectedProductId(null);
        }}
      />
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <TextField
          placeholder="Search products..."
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
                <TableCell>Image</TableCell>
                <TableCell>Product Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Qty on Hand</TableCell>
                <TableCell align="right">Sales Price</TableCell>
                <TableCell align="center">Published</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.map((prod) => (
                <TableRow key={prod.id} hover sx={{ cursor: "pointer" }}>
                  <TableCell onClick={() => handleEdit(prod.id)}>
                    <Avatar src={prod.image} variant="rounded" sx={{ width: 40, height: 40 }} />
                  </TableCell>
                  <TableCell onClick={() => handleEdit(prod.id)}>
                    <Typography variant="body2" fontWeight={500}>{prod.name}</Typography>
                  </TableCell>
                  <TableCell onClick={() => handleEdit(prod.id)}>
                    <Chip size="small" label={prod.type === "goods" ? "Goods" : "Service"} />
                  </TableCell>
                  <TableCell align="right" onClick={() => handleEdit(prod.id)}>
                    {prod.type === "goods" ? prod.qtyOnHand ?? 0 : "—"}
                  </TableCell>
                  <TableCell align="right" onClick={() => handleEdit(prod.id)}>
                    ${prod.salesPrice.toFixed(2)}
                  </TableCell>
                  <TableCell align="center" onClick={() => handleEdit(prod.id)}>
                    <Chip 
                      size="small" 
                      color={prod.published ? "success" : "default"} 
                      label={prod.published ? "Yes" : "No"} 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEdit(prod.id)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteId(prod.id); }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No products found.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Product?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this product? This action cannot be undone.
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
