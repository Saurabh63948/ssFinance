// middleware.js
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request) {
  const token = request.cookies.get("auth-token")?.value;
  const pathname = request.nextUrl.pathname;

  // Allow login page always
  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  // If no token → redirect to login
  if (!token) {
    console.log("token nhi hai ")
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "vitta_lekha_key"
    );

    const { payload } = await jwtVerify(token, secret);

    const role = payload.role?.trim().toUpperCase();

    // ADMIN trying to access user routes
    if (pathname.startsWith("/user") && role !== "USER") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    // USER trying to access admin routes
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/user/dashboard", request.url));
    }

    return NextResponse.next();

  } catch (error) {
    // invalid token
    const response = NextResponse.redirect(new URL("/login", request.url));

    // remove bad cookie
    response.cookies.delete("auth-token");

    return response;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/user/:path*"],
};