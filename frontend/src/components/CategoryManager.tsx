import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from "../services/queries";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";

export function CategoryManager() {
  const categories = useCategoriesQuery();
  const create = useCreateCategoryMutation();
  const update = useUpdateCategoryMutation();
  const remove = useDeleteCategoryMutation();
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  if (categories.isLoading) return <LoadingState />;
  if (categories.isError) return <ErrorState />;

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (editingId) await update.mutateAsync({ id: editingId, request: { name: trimmed, slug } });
    else await create.mutateAsync({ name: trimmed, slug });
    setName("");
    setEditingId(null);
  };

  return (
    <Stack gap={2}>
      <Card>
        <CardContent>
          <Stack direction="row" gap={2}>
            <TextField
              fullWidth
              label="Category name"
              size="small"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Button variant="contained" onClick={save} disabled={!name.trim()}>
              {editingId ? "Update" : "Add"}
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Stack gap={1}>
            {(categories.data?.data ?? []).map((category) => (
              <Box key={category.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography>{category.name}</Typography>
                <Stack direction="row">
                  <IconButton onClick={() => { setEditingId(category.id); setName(category.name); }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton color="error" onClick={() => remove.mutate(category.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
