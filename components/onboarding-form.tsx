"use client";
import {FormEvent,useState} from "react";
import {useRouter} from "next/navigation";
import {ArrowLeft,ArrowRight,Check} from "lucide-react";

const stages=["Basics","Priorities","Support"];
const goalOptions=["Stay active","Remember my history","Prepare for appointments","Keep family informed"];

export function OnboardingForm(){
  const router=useRouter();
  const [step,setStep]=useState(0);
  const [draft,setDraft]=useState<Record<string,string>>({});
  const [goals,setGoals]=useState<string[]>([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const current=Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string,string>;
    const merged={...draft,...current};
    if(step<2){setDraft(merged);setStep(step+1);setError("");window.scrollTo(0,0);return}
    setBusy(true);setError("");
    const body={...merged,goals,heightCm:merged.heightCm?Number(merged.heightCm):undefined,weightKg:merged.weightKg?Number(merged.weightKg):undefined};
    const response=await fetch("/api/profile",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
    if(!response.ok){const result=await response.json().catch(()=>null);setError(result?.error??"We couldn’t save your profile.");setBusy(false);return}
    router.push("/dashboard");router.refresh();
  }

  return <main className="min-h-screen bg-[#f4f2ec] text-[#182019]">
    <header className="border-b border-black/15"><div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 md:px-10"><a href="/" className="text-lg font-bold tracking-[-.04em]">LifeLens</a><span className="text-xs text-black/45">Account setup</span></div></header>
    <div className="mx-auto grid max-w-[1280px] md:grid-cols-[240px_1fr]">
      <aside className="border-b border-black/15 px-5 py-6 md:min-h-[calc(100vh-64px)] md:border-b-0 md:border-r md:px-8 md:py-12"><p className="text-xs font-semibold uppercase tracking-[.16em] text-black/40">Your progress</p><ol className="mt-6 flex gap-2 md:block md:space-y-1">{stages.map((label,index)=><li key={label} className={`flex flex-1 items-center gap-3 border px-3 py-3 text-sm md:flex-none ${index===step?"border-[#182019] bg-[#182019] text-white":index<step?"border-black/15 bg-[#e4e8df]":"border-transparent text-black/40"}`}><span className="grid h-5 w-5 place-items-center text-xs">{index<step?<Check size={14}/>:index+1}</span>{label}</li>)}</ol></aside>
      <section className="px-5 py-10 md:px-12 md:py-16 lg:px-20"><form onSubmit={submit} className="max-w-2xl">
        <div className="mb-12 border-b border-black/15 pb-8"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#60715e]">Step {step+1} of 3</p><h1 className="mt-4 text-4xl font-medium tracking-[-.05em] md:text-5xl">{step===0?"Start with the essentials.":step===1?"What should LifeLens help with?":"Who supports your care?"}</h1></div>
        {step===0&&<div className="space-y-8"><Field name="name" label="Full name" value={draft.name} required/><div className="grid gap-8 sm:grid-cols-2"><Field name="birthDate" label="Date of birth" type="date" value={draft.birthDate} required/><Select name="preferredLanguage" label="Language" value={draft.preferredLanguage??"en"} options={[['en','English'],['sw','Kiswahili'],['fr','French']]}/></div><div className="grid gap-8 sm:grid-cols-2"><Field name="heightCm" label="Height" type="number" suffix="cm" value={draft.heightCm}/><Field name="weightKg" label="Weight" type="number" suffix="kg" value={draft.weightKg}/></div></div>}
        {step===1&&<div className="space-y-10"><fieldset><legend className="text-sm font-semibold">Primary goals</legend><p className="mt-1 text-xs text-black/45">Select any that apply.</p><div className="mt-4 grid border border-black/15 sm:grid-cols-2">{goalOptions.map((goal,index)=>{const active=goals.includes(goal);return <button type="button" key={goal} onClick={()=>setGoals(active?goals.filter(x=>x!==goal):[...goals,goal])} className={`flex min-h-20 items-center justify-between border-black/15 px-4 text-left text-sm ${index%2===0?"sm:border-r":""} ${index<2?"border-b":""} ${active?"bg-[#dfe5da] font-semibold":"bg-[#faf9f5]"}`}>{goal}<span className={`grid h-5 w-5 place-items-center border ${active?"border-moss bg-moss text-white":"border-black/30"}`}>{active&&<Check size={13}/>}</span></button>})}</div></fieldset><Field name="conditions" label="Existing conditions" value={draft.conditions} placeholder="Separate multiple items with commas"/></div>}
        {step===2&&<div className="space-y-8"><Field name="emergencyContact" label="Emergency contact" value={draft.emergencyContact} placeholder="Name and phone number"/><Field name="primaryDoctor" label="Primary doctor" value={draft.primaryDoctor} placeholder="Name or clinic"/><Select name="timezone" label="Timezone" value={draft.timezone??Intl.DateTimeFormat().resolvedOptions().timeZone} options={["Africa/Nairobi","Africa/Addis_Ababa","Europe/London","America/New_York","Asia/Dubai"].map(x=>[x,x])}/></div>}
        <div className="mt-14 flex justify-between border-t border-black/15 pt-6">{step>0?<button type="button" onClick={()=>setStep(step-1)} className="flex items-center gap-2 text-sm font-semibold"><ArrowLeft size={16}/>Back</button>:<span/>}<button disabled={busy} className="flex min-w-36 items-center justify-center gap-2 bg-[#23392c] px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-40">{busy?"Saving…":step===2?"Finish setup":"Continue"}{!busy&&<ArrowRight size={16}/>}</button></div>
        {error&&<div role="alert" className="mt-5 border-l-2 border-red-700 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      </form></section>
    </div>
  </main>
}

function Field({name,label,type="text",value,suffix,placeholder,required}:{name:string;label:string;type?:string;value?:string;suffix?:string;placeholder?:string;required?:boolean}){return <label className="block"><span className="text-sm font-semibold">{label}</span>{required?<span className="ml-1 text-red-700">*</span>:<span className="ml-2 text-xs text-black/35">Optional</span>}<span className="relative block"><input key={value} name={name} type={type} defaultValue={value} required={required} placeholder={placeholder} className="mt-2 h-12 w-full border border-black/20 bg-[#faf9f5] px-3 outline-none focus:border-moss focus:ring-1 focus:ring-moss"/>{suffix&&<span className="absolute right-3 top-1/2 text-sm text-black/40">{suffix}</span>}</span></label>}
function Select({name,label,value,options}:{name:string;label:string;value:string;options:string[][]}){return <label className="block"><span className="text-sm font-semibold">{label}</span><select name={name} defaultValue={value} className="mt-2 h-12 w-full border border-black/20 bg-[#faf9f5] px-3 outline-none focus:border-moss">{options.map(([id,text])=><option key={id} value={id}>{text}</option>)}</select></label>}
