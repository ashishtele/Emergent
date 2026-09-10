import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.next();
  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (k: string) => req.cookies.get(k)?.value,
        set: (k: string, v: string, o: any) => res.cookies.set(k, v, o),
        remove: (k: string, o: any) => res.cookies.set(k, "", o),
      },
    },
  );
  await supabase.auth.getUser();
  return res;
}

export const config = { matcher: ["/library", "/login", "/api/papers/:path*/save"] };
