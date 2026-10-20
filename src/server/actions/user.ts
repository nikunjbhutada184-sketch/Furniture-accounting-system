"use server";

import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { auth } from "@/server/auth";

export type ActionResponse = {
  success: boolean;
  errors?: Record<string, string[] | undefined>;
};

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");

const signUpSchema = z
  .object({
    loginId: z.string().min(6).max(12),
    email: z.string().email(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function signUpAction(formData: FormData): Promise<ActionResponse> {
  const data = Object.fromEntries(formData.entries());
  const parsed = signUpSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { loginId, email, password } = parsed.data;

  // Check unique constraints
  const existingLoginId = await prisma.user.findUnique({ where: { loginId } });
  if (existingLoginId) {
    return { success: false, errors: { loginId: ["Login ID is already taken"] } };
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return { success: false, errors: { email: ["Email is already registered"] } };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: {
        name: loginId, // Fallback to loginId for name since it's not in signup form
        loginId,
        email,
        passwordHash,
        role: UserRole.ACCOUNTANT,
      },
    });
    return { success: true };
  } catch {
    return { success: false, errors: { form: ["An unexpected error occurred."] } };
  }
}

const createUserSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    loginId: z.string().min(6).max(12),
    email: z.string().email(),
    role: z.nativeEnum(UserRole),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function createUserAction(formData: FormData): Promise<ActionResponse> {
  // Check authorization
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return { success: false, errors: { form: ["Unauthorized"] } };
  }

  const data = Object.fromEntries(formData.entries());
  const parsed = createUserSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { name, loginId, email, role, password } = parsed.data;

  // Check unique constraints
  const existingLoginId = await prisma.user.findUnique({ where: { loginId } });
  if (existingLoginId) {
    return { success: false, errors: { loginId: ["Login ID is already taken"] } };
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return { success: false, errors: { email: ["Email is already registered"] } };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: {
        name,
        loginId,
        email,
        passwordHash,
        role,
      },
    });
    return { success: true };
  } catch {
    return { success: false, errors: { form: ["An unexpected error occurred."] } };
  }
}
