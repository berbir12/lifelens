import Link from "next/link";

export default function PrivacyPage() {
  const support=process.env.NEXT_PUBLIC_SUPPORT_EMAIL??"lifelens@bitlabsbuild.com";
  return <LegalPage title="Privacy Policy" updated="August 13, 2026">
    <p>LifeLens stores health information that you choose to provide, including profile details, medications, appointments, check-ins, documents, memories, family-circle entries, and emergency information.</p>
    <h2>How we use information</h2><p>We use your information only to operate the features you request, secure your account, provide support, and process payments. LifeLens does not sell personal or health information.</p>
    <h2>Service providers</h2><p>Supabase provides authentication, database, and file storage. Vercel hosts the application. Google provides optional sign-in. Dodo Payments processes subscriptions. Each provider handles information under its own privacy terms.</p>
    <h2>Sharing</h2><p>Your record is private by default. Information is shared with family members only through permissions you enable. An enabled Emergency Card exposes only the limited emergency profile at its unguessable link.</p>
    <h2>Retention and control</h2><p>You may export your structured record or permanently delete your account from Settings. Payment records may be retained where required for fraud prevention, accounting, or legal compliance.</p>
    <h2>Security and limitations</h2><p>We use encrypted HTTPS transport, authenticated access, database row-level security, and private file storage. No online service can guarantee absolute security. LifeLens is an organizational tool, not a healthcare provider or emergency service.</p>
    <h2>Contact</h2><p>Privacy questions: {support?<a className="underline" href={`mailto:${support}`}>{support}</a>:"Add NEXT_PUBLIC_SUPPORT_EMAIL before launch."}</p>
  </LegalPage>;
}

function LegalPage({title,updated,children}:{title:string;updated:string;children:React.ReactNode}){return <main className="min-h-screen bg-[#f4f2ec] px-5 py-12 text-[#182019]"><article className="mx-auto max-w-3xl border border-black/20 bg-[#faf9f5] p-7 md:p-12"><Link href="/" className="text-sm font-semibold">← LifeLens</Link><h1 className="mt-10 text-4xl font-medium tracking-[-.05em]">{title}</h1><p className="mt-2 text-xs text-black/45">Last updated {updated}</p><div className="mt-10 space-y-5 text-sm leading-7 [&_h2]:pt-5 [&_h2]:text-xl [&_h2]:font-semibold">{children}</div></article></main>}
