import {NextRequest,NextResponse} from "next/server";
export function GET(request:NextRequest){const reference=request.nextUrl.searchParams.get("trx_ref")??request.nextUrl.searchParams.get("tx_ref")??"";const url=new URL("/billing/return",request.url);if(reference)url.searchParams.set("tx_ref",reference);return NextResponse.redirect(url)}
