import {AppShell} from "./app-shell";
export function SimplePage({eyebrow,title,description,children}:{eyebrow:string;title:string;description:string;children:React.ReactNode}){return <AppShell eyebrow={eyebrow} title={title} description={description}><section className="border border-black/20 bg-[#faf9f5]">{children}</section></AppShell>}
