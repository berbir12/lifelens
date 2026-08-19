"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ExternalLink, FileSearch, FileText, FolderInput, Pencil, Search, ShieldCheck, Trash2, Upload } from "lucide-react";
import {useSearchParams} from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import {DocumentExtractionReview as ExtractionReview} from "@/components/document-extraction-review";

type Doc = { id: string; name: string; mimeType: string; status: string; createdAt: string; folderId:string|null };
type Folder={id:string;name:string;color:string};
type Job = { id: string; file: File; status: string; error?: string };
type Medication = {
  name: string;
  dosage: string | null;
  schedule: string | null;
  reason: string | null;
  prescriber: string | null;
  refillDate: string | null;
  expirationDate: string | null;
  sourcePage: number | null;
  confidence: number;
};
type Extraction = {documentType:string;summary:string;documentDate:string|null;provider:string|null;facility:string|null;facts:{label:string;value:string;sourcePage:number|null;confidence:number}[];followUpItems:{instruction:string;sourcePage:number|null}[];timelineDraft:{title:string;description:string;occurredOn:string|null};medications:Medication[];warnings:string[]};
type Review = { busy?: boolean; error?: string; extractionId?: string; extraction?: Extraction };

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const AI_SUPPORTED = new Set(["application/pdf", "image/jpeg", "image/png"]);

function mime(file: File) {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "docx" ? DOCX : "";
}

