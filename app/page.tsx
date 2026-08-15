import Link from "next/link";
import {ArrowUpRight,Check,ChevronRight,FileText,LockKeyhole,Mic,Search} from "lucide-react";

const steps=[
  ["01","Add what you already have","Store visit notes, lab reports, discharge papers, and medication lists alongside your manual health timeline."],
  ["02","Add the days between visits","Record a short check-in when something feels worth remembering: sleep, appetite, energy, pain, mood, or mobility."],
  ["03","Retrieve, don’t recall","Search your timeline by words and phrases, view events in order, or print a concise history for an appointment."],
] as const;

export default function Landing(){return <main className="min-h-screen bg-[#f4f2ec] font-sans text-[#182019] selection:bg-[#d5dccf]">
  <header className="border-b border-[#182019]/20">
    <div className="mx-auto flex h-16 max-w-[1440px] items-center px-5 md:px-10">
      <Link href="/" className="text-lg font-bold tracking-[-.04em]">LifeLens</Link>
      <span className="ml-3 hidden border-l border-[#182019]/20 pl-3 text-xs text-[#182019]/50 sm:block">A personal health record</span>
      <nav className="ml-auto hidden items-center gap-7 text-sm md:flex"><a href="#product">Product</a><a href="#principles">Principles</a><a href="#pricing">Pricing</a><a href="#security">Security</a></nav>
      <Link href="/login" className="ml-7 flex h-9 items-center gap-2 border border-[#182019] px-4 text-sm font-medium hover:bg-[#182019] hover:text-white">Sign in <ArrowUpRight size={14}/></Link>
    </div>
  </header>

  <section className="mx-auto grid max-w-[1440px] border-x border-[#182019]/20 lg:grid-cols-12">
    <div className="border-b border-[#182019]/20 px-5 py-20 md:px-10 md:py-28 lg:col-span-8 lg:border-r">
      <p className="mb-10 max-w-sm text-sm leading-6 text-[#182019]/55">Health information accumulates over years. Most of it ends up in portals, folders, inboxes, and memory.</p>
      <h1 className="max-w-4xl text-[clamp(3rem,7vw,7.5rem)] font-medium leading-[.9] tracking-[-.075em]">Remember your health history.</h1>
    </div>
    <div className="flex flex-col justify-between border-b border-[#182019]/20 lg:col-span-4">
      <div className="px-5 py-10 md:px-10 lg:py-12"><p className="max-w-md text-lg leading-8">LifeLens keeps medical documents and personal check-ins in one chronological record, so you can find what happened without reconstructing it from scratch.</p></div>
      <div className="border-t border-[#182019]/20 p-5 md:p-10"><Link href="/login" className="flex w-full items-center justify-between bg-[#23392c] px-5 py-4 text-sm font-semibold text-white hover:bg-[#18291f]">Create your record <ChevronRight size={17}/></Link><p className="mt-4 text-xs leading-5 text-[#182019]/45">LifeLens does not diagnose conditions or recommend treatment.</p></div>
    </div>
  </section>

  <section id="product" className="mx-auto max-w-[1440px] border-x border-b border-[#182019]/20 px-5 py-16 md:px-10 md:py-24">
    <div className="mb-10 flex items-end justify-between border-b border-[#182019]/20 pb-5"><div><p className="text-xs font-semibold uppercase tracking-[.16em]">The record</p><h2 className="mt-2 text-2xl font-medium tracking-[-.03em]">One view of what happened and when.</h2></div><span className="hidden text-xs text-[#182019]/45 md:block">Example interface · information shown is illustrative</span></div>
    <div className="grid min-h-[560px] border border-[#182019]/30 bg-[#faf9f5] lg:grid-cols-[220px_1fr_310px]">
      <aside className="hidden border-r border-[#182019]/15 p-5 lg:block"><b className="text-sm">LifeLens</b><div className="mt-10 space-y-1 text-sm">{["Overview","Timeline","Documents","Check-ins","Medications","Family"].map((x,i)=><div key={x} className={`px-3 py-2 ${i===1?'bg-[#e5e8df] font-medium':'text-[#182019]/50'}`}>{x}</div>)}</div><div className="mt-12 border-t border-[#182019]/15 pt-4 text-xs leading-5 text-[#182019]/45"><LockKeyhole size={14} className="mb-2"/>Private record<br/>Sharing off</div></aside>
      <div className="p-5 md:p-8"><div className="flex items-center justify-between"><div><p className="text-xs text-[#182019]/45">MARGARET REED</p><h3 className="mt-1 text-2xl font-medium tracking-[-.03em]">Health timeline</h3></div><button aria-label="Search records" className="border border-[#182019]/20 p-2.5"><Search size={17}/></button></div><div className="mt-10 border-l border-[#182019]/25 pl-6">{[
        ["18 MAY 2026","Annual wellness blood panel","Westfield Clinic · Laboratory report","DOCUMENT"],
        ["14 MAY 2026","Reported more restful sleep","4 of 7 recent check-ins mentioned sleeping well","CHECK-IN"],
        ["04 MAR 2026","Cardiology follow-up","Visit note from Dr. A. Patel","DOCUMENT"],
        ["12 FEB 2026","Medication list updated","Vitamin D · 1000 IU · Evening","RECORD"],
      ].map(([date,title,detail,type])=><div key={title} className="relative border-b border-[#182019]/12 py-5 first:pt-0"><span className="absolute -left-[29px] top-6 h-2.5 w-2.5 border border-[#182019]/60 bg-[#faf9f5] first:top-1"/><div className="flex flex-wrap items-baseline justify-between gap-2"><p className="text-xs font-semibold tracking-[.08em]">{date}</p><span className="text-[10px] tracking-[.12em] text-[#182019]/40">{type}</span></div><p className="mt-2 text-base font-medium">{title}</p><p className="mt-1 text-sm text-[#182019]/45">{detail}</p></div>)}</div></div>
      <aside className="border-t border-[#182019]/15 p-6 lg:border-l lg:border-t-0"><p className="text-xs font-semibold uppercase tracking-[.12em]">Weekly note</p><p className="mt-6 text-xl font-medium leading-7 tracking-[-.02em]">Your recent entries describe a consistent walking routine.</p><p className="mt-4 text-sm leading-6 text-[#182019]/50">Energy was lower on Wednesday and returned to your usual range later in the week.</p><div className="mt-8 border-t border-[#182019]/15 pt-4 text-xs leading-5 text-[#182019]/45">Based on 6 check-ins<br/>May 12–18, 2026</div></aside>
    </div>
  </section>

  <section className="mx-auto max-w-[1440px] border-x border-b border-[#182019]/20">
    <div className="grid lg:grid-cols-3">{steps.map(([n,title,body],i)=><article key={n} className={`min-h-72 p-6 md:p-10 ${i<2?'border-b border-[#182019]/20 lg:border-b-0 lg:border-r':''}`}><span className="font-mono text-xs text-[#182019]/40">{n}</span><h3 className="mt-16 text-xl font-medium tracking-[-.025em]">{title}</h3><p className="mt-4 max-w-sm text-sm leading-6 text-[#182019]/52">{body}</p></article>)}</div>
  </section>

  <section id="principles" className="mx-auto grid max-w-[1440px] border-x border-b border-[#182019]/20 lg:grid-cols-2">
    <div className="border-b border-[#182019]/20 p-6 md:p-10 lg:border-b-0 lg:border-r"><p className="text-xs font-semibold uppercase tracking-[.16em]">What it will not do</p><h2 className="mt-14 max-w-xl text-4xl font-medium leading-tight tracking-[-.05em] md:text-5xl">No diagnosis.<br/>No treatment advice.<br/>No invented certainty.</h2></div>
    <div className="divide-y divide-[#182019]/15">{[
      ["You control the record","Timeline events come from entries you and permitted family members create."],
      ["Files stay intact","Uploaded documents remain private files and are not automatically interpreted."],
      ["Clear medical boundary","LifeLens organizes information without medical conclusions."],
    ].map(([title,body])=><div key={title} className="grid gap-3 p-6 md:grid-cols-[180px_1fr] md:p-10"><p className="flex items-start gap-2 text-sm font-medium"><Check size={15} className="mt-0.5"/>{title}</p><p className="text-sm leading-6 text-[#182019]/50">{body}</p></div>)}</div>
  </section>

  <section id="pricing" className="mx-auto max-w-[1440px] border-x border-b border-[#182019]/20">
    <div className="grid border-b border-[#182019]/20 lg:grid-cols-2">
      <div className="border-b border-[#182019]/20 p-6 md:p-10 lg:border-b-0 lg:border-r"><p className="text-xs font-semibold uppercase tracking-[.16em] text-black/40">Pricing</p><h2 className="mt-12 max-w-xl text-4xl font-medium leading-tight tracking-[-.05em] md:text-6xl">Start with a record.<br/>Pay when it grows.</h2></div>
      <div className="flex items-end p-6 md:p-10"><div><p className="max-w-lg text-base leading-7 text-black/55">Every plan includes private storage, manual records, timeline search, and structured data export. Paid plans increase document and family-circle capacity.</p><p className="mt-5 text-xs text-black/40">Prices shown in USD. Plus and Family renew automatically until cancelled. Choose annual billing to save 10%.</p></div></div>
    </div>
    <div className="grid lg:grid-cols-3">
      <Price name="Personal" price="$0" cadence="forever" description="For starting a private health record." features={["25 stored documents","Unlimited manual entries","Daily check-ins","Timeline search","Structured record export","1 family member"]}/>
      <Price name="Plus" price="$8" cadence="per month" annual="$86.40/year · save 10%" description="For an active, long-term record." features={["250 stored documents","Everything in Personal","Health streaks and capsules","2 family members","Printable doctor visit summary"]} featured/>
      <Price name="Family" price="$14" cadence="per month" annual="$151.20/year · save 10%" description="For ongoing support from a care circle." features={["500 stored documents","Everything in Plus","Up to 5 family members","Permissioned family check-ins","Emergency card and health passport"]}/>
    </div>
    <div className="flex flex-col justify-between gap-4 border-t border-[#182019]/20 p-6 text-sm md:flex-row md:items-center md:p-10"><div><b>Stay subscribed only as long as you need.</b><p className="mt-1 text-xs text-black/45">International subscriptions renew monthly or annually and can be managed from Settings. Chapa is also available as a local, non-renewing 30-day payment option.</p></div><p className="max-w-lg text-xs leading-5 text-black/45">Document limits count successfully stored files. Existing files remain available after paid access ends; new uploads pause above the Personal limit.</p></div>
  </section>

  <section id="security" className="bg-[#1d2d23] text-white"><div className="mx-auto grid max-w-[1440px] lg:grid-cols-12"><div className="p-6 md:p-10 lg:col-span-7 lg:border-r lg:border-white/15"><p className="text-xs font-semibold uppercase tracking-[.16em] text-white/45">Access and ownership</p><h2 className="mt-14 max-w-2xl text-4xl font-medium leading-tight tracking-[-.05em] md:text-6xl">A family member sees nothing until you invite them.</h2></div><div className="flex flex-col justify-end p-6 md:p-10 lg:col-span-5"><p className="max-w-md text-base leading-7 text-white/60">Invitations are read-only, permissioned by category, and revocable. Timeline access is off by default.</p><div className="mt-10 grid grid-cols-2 gap-px bg-white/15 text-sm"><span className="bg-[#1d2d23] p-4">Encrypted transport</span><span className="bg-[#1d2d23] p-4">Session expiry</span><span className="bg-[#1d2d23] p-4">Audit history</span><span className="bg-[#1d2d23] p-4">Private storage</span></div></div></div></section>

  <footer className="border-t border-white/10 bg-[#1d2d23] text-white"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-8 px-5 py-10 md:flex-row md:items-center md:px-10"><div><b>LifeLens</b><p className="mt-2 text-xs text-white/40">A personal health record.</p></div><div className="max-w-md text-xs leading-5 text-white/40">LifeLens organizes information provided by its users. It does not diagnose, prescribe, or replace a healthcare professional.</div><nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm"><Link href="/privacy" className="whitespace-nowrap">Privacy</Link><Link href="/terms" className="whitespace-nowrap">Terms</Link><a href="mailto:lifelens@bitlabsbuild.com" className="whitespace-nowrap">Contact</a><Link href="/login" className="flex items-center gap-2 whitespace-nowrap">Sign in <ArrowUpRight size={14}/></Link></nav></div></footer>
</main>}

