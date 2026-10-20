import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { UserRole } from "@prisma/client";
import { CreateUserForm } from "./create-user-form";

export const metadata: Metadata = { title: "Create User" };

export default async function CreateUserPage() {
  const session = await auth();
  
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    redirect("/"); // Redirect non-admins
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Create User</h2>
      </div>
      <div className="mx-auto max-w-2xl mt-8">
        <CreateUserForm />
      </div>
    </div>
  );
}
