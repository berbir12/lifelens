import fs from "node:fs";
import crypto from "node:crypto";
import {createClient} from "@supabase/supabase-js";

const userId=process.argv[2];
if(!/^[0-9a-f-]{36}$/i.test(userId??""))throw new Error("Pass the target user UUID.");
for(const line of fs.readFileSync(".env","utf8").split(/\r?\n/)){
  const match=line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);if(!match||process.env[match[1]])continue;
  let value=match[2].trim();if(/^(['"]).*\1$/.test(value))value=value.slice(1,-1);process.env[match[1]]=value.replace(/\\n/g,"\n");
}
const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key)throw new Error("Supabase admin configuration is missing.");
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const bucket=process.env.SUPABASE_STORAGE_BUCKET||"medical-documents",prefix=`${userId}/demo`,stamp=new Date().toISOString();
function ok(result,label){if(result.error)throw new Error(`${label}: ${result.error.message}`);return result.data}
function demoPdf(title,date){return Buffer.from(`%PDF-1.4\n% LifeLens fictional demonstration record\n${title}\nDocument date: ${date}\nThis is not a real medical record.\n%%EOF`)}
async function demoUser(first){
  const email=`${first.toLowerCase()}.demo.${userId.slice(0,8)}@example.com`;
  const listed=await db.auth.admin.listUsers({page:1,perPage:1000});ok(listed,"list users");
  let user=listed.data.users.find(x=>x.email===email);
  if(!user){const created=await db.auth.admin.createUser({email,email_confirm:true,user_metadata:{full_name:`${first} Johnson`,demo_account:true}});user=ok(created,`create ${first}`).user}
  ok(await db.from("profiles").upsert({user_id:user.id,email,full_name:`${first} Johnson`,goals:[],conditions:[],preferred_language:"en",timezone:"Africa/Nairobi",updated_at:stamp},{onConflict:"user_id"}),`profile ${first}`);
  return{id:user.id,email,name:`${first} Johnson`};
}

ok(await db.auth.admin.getUserById(userId),"target user");
const [maya,daniel]=await Promise.all([demoUser("Maya"),demoUser("Daniel")]);

// Delete only identifiable records from an earlier run.
for(const [table,column,values] of [
  ["timeline_events","source",["demo_seed"]],
  ["medications","prescriber",["Dr. Elena Carter (Demo)"]],
  ["appointments","notes",["Demo appointment for promotional account."]],
  ["memories","mood",["demo-joyful","demo-calm","demo-proud"]],
  ["medical_expenses","notes",["demo_seed"]],
])for(const value of values)ok(await db.from(table).delete().eq("user_id",userId).eq(column,value),`clean ${table}`);
ok(await db.from("check_ins").delete().eq("user_id",userId).like("transcript","Demo:%"),"clean check-ins");
ok(await db.from("doctor_questions").delete().eq("user_id",userId).like("question","Demo:%"),"clean questions");
ok(await db.from("family_members").delete().eq("user_id",userId).like("email",`%.demo.${userId.slice(0,8)}@example.com`),"clean family");
ok(await db.from("family_history").delete().eq("user_id",userId).like("relative_name","%(Demo)"),"clean family history");
ok(await db.from("health_capsules").delete().eq("user_id",userId).in("month",["2026-06-01","2026-07-01","2026-08-01"]),"clean capsules");
const oldDocs=ok(await db.from("documents").select("id,storage_key").eq("user_id",userId).like("storage_key",`${prefix}/%`),"find documents")??[];
if(oldDocs.length){ok(await db.storage.from(bucket).remove(oldDocs.map(x=>x.storage_key)),"remove files");ok(await db.from("documents").delete().in("id",oldDocs.map(x=>x.id)),"remove documents")}

ok(await db.from("medications").insert([
  {user_id:userId,name:"Amlodipine",dosage:"5 mg",schedule:"Once each morning",reason:"Blood pressure",prescriber:"Dr. Elena Carter (Demo)",refill_date:"2026-09-08",expiration_date:"2027-04-30",remaining_pills:24,active:true},
  {user_id:userId,name:"Metformin",dosage:"500 mg",schedule:"Twice daily with meals",reason:"Blood sugar management",prescriber:"Dr. Elena Carter (Demo)",refill_date:"2026-08-29",expiration_date:"2027-02-28",remaining_pills:38,active:true},
  {user_id:userId,name:"Vitamin D3",dosage:"1,000 IU",schedule:"Once daily",reason:"Vitamin D support",prescriber:"Dr. Elena Carter (Demo)",refill_date:"2026-10-15",expiration_date:"2027-08-31",remaining_pills:61,active:true},
]),"medications");
ok(await db.from("appointments").insert([
  {user_id:userId,title:"Routine primary-care review",provider:"Dr. Elena Carter",starts_at:"2026-09-04T07:30:00Z",location:"Riverside Family Clinic",notes:"Demo appointment for promotional account.",follow_up_due:"2027-03-04"},
  {user_id:userId,title:"Annual eye examination",provider:"Dr. Noah Kim",starts_at:"2026-10-18T09:00:00Z",location:"Clearview Eye Centre",notes:"Demo appointment for promotional account."},
  {user_id:userId,title:"Dental cleaning",provider:"Dr. Priya Shah",starts_at:"2026-07-12T08:00:00Z",location:"Harbour Dental",notes:"Demo appointment for promotional account.",completed_at:"2026-07-12T08:45:00Z"},
]),"appointments");
ok(await db.from("check_ins").insert([
  {user_id:userId,transcript:"Demo: Energy was good after a 30-minute morning walk.",recorded_at:"2026-08-14T06:45:00Z"},
  {user_id:userId,transcript:"Demo: Slept well and remembered all scheduled medication.",recorded_at:"2026-08-12T07:10:00Z"},
  {user_id:userId,transcript:"Demo: Mild knee stiffness after gardening; noted for the next visit.",recorded_at:"2026-08-09T17:30:00Z"},
]),"check-ins");
const events=[
  ["life","Moved closer to family","Settled into a new home ten minutes from Maya and the grandchildren.","2021-03-18T12:00:00Z"],
  ["health","Started blood-pressure medication","Amlodipine was added after a routine primary-care visit.","2022-02-11T10:00:00Z"],
  ["health","Completed knee physiotherapy","Finished twelve weeks of rehabilitation and returned to regular walks.","2022-11-28T10:00:00Z"],
  ["memory","Family reunion at the coast","Spent a long weekend with children and grandchildren.","2023-07-16T14:00:00Z"],
  ["health","Annual wellness review","Medication list and preventive screenings were reviewed.","2024-04-22T09:00:00Z"],
  ["travel","Visited Lisbon","Packed medication with a LifeLens checklist and health passport.","2024-09-05T08:00:00Z"],
  ["document","Brain MRI report added","The imaging report was stored and reviewed in the Health Vault.","2025-07-10T11:00:00Z"],
  ["health","Blood sugar follow-up","Routine laboratory results were discussed with the primary-care doctor.","2025-11-19T09:30:00Z"],
  ["habit","Reached a 60-day walking streak","Completed the morning walking habit for sixty consecutive days.","2026-06-30T07:00:00Z"],
  ["memory","Granddaughter’s graduation","Celebrated Ava’s graduation with the whole family.","2026-07-24T15:00:00Z"],
  ["health","Medication cabinet reviewed","Refill dates, remaining pills, and expiration dates were updated.","2026-08-10T08:00:00Z"],
].map(([category,title,description,occurred_at])=>({user_id:userId,category,title,description,occurred_at,source:"demo_seed"}));
ok(await db.from("timeline_events").insert(events),"timeline");
ok(await db.from("memories").insert([
  {user_id:userId,memory_date:"2026-07-24",caption:"Ava graduated today. Everyone made it, and we took a photograph together after the ceremony.",people:["Maya","Daniel","Ava"],mood:"demo-proud"},
  {user_id:userId,memory_date:"2026-06-08",caption:"Morning walk through the botanical garden with Maya.",people:["Maya"],mood:"demo-calm"},
  {user_id:userId,memory_date:"2025-12-25",caption:"Christmas lunch at Daniel’s house, with the old family recipes on the table.",people:["Daniel","Maya","Ava"],mood:"demo-joyful"},
]),"memories");

const folderIds={};for(const name of ["Imaging","Blood Tests","Prescriptions","Vaccines"]){const row=ok(await db.from("vault_folders").upsert({user_id:userId,name},{onConflict:"user_id,name"}).select("id,name").single(),`folder ${name}`);folderIds[name]=row.id}
const documents=[
  ["Brain MRI Report — July 2025.pdf","Imaging","2025-07-10","imaging_report","Brain MRI report dated 10 July 2025 from Riverside Medical Centre.","Dr. Noah Williams","Riverside Medical Centre",[{label:"Examination",value:"MRI brain",sourcePage:1,confidence:.99}]],
  ["Routine Blood Tests — November 2025.pdf","Blood Tests","2025-11-18","lab_result","Routine blood test panel from Riverside Family Clinic.","Dr. Elena Carter","Riverside Family Clinic",[{label:"Panel",value:"Routine metabolic and blood count panels",sourcePage:1,confidence:.96}]],
  ["Current Medication List — August 2026.pdf","Prescriptions","2026-08-10","prescription","Current medication list reviewed during a pharmacy consultation.","Alex Morgan, Pharmacist","Greenleaf Pharmacy",[{label:"Medication review",value:"Amlodipine, Metformin, and Vitamin D3 listed",sourcePage:1,confidence:.98}]],
  ["Vaccination Record — 2026.pdf","Vaccines","2026-03-02","vaccination_record","Personal vaccination record updated in March 2026.","Community Nursing Team","Riverside Family Clinic",[{label:"Record status",value:"Vaccination history updated",sourcePage:1,confidence:.97}]],
];
for(const [name,folder,date,type,summary,provider,facility,facts] of documents){
  const storage_key=`${prefix}/${crypto.randomUUID()}-${name.replace(/[^a-z0-9.-]+/gi,"-")}`,body=demoPdf(name,date);
  ok(await db.storage.from(bucket).upload(storage_key,body,{contentType:"application/pdf"}),`upload ${name}`);
  const doc=ok(await db.from("documents").insert({user_id:userId,name,mime_type:"application/pdf",storage_key,size_bytes:body.length,status:"READY",folder_id:folderIds[folder]}).select("id").single(),`document ${name}`);
  ok(await db.from("document_extractions").insert({user_id:userId,document_id:doc.id,model:"demo-reviewed",prompt_version:"health-document-review-v2",output:{documentType:type,summary,documentDate:date,provider,facility,facts,followUpItems:[],timelineDraft:{title:name.replace(/\.pdf$/,""),description:summary,occurredOn:date},medications:[],warnings:["Fictional demonstration record"]},confirmed_items:[],confirmed_at:stamp}),`review ${name}`);
  ok(await db.from("ai_requests").insert({user_id:userId,feature:"document_extraction",status:"SUCCEEDED",model:"demo-reviewed",completed_at:stamp}),`AI record ${name}`);
}

ok(await db.from("family_members").insert([
  {user_id:userId,member_user_id:maya.id,email:maya.email,status:"accepted",can_view_timeline:true,can_contribute:true,accepted_at:stamp},
  {user_id:userId,member_user_id:daniel.id,email:daniel.email,status:"accepted",can_view_timeline:true,can_contribute:true,accepted_at:stamp},
]),"family members");
ok(await db.from("family_checkins").insert([
  {owner_id:userId,author_id:maya.id,visit_date:"2026-08-13",note:"Had lunch together. We organized the medicine cabinet and added the next refill to the calendar.",mood:"Cheerful",walking:"Steady",appetite:"Normal"},
  {owner_id:userId,author_id:daniel.id,visit_date:"2026-08-06",note:"Walked around the neighbourhood and reviewed questions for the next doctor visit.",mood:"Good",walking:"Good",appetite:"Normal"},
]),"family journal");
ok(await db.from("emergency_profiles").upsert({user_id:userId,blood_type:"O+",allergies:["Penicillin (demo)"],conditions:["Hypertension (demo)","Type 2 diabetes (demo)"],emergency_contact:"Maya Johnson · +1 555 010 2040 (demo)",insurance:"Horizon Health · DEMO-48291",doctor_contact:"Dr. Elena Carter · Riverside Family Clinic",is_enabled:true,updated_at:stamp},{onConflict:"user_id"}),"emergency card");
ok(await db.from("doctor_questions").insert([{user_id:userId,question:"Demo: Should we review the current blood-pressure trend?"},{user_id:userId,question:"Demo: Is the next routine blood test due this year?"}]),"questions");

for(const [name,days] of [["Morning walk",60],["Take morning medication",47],["Record blood pressure",18]]){
  const habit=ok(await db.from("habits").upsert({user_id:userId,name},{onConflict:"user_id,name"}).select("id").single(),`habit ${name}`);ok(await db.from("habit_logs").delete().eq("habit_id",habit.id),`clean habit ${name}`);
  ok(await db.from("habit_logs").insert(Array.from({length:days},(_,i)=>({user_id:userId,habit_id:habit.id,logged_on:new Date(Date.UTC(2026,7,14-i)).toISOString().slice(0,10)}))),`logs ${name}`);
}
ok(await db.from("medical_expenses").insert([
  {user_id:userId,expense_date:"2026-07-12",category:"Dental",provider:"Harbour Dental",amount:120,currency:"USD",insurance_paid:80,notes:"demo_seed"},
  {user_id:userId,expense_date:"2026-06-03",category:"Medication",provider:"Greenleaf Pharmacy",amount:46.5,currency:"USD",insurance_paid:20,notes:"demo_seed"},
  {user_id:userId,expense_date:"2025-11-18",category:"Laboratory",provider:"Riverside Family Clinic",amount:95,currency:"USD",insurance_paid:70,notes:"demo_seed"},
]),"expenses");
ok(await db.from("family_history").insert([
  {user_id:userId,relative_name:"Margaret Johnson (Demo)",relationship:"Mother",conditions:["Type 2 diabetes"]},
  {user_id:userId,relative_name:"Samuel Johnson (Demo)",relationship:"Father",conditions:["Hypertension","Heart disease"]},
]),"family history");
for(const [month,weight,mood] of [["2026-06-01",76.4,"Active"],["2026-07-01",75.8,"Positive"],["2026-08-01",75.5,"Calm"]])ok(await db.from("health_capsules").upsert({user_id:userId,month,snapshot:{profile:{weight_kg:weight,conditions:["Hypertension","Type 2 diabetes"]},medications:["Amlodipine","Metformin","Vitamin D3"],memories:[{mood}],checkIns:[{summary:"Demo monthly check-in"}],appointments:[]},locked_at:stamp},{onConflict:"user_id,month"}),`capsule ${month}`);
ok(await db.from("subscriptions").upsert({user_id:userId,provider:"demo",plan:"FAMILY",status:"ACTIVE",provider_reference:`demo-${userId}`,current_period_end:"2030-01-01T00:00:00Z",updated_at:stamp},{onConflict:"user_id"}),"demo plan");
ok(await db.from("user_notifications").insert([{user_id:userId,title:"Medication refill coming up",body:"Metformin has a demo refill date in two weeks.",href:"/medications"},{user_id:userId,title:"Family check-in added",body:"Maya added a new family journal entry.",href:"/family"}]),"notifications");
console.log(JSON.stringify({ok:true,userId,familyMembers:2,documents:documents.length,timelineEvents:events.length,medications:3}));
