import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

import { PageHeader } from "../components/PageHeader";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <>
      <PageHeader description={description} title={title} />
      <Card>
        <CardContent>
          <Typography color="text.secondary" variant="body2">
            This screen is wired into navigation and ready for feature work in
            the next phases.
          </Typography>
        </CardContent>
      </Card>
    </>
  );
}
