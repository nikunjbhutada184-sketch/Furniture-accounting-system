"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type SignInState, signInAction } from "@/modules/auth/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden />
          Signing in...
        </>
      ) : (
        "Sign in"
      )}
    </Button>
  );
}

export function LoginForm({
  callbackUrl,
  justRegistered,
}: {
  callbackUrl?: string;
  justRegistered?: boolean;
}) {
  const [state, formAction] = useActionState<SignInState, FormData>(signInAction, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          {justRegistered
            ? "Account created successfully! Please sign in to continue."
            : "Enter your credentials to continue."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />

          {state.error ? (
            <div
              role="alert"
              className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-md border p-3 text-sm"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{state.error}</span>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="loginId">Login Id -</Label>
            <Input
              id="loginId"
              name="loginId"
              type="text"
              autoComplete="username"
              placeholder="Enter your Login Id"
              aria-invalid={state.fieldErrors?.loginId ? true : undefined}
              aria-describedby={state.fieldErrors?.loginId ? "loginId-error" : undefined}
              required
            />
            {state.fieldErrors?.loginId ? (
              <p id="loginId-error" className="text-destructive text-xs">
                {state.fieldErrors.loginId}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password -</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={state.fieldErrors?.password ? true : undefined}
              aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
              required
            />
            {state.fieldErrors?.password ? (
              <p id="password-error" className="text-destructive text-xs">
                {state.fieldErrors.password}
              </p>
            ) : null}
          </div>

          <SubmitButton />

          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mt-4">
            <a href="/forgot-password" className="hover:underline">Forgot Password</a>
            <span>|</span>
            <a href="/signup" className="hover:underline">Sign Up</a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
