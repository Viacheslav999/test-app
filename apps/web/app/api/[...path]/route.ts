import { NextResponse } from "next/server";

const BACKEND = "https://test-app-production-9e21.up.railway.app";

type Ctx = { params: { path: string[] } };

async function forward(req: Request, ctx: Ctx) {
  const path = (ctx?.params?.path ?? []).join("/");
  const url = new URL(req.url);

  const target = `${BACKEND}/${path}${url.search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("origin");

  const init: RequestInit = {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer(),
  };

  const r = await fetch(target, init);
  return new NextResponse(r.body, { status: r.status, headers: r.headers });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(req: Request, ctx: Ctx) {
  return forward(req, ctx);
}
export async function POST(req: Request, ctx: Ctx) {
  return forward(req, ctx);
}
export async function PUT(req: Request, ctx: Ctx) {
  return forward(req, ctx);
}
export async function PATCH(req: Request, ctx: Ctx) {
  return forward(req, ctx);
}
export async function DELETE(req: Request, ctx: Ctx) {
  return forward(req, ctx);
}
