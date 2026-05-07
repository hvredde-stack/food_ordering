import { redirect } from "next/navigation";
import { getActiveSession } from "@/lib/session";
import { FeedbackForm } from "./feedback-form";

export default async function FeedbackPage() {
  const session = await getActiveSession();
  if (!session) redirect("/");
  return <FeedbackForm />;
}
