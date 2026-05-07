import { OnboardForm } from "./onboard-form";

export default function NewRestaurantPage() {
  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Onboard restaurant</h1>
      <p className="text-sm text-muted mt-1">
        The owner must already have a Clerk account (have them sign up at <code className="text-xs px-1 py-0.5 rounded bg-muted">/admin/sign-up</code> first).
        Then enter their email below to link them.
      </p>
      <OnboardForm />
    </div>
  );
}