function Price({name,price,cadence,annual,description,features,featured=false}:{name:string;price:string;cadence:string;annual?:string;description:string;features:string[];featured?:boolean}){return <article className={`flex min-h-[540px] flex-col border-b border-[#182019]/20 p-6 last:border-b-0 md:p-10 lg:border-b-0 lg:border-r lg:last:border-r-0 ${featured?"bg-[#e5e8df]":"bg-[#f4f2ec]"}`}><div className="flex items-start justify-between"><h3 className="text-lg font-semibold">{name}</h3>{featured?<span className="border border-[#182019]/25 px-2 py-1 text-[10px] font-semibold uppercase tracking-[.12em]">Most useful</span>:null}</div><p className="mt-5 max-w-xs text-sm leading-6 text-black/50">{description}</p><div className="mt-12 border-b border-[#182019]/20 pb-8"><span className="text-5xl font-medium tracking-[-.06em]">{price}</span><span className="ml-2 text-xs text-black/45">{cadence}</span>{annual?<p className="mt-3 text-xs font-semibold text-[#355b42]">or {annual}</p>:null}</div><ul className="mt-7 space-y-4">{features.map(feature=><li key={feature} className="flex gap-3 text-sm"><Check className="mt-0.5 shrink-0" size={14}/>{feature}</li>)}</ul><Link href="/login" className={`mt-auto flex h-11 items-center justify-between border px-4 text-sm font-semibold ${featured?"border-[#182019] bg-[#182019] text-white":"border-[#182019]/30 hover:border-[#182019]"}`}>Choose {name}<ArrowUpRight size={14}/></Link></article>}
