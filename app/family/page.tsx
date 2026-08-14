import {redirect} from "next/navigation";
import {AppShell} from "@/components/app-shell";
import {FamilyCheckinForm} from "@/components/family-checkin-form";
import {createSupabaseAdmin} from "@/lib/supabase/admin";
import {createSupabaseServer} from "@/lib/supabase/server";

export default async function Family(){
  const supabase=await createSupabaseServer();
  if(!supabase)redirect("/login");
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)redirect("/login");

  const {data:memberRows}=await supabase.from("family_members").select("id,user_id,member_user_id,email,status,can_view_timeline,can_contribute").or(`user_id.eq.${user.id},member_user_id.eq.${user.id}`).order("created_at",{ascending:false});
  const members=memberRows??[];
  const owned=members.filter(x=>x.user_id===user.id);
  const joined=members.filter(x=>x.member_user_id===user.id&&x.user_id!==user.id&&x.status==="accepted");
  const joinedOwnerIds=[...new Set(joined.map(x=>x.user_id))];
  const timelineOwnerIds=joined.filter(x=>x.can_view_timeline).map(x=>x.user_id);

  const [checkinsResult,timelineResult,profilesResult]=await Promise.all([
    supabase.from("family_checkins").select("id,owner_id,author_id,visit_date,note,mood,walking,appetite").or(`owner_id.eq.${user.id},author_id.eq.${user.id}${joinedOwnerIds.length?`,owner_id.in.(${joinedOwnerIds.join(",")})`:""}`).order("visit_date",{ascending:false}).limit(100),
    timelineOwnerIds.length?supabase.from("timeline_events").select("id,user_id,category,title,description,occurred_at,source").in("user_id",timelineOwnerIds).order("occurred_at",{ascending:false}).limit(100):Promise.resolve({data:[]}),
    joinedOwnerIds.length?createSupabaseAdmin().from("profiles").select("user_id,full_name").in("user_id",joinedOwnerIds):Promise.resolve({data:[]}),
  ]);
  const checkins=checkinsResult.data??[],timeline=timelineResult.data??[];
  const names=new Map((profilesResult.data??[]).map(profile=>[profile.user_id,profile.full_name]));

  return <AppShell eyebrow="Collaborative journal" title="Family Circle" description="Visits and observations from the people trusted to support your care.">
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="border border-black/20 bg-[#faf9f5] p-5"><h2 className="font-semibold">Your care circle</h2>{owned.length?owned.map(x=><div key={x.id} className="mt-4 border-t border-black/10 pt-4"><p className="text-sm font-semibold">{x.email}</p><p className="mt-1 text-xs text-black/45">{x.status} · timeline {x.can_view_timeline?"on":"off"} · contributions {x.can_contribute?"on":"off"}</p></div>):<p className="mt-4 text-sm text-black/45">Invite family members from the dashboard.</p>}</section>
      <section className="border border-black/20 bg-[#faf9f5] p-5"><h2 className="font-semibold">Circles you support</h2>{joined.length?joined.map(circle=><div key={circle.id} className="mt-4 border-t border-black/10 pt-4"><p className="text-sm font-semibold">Supporting {names.get(circle.user_id)??"your family member"}</p><p className="mt-1 text-xs text-black/45">Timeline {circle.can_view_timeline?"shared":"private"} · contributions {circle.can_contribute?"allowed":"view only"}</p></div>):<p className="mt-4 text-sm text-black/45">No shared circles yet.</p>}</section>
    </div>

    {joined.map(circle=>circle.can_contribute?<div key={circle.id} className="mt-6"><FamilyCheckinForm ownerId={circle.user_id} ownerName={names.get(circle.user_id)??"your family member"}/></div>:<section key={circle.id} className="mt-6 border border-black/20 bg-[#faf9f5] p-5"><h2 className="font-semibold">Supporting {names.get(circle.user_id)??"your family member"}</h2><p className="mt-2 text-sm text-black/50">You have view-only access to this circle.</p></section>)}

    {joined.filter(circle=>circle.can_view_timeline).map(circle=>{const events=timeline.filter(event=>event.user_id===circle.user_id);return <section key={circle.id} className="mt-6 border border-black/20 bg-[#faf9f5]"><header className="border-b border-black/15 p-5"><p className="text-xs font-semibold uppercase tracking-[.12em] text-black/40">Shared with you</p><h2 className="mt-1 font-semibold">{names.get(circle.user_id)??"Family"}’s timeline</h2></header>{events.length?events.map(event=><article key={event.id} className="border-b border-black/10 p-5"><p className="text-xs uppercase text-black/40">{new Date(event.occurred_at).toLocaleDateString()} · {event.category}</p><h3 className="mt-2 text-sm font-semibold">{event.title}</h3><p className="mt-1 text-sm text-black/55">{event.description}</p></article>):<p className="p-8 text-sm text-black/45">No timeline events have been shared yet.</p>}</section>})}

    <section className="mt-6 border border-black/20 bg-[#faf9f5]"><h2 className="border-b border-black/15 p-5 font-semibold">Family journal</h2>{checkins.length?checkins.map(entry=><article key={entry.id} className="border-b border-black/10 p-5"><p className="text-xs uppercase text-black/40">{new Date(`${entry.visit_date}T00:00:00`).toLocaleDateString()} · {entry.author_id===user.id?"You":"Family"}</p><p className="mt-3 text-sm">{entry.note}</p><p className="mt-2 text-xs text-black/45">Mood: {entry.mood??"—"} · Walking: {entry.walking??"—"} · Appetite: {entry.appetite??"—"}</p></article>):<p className="p-8 text-sm text-black/45">No family check-ins yet.</p>}</section>
  </AppShell>;
}
