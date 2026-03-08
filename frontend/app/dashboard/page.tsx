// import { PuneDashboard } from "@/components/pune_dashboard/pune-dashboard";
// import { Sidebar, SidebarBody } from "@/components/ui/sidebar";

// export default function DashboardPage() {
//   return (
//     <Sidebar>
//       <div className="flex h-screen w-full">
//         <SidebarBody className="border-r border-neutral-200 dark:border-neutral-800">
//           {/* Sidebar content to be added later */}
//         </SidebarBody>

//         <main className="min-w-0 flex-1 overflow-y-auto">
//           <PuneDashboard />
//         </main>
//       </div>
//     </Sidebar>
//   );
// }
"use client";

import { PuneDashboard } from "@/components/pune_dashboard/pune-dashboard";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconAlertTriangle,
  IconNetwork,
  IconDeviceDesktopAnalytics,
} from "@tabler/icons-react";

const navLinks = [
  {
    label: "Incident Detection",
    href: "/incident-detection",
    icon: (
      <IconAlertTriangle className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />
    ),
  },
  {
    label: "Events Orchestration",
    href: "/events-orchestration",
    icon: (
      <IconNetwork className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />
    ),
  },
  {
    label: "ATCS",
    href: "/atcs",
    icon: (
      <IconDeviceDesktopAnalytics className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />
    ),
  },
];

export default function DashboardPage() {
  return (
    <Sidebar>
      <div className="flex h-screen w-full">
        <SidebarBody className="border-r border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mt-8 flex flex-col gap-2">
              {navLinks.map((link) => (
                <SidebarLink key={link.href} link={link} />
              ))}
            </div>
          </div>
        </SidebarBody>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <PuneDashboard />
        </main>
      </div>
    </Sidebar>
  );
}
