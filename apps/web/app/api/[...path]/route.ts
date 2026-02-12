import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://test-app-production-9e21.up.railway.app";

async function getPath(ctx: any): Promise<string> {
  // Next 16 может дать params как Promise
  const params = await ctx?.params;
  const arr = params?.path ?? [];
  return Array.isArray(arr) ? arr.join("/") : String(arr);
}

async function forward(req: NextRequest, ctx: any) {
  const path = await getPath(ctx);
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

export async function GET(req: NextRequest, ctx: any) {
  return forward(req, ctx);
}
export async function POST(req: NextRequest, ctx: any) {
  return forward(req, ctx);
}
export async function PUT(req: NextRequest, ctx: any) {
  return forward(req, ctx);
}
export async function PATCH(req: NextRequest, ctx: any) {
  return forward(req, ctx);
}
export async function DELETE(req: NextRequest, ctx: any) {
  return forward(req, ctx);
}
