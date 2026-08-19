import {Suspense} from "react";
import {AppShell} from "@/components/app-shell";
import {DocumentLibrary} from "@/components/document-library";

export default function Documents(){return <AppShell eyebrow="Your private archive" title="Health documents" description="Keep lab results, visit notes, scans, and medication records together—organized into one reliable history."><Suspense fallback={<p className="border border-black/20 bg-white p-8 text-sm">Loading documents…</p>}><DocumentLibrary/></Suspense></AppShell>}
