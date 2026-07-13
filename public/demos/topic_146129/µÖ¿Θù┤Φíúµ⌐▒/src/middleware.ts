import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_TOKEN_COOKIE = "wardrobe_session";

export function middleware(request: NextRequest) {
  const accessCode = process.env.APP_ACCESS_CODE;
  
  if (!accessCode || accessCode === "change-me") {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(SESSION_TOKEN_COOKIE)?.value;
  
  if (sessionToken && isValidSessionToken(sessionToken)) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/login")) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  
  return NextResponse.redirect(loginUrl);
}

function isValidSessionToken(token: string): boolean {
  const expectedToken = process.env.WARDROBE_SESSION_TOKEN;
  return expectedToken !== undefined && token === expectedToken;
}