import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { nombre, email, password } = (body ?? {}) as Record<string, unknown>;

  if (typeof nombre !== "string" || nombre.trim().length === 0) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }
  if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "El email no es válido" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 8 caracteres" },
      { status: 400 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const usuario = await prisma.usuario.create({
      data: {
        nombre: nombre.trim(),
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ id: usuario.id, email: usuario.email }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Ese email ya está registrado" }, { status: 409 });
    }
    throw error;
  }
}
