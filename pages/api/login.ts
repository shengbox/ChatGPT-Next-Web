import { withIronSessionApiRoute } from "iron-session/next";

declare module "iron-session" {
  interface IronSessionData {
    user?: any;
  }
}

export async function getAccessToken(code: string) {
  const redirectURI = process.env.REDIRECT_URI
  const formData = new URLSearchParams();
  formData.append("grant_type", "authorization_code");
  formData.append("client_id", "63bcd2b116e69473bd0d98a3");
  formData.append("client_secret", "999999");
  formData.append("scope", "read");
  formData.append("redirect_uri", redirectURI + "/api/login");
  formData.append("code", code);
  const response = await fetch(process.env.OAUTH2_SERVER + "/oauth2/token", {
    method: "POST",
    body: formData,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
  const data = await response.json();
  return await data.access_token;
}

export default withIronSessionApiRoute(
  async function loginRoute(req: any, res) {
    const { code } = req.query;
    console.log("login code:", code);

    if (code) {
      const token = await getAccessToken(code);
      req.session.user = { token: token };
      await req.session.save();
      res.setHeader("Location", process.env.REDIRECT_URI!);
      res.statusCode = 302;
      res.end();
    } else {
      res.json({})
      res.end();
    }
  },
  {
    cookieName: "gptcookie",
    password: "complex_password_at_least_32_characters_long",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600 * 12
    },
  },
);
