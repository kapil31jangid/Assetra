import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import SearchIcon from "@mui/icons-material/Search";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";

import { useUsersQuery } from "../../services/queries";
import type { UserProfile } from "../../services/api";
import { ProfileForm } from "./ProfileForm";
import { LoadingState } from "../LoadingState";
import { ErrorState } from "../ErrorState";

export function UsersList() {
  const [search, setSearch] = useState("");
  const usersQuery = useUsersQuery();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  if (usersQuery.isLoading) return <LoadingState />;
  if (usersQuery.isError) return <ErrorState />;

  const users = usersQuery.data?.data || [];
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setIsNewUser(false);
  };

  const handleNewUser = () => {
    setSelectedUser({
      id: "new",
      name: "",
      email: "",
      role: "vendor",
    });
    setIsNewUser(true);
  };

  const handleClose = () => {
    setSelectedUser(null);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <TextField
          placeholder="Search users..."
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
        <Button variant="contained" onClick={handleNewUser}>
          New User
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Avatar</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Company Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Avatar src={user.avatarUrl || ""}>
                      {user.name.charAt(0)}
                    </Avatar>
                  </TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.companyName || "-"}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      size="small"
                      color={
                        user.role === "admin"
                          ? "primary"
                          : user.role === "vendor"
                            ? "secondary"
                            : "default"
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleEdit(user)}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small">
                      <LockResetOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <BlockOutlinedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={Boolean(selectedUser)} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {isNewUser ? "Create New User" : `Edit User: ${selectedUser?.name}`}
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <ProfileForm user={selectedUser} isOwnProfile={false} />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
