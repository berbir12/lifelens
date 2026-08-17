import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {PublicHelpBoard,type PublicHelpBoardData} from "@/components/public-help-board";
import {helpSlugSchema} from "@/lib/help-circle";
import {createSupabasePublic} from "@/lib/supabase/public";

export const dynamic="force-dynamic";
type Props={params:Promise<{slug:string}>};
async function getBoard(slug:string){const supabase=createSupabasePublic();if(!supabase)return null;const {data,error}=await supabase.rpc("public_help_board",{board_slug:slug});return error||!data?null:data as PublicHelpBoardData}
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params;if(!helpSlugSchema.safeParse(slug).success)return {title:"Help board unavailable | LifeLens"};const board=await getBoard(slug);return {title:board?`${board.label} | LifeLens Help Circle`:"Help board unavailable | LifeLens",description:"A shared task board. No account needed.",robots:{index:false,follow:false}}}
export default async function HelpBoardPage({params}:Props){const {slug}=await params;if(!helpSlugSchema.safeParse(slug).success)notFound();const board=await getBoard(slug);if(!board)notFound();return <PublicHelpBoard initialBoard={board}/>}
