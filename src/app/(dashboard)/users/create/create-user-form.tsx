"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createUserAction, type ActionResponse } from "@/server/actions/user";
import { useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          Creating...
        </>
      ) : (
        "Create"
      )}
    </Button>
  );
}

const initialState: ActionResponse = { success: false, errors: {} };

export function CreateUserForm() {
  const [state, formAction] = useActionState(async (prevState: ActionResponse, formData: FormData) => {
    return await createUserAction(formData);
  }, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.push("/users"); // Or wherever the user list is
      router.refresh();
    }
  }, [state?.success, router]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-center mb-4">
          <div className="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-xl text-lg font-semibold">
            UF
          </div>
        </div>
        <CardTitle>Create User</CardTitle>
        <CardDescription>Add a new user to the system.</CardDescription>
      </CardHeader>
      <form action={formAction} id="create-user-form" className="space-y-4" noValidate>
        <CardContent className="space-y-4">
          {state?.errors?.form ? (
            <div
              role="alert"
              className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-md border p-3 text-sm"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{state.errors.form[0]}</span>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              aria-invalid={state?.errors?.name ? true : undefined}
              aria-describedby={state?.errors?.name ? "name-error" : undefined}
              required
            />
            {state?.errors?.name ? (
              <p id="name-error" className="text-destructive text-xs">
                {state.errors.name[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="loginId">Login id</Label>
            <Input
              id="loginId"
              name="loginId"
              type="text"
              aria-invalid={state?.errors?.loginId ? true : undefined}
              aria-describedby={state?.errors?.loginId ? "loginId-error" : undefined}
              required
            />
            {state?.errors?.loginId ? (
              <p id="loginId-error" className="text-destructive text-xs">
                {state.errors.loginId[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail id</Label>
            <Input
              id="email"
              name="email"
              type="email"
              aria-invalid={state?.errors?.email ? true : undefined}
              aria-describedby={state?.errors?.email ? "email-error" : undefined}
              required
            />
            {state?.errors?.email ? (
              <p id="email-error" className="text-destructive text-xs">
                {state.errors.email[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-3 pt-2">
            <Label>Role</Label>
            <RadioGroup defaultValue={UserRole.CONTACT} name="role" className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={UserRole.CONTACT} id="r1" />
                <Label htmlFor="r1" className="font-normal">User (Portal)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={UserRole.ACCOUNTANT} id="r2" />
                <Label htmlFor="r2" className="font-normal">Accountant</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={UserRole.ADMIN} id="r3" />
                <Label htmlFor="r3" className="font-normal">Administrator</Label>
              </div>
            </RadioGroup>
            {state?.errors?.role ? (
              <p id="role-error" className="text-destructive text-xs">
                {state.errors.role[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 pt-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              aria-invalid={state?.errors?.password ? true : undefined}
              aria-describedby={state?.errors?.password ? "password-error" : undefined}
              required
            />
            {state?.errors?.password ? (
              <p id="password-error" className="text-destructive text-xs">
                {state.errors.password[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Re-Enter Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              aria-invalid={state?.errors?.confirmPassword ? true : undefined}
              aria-describedby={state?.errors?.confirmPassword ? "confirmPassword-error" : undefined}
              required
            />
            {state?.errors?.confirmPassword ? (
              <p id="confirmPassword-error" className="text-destructive text-xs">
                {state.errors.confirmPassword[0]}
              </p>
            ) : null}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
