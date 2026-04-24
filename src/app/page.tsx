"use client";

import { Shell } from "@/components/layout";
import { ModalProvider } from "@/components/ui";
import { useStore } from "@/store";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { ThreatIntelModule } from "@/components/threat-intel/ThreatIntelModule";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { AssessmentModule } from "@/components/assessment/AssessmentModule";
import { IRPlanner } from "@/components/irplanner/IRPlanner";
import { Commander } from "@/components/commander/Commander";
import { IncidentLog } from "@/components/commander/IncidentLog";
import { PlaybooksModule } from "@/components/playbooks/PlaybooksModule";
import { TabletopModule } from "@/components/tabletop/TabletopModule";
import { PenTestingModule } from "@/components/pentesting/PenTestingModule";
import { TicketsModule } from "@/components/tickets/TicketsModule";
import { TasksModule } from "@/components/tasks/TasksModule";
import { ForensicsModule } from "@/components/forensics/ForensicsModule";
import { StakeholdersModule } from "@/components/stakeholders/StakeholdersModule";
import { PoliciesModule } from "@/components/policies/PoliciesModule";
import { CommsModule } from "@/components/comms/CommsModule";
import { AccessModule } from "@/components/access/AccessModule";
import { IntegrationsModule } from "@/components/integrations/IntegrationsModule";
import { SettingsModule } from "@/components/settings/SettingsModule";

const modules: Record<string, React.ComponentType> = {
  dash: Dashboard,
  threatintel: ThreatIntelModule,
  onboard: Onboarding,
  assess: AssessmentModule,
  irplan: IRPlanner,
  commander: Commander,
  incidentlog: IncidentLog,
  playbooks: PlaybooksModule,
  tabletop: TabletopModule,
  pentesting: PenTestingModule,
  tickets: TicketsModule,
  tasks: TasksModule,
  forensics: ForensicsModule,
  stakeholders: StakeholdersModule,
  policies: PoliciesModule,
  comms: CommsModule,
  access: AccessModule,
  integrations: IntegrationsModule,
  settings: SettingsModule,
};

export default function Home() {
  const page = useStore((s) => s.page);
  const Module = modules[page] || Dashboard;

  return (
    <ModalProvider>
      <Shell>
        <Module />
      </Shell>
    </ModalProvider>
  );
}
