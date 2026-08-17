import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code = "request_failed") {
    super(message);
  }
}

export function apiErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ error: { code: "invalid_input", message: "Revise os campos informados.", fields: error.flatten().fieldErrors } }, { status: 400 });
  }
  // Não enviar detalhes internos, dados ou segredos ao cliente.
  return NextResponse.json({ error: { code: "internal_error", message: "Não foi possível concluir esta ação." } }, { status: 500 });
}
