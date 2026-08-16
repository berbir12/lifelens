const key="7ee77f1cfcd14d68be88a97829529cc5";
const origin=new URL(process.env.NEXT_PUBLIC_APP_URL??"https://lifelens.bitlabsbuild.com").origin;
const paths=["/","/features","/about","/privacy","/terms"];
const urlList=paths.map(path=>new URL(path,origin).href);
const response=await fetch("https://api.indexnow.org/IndexNow",{method:"POST",headers:{"content-type":"application/json; charset=utf-8"},body:JSON.stringify({host:new URL(origin).host,key,keyLocation:`${origin}/${key}.txt`,urlList})});
if(!response.ok){const detail=await response.text();throw new Error(`IndexNow submission failed (${response.status}): ${detail||response.statusText}`)}
console.log(`IndexNow accepted ${urlList.length} LifeLens URLs (${response.status}).`);
