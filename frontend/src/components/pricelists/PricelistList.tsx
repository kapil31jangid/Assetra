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
import Alert from "@mui/material/Alert";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";

import { usePricelistsQuery, useDeletePricelistMutation } from "../../services/queries";
import { LoadingState } from "../LoadingState";
import { ErrorState } from "../ErrorState";
import { PricelistForm } from "./PricelistForm";

export function PricelistList() {
  const pricelistsQuery = usePricelistsQuery();
  const deleteMutation = useDeletePricelistMutation();

  const [search, setSearch] = useState("");
  const [selectedPricelistId, setSelectedPricelistId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (pricelistsQuery.isLoading) return <LoadingState />;
  if (pricelistsQuery.isError) return <ErrorState />;

  const pricelists = pricelistsQuery.data?.data || [];
  const filteredPricelists = pricelists.filter((pl) =>
    pl.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleNew = () => {
    setSelectedPricelistId(null);
    setIsNew(true);
  };

  const handleEdit = (id: string) => {
    setSelectedPricelistId(id);
    setIsNew(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  if (isNew || selectedPricelistId) {
    return (
      <PricelistForm
        pricelistId={selectedPricelistId}
        isNew={isNew}
        onClose={() => {
          setIsNew(false);
          setSelectedPricelistId(null);
        }}
      />
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <TextField
          placeholder="Search pricelists..."
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
                <TableCell>Pricelist Name</TableCell>
                <TableCell align="center">Default</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPricelists.map((pl) => (
                <TableRow key={pl.id} hover sx={{ cursor: "pointer" }}>
                  <TableCell onClick={() => handleEdit(pl.id)}>
                    <Typography variant="body2" fontWeight={500}>{pl.name}</Typography>
                  </TableCell>
                  <TableCell align="center" onClick={() => handleEdit(pl.id)}>
                    {pl.isDefault ? <Chip size="small" label="Default" color="primary" /> : "—"}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEdit(pl.id)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => { e.stopPropagation(); setDeleteId(pl.id); }}
                      disabled={pl.isDefault}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPricelists.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No pricelists found.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Pricelist?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this pricelist? This action cannot be undone.
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
