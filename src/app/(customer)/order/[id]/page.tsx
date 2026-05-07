// Legacy per-order tracker URL — superseded by the shared /session view.
// Kept as a redirect so any bookmark / cached link still works.

import { redirect } from "next/navigation";

export default function LegacyOrderRedirect() {
  redirect("/session");
}
