import {NextResponse} from "next/server";export function GET(){return NextResponse.json({status:"ok",service:"lifelens",timestamp:new Date().toISOString()})}
