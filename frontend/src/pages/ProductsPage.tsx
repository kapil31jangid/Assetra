import { useState } from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import { PageHeader } from "../components/PageHeader";
import { CategoryManager } from "../components/CategoryManager";
import { AttributeManager } from "../components/attributes/AttributeManager";
import { ProductList } from "../components/products/ProductList";

import { PricelistList } from "../components/pricelists/PricelistList";
import { QuotationTemplateList } from "../components/quotation-templates/QuotationTemplateList";

export function ProductsPage() {
  const [tab, setTab] = useState(0);

  return (
    <>
      <PageHeader
        description="Manage your product catalog, variants, and configurations."
        title="Products"
      />

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs onChange={(_, v) => setTab(v)} value={tab} variant="scrollable">
          <Tab label="Products" />
          <Tab label="Categories" />
          <Tab label="Attributes" />
          <Tab label="Pricelists" />
          <Tab label="Quotation Templates" />
        </Tabs>
      </Box>

      {tab === 0 && <ProductList />}
      {tab === 1 && <CategoryManager />}
      {tab === 2 && <AttributeManager />}
      {tab === 3 && <PricelistList />}
      {tab === 4 && <QuotationTemplateList />}
    </>
  );
}
