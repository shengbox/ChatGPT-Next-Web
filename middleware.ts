import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session/edge";
import md5 from "spark-md5";

export const config = {
  matcher: ["/api/openai", "/api/chat-stream", "/api/openai/v1/chat/completions", "/"],
};

async function checkToken(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession(req, res, {
    cookieName: "gptcookie",
    password: "complex_password_at_least_32_characters_long",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
    },
  });
  const { user } = session;
  return !!user
}

export async function middleware(req: NextRequest) {
  const login = await checkToken(req)
  if (!login) {
    const hostname = req.nextUrl;
    console.log(`当前域名为：${hostname}`);
    const oauth = process.env.OAUTH2_SERVER + "/oauth2/authorize"
    const clientId = "63bcd2b116e69473bd0d98a3"
    const redirectURI = process.env.REDIRECT_URI + "/api/login"
    return NextResponse.redirect(`${oauth}?client_id=${clientId}&scope=read&response_type=code&redirect_uri=${redirectURI}&state=1`, 302)
  }

  const accessCode = req.headers.get("access-code");
  const token = req.headers.get("token");
  const hashedCode = md5.hash(accessCode ?? "").trim();

  console.log("[Auth] got access code:", accessCode);
  console.log("[Auth] hashed access code:", hashedCode);

  return NextResponse.next({
    request: {
      headers: req.headers,
    },
  });
}