export function DocumentLibrary() {
  const searchParams=useSearchParams(),folderId=searchParams.get("folder"),unfiled=searchParams.get("unfiled")==="true";
  const picker = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reviews, setReviews] = useState<Record<string, Review>>({});
  const [query, setQuery] = useState("");
  const [folders,setFolders]=useState<Folder[]>([]),[message,setMessage]=useState(""),[actionId,setActionId]=useState<string|null>(null);

  async function load() {
    const params=new URLSearchParams();if(folderId)params.set("folder",folderId);if(unfiled)params.set("unfiled","true");
    const response = await fetch(`/api/documents?${params}`);
    if (response.ok){const body=await response.json();setDocs(body.records);setFolders(body.folders??[])}
  }
  useEffect(() => { void load(); }, [folderId,unfiled]);

  async function openDocument(id:string){setActionId(id);setMessage("");try{const response=await fetch(`/api/documents?id=${encodeURIComponent(id)}`),body=await response.json();if(!response.ok)throw new Error(body.error??"Could not open document.");window.open(body.url,"_blank","noopener,noreferrer")}catch(cause){setMessage(cause instanceof Error?cause.message:"Could not open document.")}finally{setActionId(null)}}
  async function updateDocument(id:string,update:{name?:string;folderId?:string|null}){setActionId(id);setMessage("");try{const response=await fetch("/api/documents",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id,...update})}),body=await response.json().catch(()=>null);if(!response.ok)throw new Error(body?.error??"Could not update document.");setMessage("Document updated.");await load()}catch(cause){setMessage(cause instanceof Error?cause.message:"Could not update document.")}finally{setActionId(null)}}
  async function rename(doc:Doc){const name=window.prompt("Document name",doc.name)?.trim();if(name&&name!==doc.name)await updateDocument(doc.id,{name})}
  async function remove(doc:Doc){if(!window.confirm(`Permanently delete “${doc.name}”? This removes the stored file and cannot be undone.`))return;setActionId(doc.id);setMessage("");try{const response=await fetch("/api/documents",{method:"DELETE",headers:{"content-type":"application/json"},body:JSON.stringify({id:doc.id})}),body=await response.json().catch(()=>null);if(!response.ok)throw new Error(body?.error??"Could not delete document.");setMessage("Document deleted.");await load()}catch(cause){setMessage(cause instanceof Error?cause.message:"Could not delete document.")}finally{setActionId(null)}}

  function updateJob(id: string, status: string, error?: string) {
    setJobs(all => all.map(job => job.id === id ? { ...job, status, error } : job));
  }
  async function upload(job: Job) {
    try {
      const mimeType = mime(job.file);
      if (!mimeType) throw new Error("Unsupported file type");
      const response = await fetch("/api/documents", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: job.file.name, mimeType, size: job.file.size }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      const client = createSupabaseBrowser();
      if (!client) throw new Error("Supabase is not configured");
      updateJob(job.id, "Uploading…");
      const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "medical-documents";
      const result = await client.storage.from(bucket).uploadToSignedUrl(body.path, body.token, job.file, { contentType: mimeType });
      if (result.error) throw result.error;
      const done = await fetch("/api/documents", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: body.id }) });
      if (!done.ok) throw new Error("Could not finish upload");
      updateJob(job.id, "Stored securely");
      await load();
    } catch (error) {
      updateJob(job.id, "Failed", error instanceof Error ? error.message : "Upload failed");
    }
  }
  function choose(files: FileList | null) {
    if (!files) return;
    const next = Array.from(files).map(file => ({ id: crypto.randomUUID(), file, status: "Preparing…" }));
    setJobs(all => [...all, ...next]);
    next.forEach(job => void upload(job));
    if (picker.current) picker.current.value = "";
  }
  async function analyze(documentId: string) {
    setReviews(all => ({ ...all, [documentId]: { busy: true } }));
    try {
      const response = await fetch("/api/ai/documents/extract", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ documentId }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "The document could not be reviewed.");
      setReviews(all => ({ ...all, [documentId]: { extractionId: body.extractionId, extraction: body.extraction } }));
    } catch (error) {
      setReviews(all => ({ ...all, [documentId]: { error: error instanceof Error ? error.message : "The document could not be reviewed." } }));
    }
  }

  const visible = docs.filter(doc => doc.name.toLowerCase().includes(query.toLowerCase()));
  return <div className="border border-black/20">
    <section className="grid bg-[#faf9f5] lg:grid-cols-[1fr_320px]">
      <button onClick={() => picker.current?.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); choose(event.dataTransfer.files); }} className="flex min-h-52 flex-col items-start justify-center border-b border-black/20 p-8 text-left hover:bg-white lg:border-b-0 lg:border-r">
        <Upload size={19}/><b className="mt-8 text-lg">Add health documents</b><span className="mt-2 text-sm text-black/45">Drop files here or select from your device</span><span className="mt-6 text-xs text-black/35">PDF, PNG, JPEG, DOCX · 20 MB maximum</span>
        <input ref={picker} className="hidden" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.docx" onChange={event => choose(event.target.files)}/>
      </button>
      <div className="p-6"><ShieldCheck size={18}/><h2 className="mt-8 text-lg font-semibold">Private storage</h2><p className="mt-3 text-sm leading-6 text-black/45">Files stay private and are only sent for AI review when you choose Review with AI.</p></div>
    </section>
    {jobs.length ? <section className="border-t border-black/20 bg-[#eee4d8]"><p className="border-b border-black/15 px-5 py-3 text-xs font-semibold uppercase tracking-[.12em]">Uploads</p>{jobs.map(job => <div key={job.id} className="grid gap-2 border-b border-black/10 px-5 py-3 text-sm sm:grid-cols-[1fr_auto]"><span className="flex items-center gap-3 truncate"><FileText size={15}/>{job.file.name}</span><span className={job.error ? "text-xs text-red-700" : "text-xs text-black/45"}>{job.error ?? job.status}</span></div>)}</section> : null}
    <section className="border-t border-black/20 bg-[#faf9f5]">
      <div className="flex flex-col justify-between gap-4 border-b border-black/20 p-5 sm:flex-row sm:items-center"><div><h2 className="font-semibold">{folderId?folders.find(folder=>folder.id===folderId)?.name??"Folder":unfiled?"Unfiled documents":"All documents"}</h2><p className="mt-1 text-sm text-black/60">{docs.length} stored file{docs.length===1?"":"s"}</p></div><label className="flex min-h-12 items-center gap-2 border border-black/20 px-3"><Search size={17}/><span className="sr-only">Filter documents</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Filter documents" className="w-full bg-transparent text-base outline-none sm:w-44"/></label></div>
      {message?<p role="status" className="border-b border-black/10 bg-[#e5e8df] px-5 py-3 text-sm">{message}</p>:null}
      {visible.map(doc => <article key={doc.id} className="border-b border-black/10">
        <div className="flex flex-wrap gap-2 border-b border-black/10 px-5 py-3"><button type="button" disabled={actionId===doc.id} onClick={()=>void openDocument(doc.id)} className="flex min-h-11 items-center gap-2 border border-black/25 px-3 text-sm font-semibold"><ExternalLink size={15}/>Open</button><button type="button" disabled={actionId===doc.id} onClick={()=>void rename(doc)} className="flex min-h-11 items-center gap-2 border border-black/25 px-3 text-sm"><Pencil size={15}/>Rename</button><label className="flex min-h-11 items-center gap-2 border border-black/25 px-3 text-sm"><FolderInput size={15}/><span className="sr-only">Move {doc.name} to folder</span><select value={doc.folderId??""} onChange={event=>void updateDocument(doc.id,{folderId:event.target.value||null})} className="bg-transparent"><option value="">Unfiled</option>{folders.map(folder=><option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label><button type="button" disabled={actionId===doc.id} onClick={()=>void remove(doc)} className="flex min-h-11 items-center gap-2 border border-red-900/30 px-3 text-sm text-red-900"><Trash2 size={15}/>Delete</button></div>
        <div className="grid gap-4 p-5 text-sm sm:grid-cols-[1fr_auto] sm:items-center"><span><b>{doc.name}</b><small className="mt-1 block text-black/40">{new Date(doc.createdAt).toLocaleDateString()} · {doc.status}</small></span>{AI_SUPPORTED.has(doc.mimeType) && doc.status === "STORED" ? <button disabled={reviews[doc.id]?.busy} onClick={() => void analyze(doc.id)} className="flex items-center justify-center gap-2 border border-black/25 px-3 py-2 text-xs font-semibold disabled:opacity-50"><FileSearch size={14}/>{reviews[doc.id]?.busy ? "Reviewing…" : reviews[doc.id]?.extraction ? "Review again" : "Review with AI"}</button> : null}</div>
        {reviews[doc.id]?.error ? <p role="alert" className="border-t border-red-200 bg-red-50 px-5 py-3 text-sm text-red-800">{reviews[doc.id].error}</p> : null}
        {reviews[doc.id]?.extraction && reviews[doc.id]?.extractionId ? <ExtractionReview extractionId={reviews[doc.id].extractionId!} extraction={reviews[doc.id].extraction!}/> : null}
      </article>)}
      {!visible.length ? <p className="p-12 text-center text-sm text-black/45">No documents found.</p> : null}
    </section>
  </div>;
}

function LegacyExtractionReview({ extractionId, extraction }: { extractionId: string; extraction: Extraction }) {
  return <section className="border-t border-black/15 bg-[#eee4d8] p-5">
    <p className="text-xs font-semibold uppercase tracking-[.12em]">AI draft · confirm before saving</p>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-black/60">{extraction.summary}</p>
    {extraction.warnings.map((warning, index) => <p key={index} className="mt-2 text-xs text-[#7a4b2f]">{warning}</p>)}
    {!extraction.medications.length ? <p className="mt-4 border border-black/15 bg-white p-4 text-sm">No medication details were confidently identified. Nothing has been added to your record.</p> : null}
    <div className="mt-4 grid gap-4">{extraction.medications.map((medication, index) => <MedicationReview key={`${medication.name}-${index}`} extractionId={extractionId} index={index} medication={medication}/>)}</div>
    <p className="mt-4 text-xs leading-5 text-black/45">LifeLens transcribes visible text; it does not verify prescriptions or provide medical advice. Compare every value with the original document.</p>
  </section>;
}

function MedicationReview({ extractionId, index, medication }: { extractionId: string; index: number; medication: Medication }) {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const response = await fetch("/api/ai/documents/confirm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ extractionId, medicationIndex: index, medication: values }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "The medication could not be saved.");
      setSaved(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The medication could not be saved."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={confirm} className="border border-black/20 bg-[#faf9f5] p-4">
    <div className="mb-4 flex items-center justify-between gap-3"><b>Review medication</b><span className="text-xs text-black/40">Source: page {medication.sourcePage ?? "unknown"} · {Math.round(medication.confidence * 100)}% transcription confidence</span></div>
    <div className="grid gap-3 md:grid-cols-3">
      <ReviewField name="name" label="Medication" value={medication.name}/><ReviewField name="dosage" label="Dosage" value={medication.dosage ?? ""}/><ReviewField name="schedule" label="Schedule" value={medication.schedule ?? ""}/><ReviewField name="reason" label="Reason" value={medication.reason ?? ""}/><ReviewField name="prescriber" label="Prescriber" value={medication.prescriber ?? ""}/><ReviewField name="refillDate" label="Refill date" value={medication.refillDate ?? ""} type="date"/><ReviewField name="expirationDate" label="Expiration date" value={medication.expirationDate ?? ""} type="date"/>
    </div>
    <button disabled={busy || saved} className="mt-4 bg-[#23392c] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saved ? "Added to Medicine Cabinet" : busy ? "Adding…" : "Confirm and add medication"}</button>
    {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
  </form>;
}

function ReviewField({ name, label, value, type = "text" }: { name: string; label: string; value: string; type?: string }) {
  return <label className="text-xs font-semibold">{label}<input required={name === "name" || name === "dosage" || name === "schedule"} name={name} type={type} defaultValue={value} className="mt-1 h-10 w-full border border-black/20 bg-white px-3 text-sm font-normal"/></label>;
}
