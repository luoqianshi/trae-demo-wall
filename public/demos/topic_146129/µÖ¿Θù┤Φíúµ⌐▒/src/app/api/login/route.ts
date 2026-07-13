import { NextResponse } from "next/server";

const SESSION_TOKEN_COOKIE = "wardrobe_session";

export async function POST(request: Request) {
  const accessCode = process.env.APP_ACCESS_CODE;
  const sessionToken = process.env.WARDROBE_SESSION_TOKEN;
  
  if (!accessCode || accessCode === "change-me") {
    return NextResponse.json({ success: true });
  }

  if (!sessionToken) {
    return NextResponse.json({ success: false, error: "服务器未配置会话密钥" }, { status: 500 });
  }

  const { code } = await request.json();
  
  if (code === accessCode) {
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_TOKEN_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });
    return response;
  }

  return NextResponse.json({ success: false }, { status: 401 });
}

export async function GET() {
  return NextResponse.json({ message: "请使用 POST 方法登录" }, { status: 405 });
}