import { DashboardLayout } from "@/components/DashboardLayout";
import { ApiSetupGuide } from "@/components/ApiSetupGuide";

export default function ApiSetup() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <ApiSetupGuide />
      </div>
    </DashboardLayout>
  );
}