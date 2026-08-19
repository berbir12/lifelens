"use client";

import {useEffect,useRef,useState} from "react";
import {Mic,RotateCcw,Save,Square} from "lucide-react";
import {useRouter} from "next/navigation";

type SpeechEvent={results:ArrayLike<{0:{transcript:string};isFinal:boolean}>;resultIndex:number};
type SpeechRecognitionLike={continuous:boolean;interimResults:boolean;lang:string;start:()=>void;stop:()=>void;abort:()=>void;onresult:((event:SpeechEvent)=>void)|null;onerror:((event:{error:string})=>void)|null;onend:(()=>void)|null};
type SpeechRecognitionCtor=new()=>SpeechRecognitionLike;

export function VoiceCheckin(){
  const router=useRouter(),recognition=useRef<SpeechRecognitionLike|null>(null),recorder=useRef<MediaRecorder|null>(null),stream=useRef<MediaStream|null>(null),chunks=useRef<Blob[]>([]);
  const [recording,setRecording]=useState(false),[transcript,setTranscript]=useState(""),[interim,setInterim]=useState(""),[audioUrl,setAudioUrl]=useState<string|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false),[saved,setSaved]=useState(false),[seconds,setSeconds]=useState(0);

  useEffect(()=>{if(!recording)return;const timer=window.setInterval(()=>setSeconds(value=>value+1),1000);return()=>window.clearInterval(timer)},[recording]);
  useEffect(()=>()=>{recognition.current?.abort();stream.current?.getTracks().forEach(track=>track.stop());if(audioUrl)URL.revokeObjectURL(audioUrl)},[audioUrl]);

  async function start(){
    setError("");setSaved(false);setInterim("");setSeconds(0);chunks.current=[];
    try{
      if(!navigator.mediaDevices?.getUserMedia)throw new Error("Voice recording is not supported in this browser. You can type your check-in instead.");
      const media=await navigator.mediaDevices.getUserMedia({audio:true});stream.current=media;
      const mediaRecorder=new MediaRecorder(media);recorder.current=mediaRecorder;
      mediaRecorder.ondataavailable=event=>{if(event.data.size)chunks.current.push(event.data)};
      mediaRecorder.onstop=()=>{const blob=new Blob(chunks.current,{type:mediaRecorder.mimeType||"audio/webm"});if(audioUrl)URL.revokeObjectURL(audioUrl);setAudioUrl(URL.createObjectURL(blob));media.getTracks().forEach(track=>track.stop())};
      const browserWindow=window as typeof window&{SpeechRecognition?:SpeechRecognitionCtor;webkitSpeechRecognition?:SpeechRecognitionCtor};
      const SpeechRecognition=browserWindow.SpeechRecognition??browserWindow.webkitSpeechRecognition;
      if(SpeechRecognition){
        const speech=new SpeechRecognition();speech.continuous=true;speech.interimResults=true;speech.lang=document.documentElement.lang||"en";
        speech.onresult=event=>{let finalText="",draft="";for(let index=event.resultIndex;index<event.results.length;index++){const result=event.results[index];if(result.isFinal)finalText+=`${result[0].transcript} `;else draft+=result[0].transcript}if(finalText)setTranscript(value=>`${value}${finalText}`.trimStart());setInterim(draft)};
        speech.onerror=event=>{if(event.error!=="aborted"&&event.error!=="no-speech")setError("Live transcription stopped. Your audio is still available to review.")};
        recognition.current=speech;speech.start();
      }else setError("Live transcription is unavailable in this browser. Record, listen back, then type your check-in below.");
      mediaRecorder.start(500);setRecording(true);
    }catch(cause){setError(cause instanceof Error?cause.message:"Microphone access could not be started.")}
  }
  function stop(){recognition.current?.stop();recorder.current?.stop();setRecording(false);setInterim("")}
  function reset(){if(recording)stop();setTranscript("");setInterim("");setSaved(false);setSeconds(0);if(audioUrl){URL.revokeObjectURL(audioUrl);setAudioUrl(null)}}
  async function save(){
    if(!transcript.trim())return;setBusy(true);setError("");
    try{const response=await fetch("/api/check-ins",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({transcript:transcript.trim()})});const body=await response.json().catch(()=>null);if(!response.ok)throw new Error(body?.error??"The check-in could not be saved.");setSaved(true);router.refresh()}
    catch(cause){setError(cause instanceof Error?cause.message:"The check-in could not be saved.")}finally{setBusy(false)}
  }
  const time=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,"0")}`;
  return <section className="border border-black/20 bg-white p-4" aria-labelledby="voice-checkin-title">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 id="voice-checkin-title" className="font-semibold">Voice check-in</h3><p className="mt-1 text-sm text-black/60">Review and edit the transcript before anything is saved.</p></div>{recording?<span aria-live="polite" className="flex items-center gap-2 text-sm font-semibold text-[#8b3f32]"><span className="h-2.5 w-2.5 rounded-full bg-[#b54f3f]"/>Recording {time}</span>:null}</div>
    <div className="mt-4 flex flex-wrap gap-3">{!recording?<button type="button" onClick={()=>void start()} className="flex min-h-12 items-center gap-2 bg-[#23392c] px-4 text-sm font-semibold text-white"><Mic size={18}/>{audioUrl?"Record again":"Start recording"}</button>:<button type="button" onClick={stop} className="flex min-h-12 items-center gap-2 bg-[#8b3f32] px-4 text-sm font-semibold text-white"><Square size={17}/>Stop and review</button>}{audioUrl&&!recording?<audio controls src={audioUrl} className="h-12 max-w-full" aria-label="Recorded check-in playback"/>:null}</div>
    {(recording||audioUrl||transcript)?<label className="mt-5 block text-sm font-semibold">Check-in transcript<textarea value={`${transcript}${interim?` ${interim}`:""}`} onChange={event=>{setTranscript(event.target.value);setInterim("")}} disabled={recording} rows={5} maxLength={10000} placeholder="Your transcript will appear here. You can also type it yourself." className="mt-2 w-full border border-black/25 bg-[#faf9f5] p-3 text-base font-normal leading-7 outline-none focus:border-[#23392c] disabled:opacity-70"/></label>:null}
    {!recording&&(audioUrl||transcript)?<div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={()=>void save()} disabled={busy||!transcript.trim()||saved} className="flex min-h-12 items-center gap-2 bg-[#23392c] px-4 text-sm font-semibold text-white disabled:opacity-50"><Save size={17}/>{saved?"Saved":busy?"Saving…":"Save check-in"}</button><button type="button" onClick={reset} className="flex min-h-12 items-center gap-2 border border-black/25 px-4 text-sm font-semibold"><RotateCcw size={16}/>Discard</button></div>:null}
    {saved?<p role="status" className="mt-3 text-sm font-semibold text-[#355b42]">Check-in saved to your health history.</p>:null}{error?<p role="alert" className="mt-3 text-sm text-red-800">{error}</p>:null}
  </section>
}
