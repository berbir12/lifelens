import {LoginForm} from "@/components/login-form";
import {InvitationLoginForm} from "@/components/invitation-login-form";
import {safeReturnPath} from "@/lib/family-invitations";

export default async function Login({searchParams}:{searchParams:Promise<{next?:string}>}){const params=await searchParams;const next=safeReturnPath(params.next,"/onboarding");return next.startsWith("/family/invite/")?<InvitationLoginForm next={next}/>:<LoginForm/>}
