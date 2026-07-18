import { useState } from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { Navigate } from "react-router-dom";

import { PageHeader } from "../components/PageHeader";
import { useSessionQuery } from "../services/queries";
import { getRoleHomeRoute } from "../utils/auth";
import { ProfileForm } from "../components/settings/ProfileForm";
import { UsersList } from "../components/settings/UsersList";
import { PickupReturnSettings } from "../components/settings/PickupReturnSettings";

export function SettingsPage() {
  const session = useSessionQuery();
  const user = session.data?.data?.user;
  const [activeTab, setActiveTab] = useState(0);

  if (!user) return null;
  if (user.role === "customer") return <Navigate replace to={getRoleHomeRoute(user.role)} />;

  const isAdmin = user.role === "admin";

  const tabs = [
    { label: "Profile", component: <ProfileForm user={user} isOwnProfile={true} /> },
    ...(isAdmin ? [{ label: "Users", component: <UsersList /> }] : []),
    ...(isAdmin ? [{ label: "Pickup & Return Rules", component: <PickupReturnSettings /> }] : []),
  ];

  return (
    <>
      <PageHeader
        description="Manage your account, users, and organization preferences."
        title="Settings"
      />
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          {tabs.map((tab, idx) => (
            <Tab key={idx} label={tab.label} />
          ))}
        </Tabs>
      </Box>
      <Box>
        {tabs[activeTab]?.component}
      </Box>
    </>
  );
}
