export function refreshAfterSave(router:{refresh:()=>void}){
  window.setTimeout(()=>router.refresh(),0);
}

export async function responseMessage(response:Response,fallback:string){
  const body=await response.json().catch(()=>null) as {error?:string}|null;
  return body?.error??fallback;
}
