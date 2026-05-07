import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <SignUp signInUrl="/admin/sign-in" />
    </div>
  );
}
