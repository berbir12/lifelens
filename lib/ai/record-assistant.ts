type RecordRow=Record<string,unknown>;

export type AssistantRecords={
  profile:unknown;
  plan:string;
  medications:RecordRow[];
  appointments:RecordRow[];
  timeline:RecordRow[];
  checkIns:RecordRow[];
  documents:RecordRow[];
  documentReviews:RecordRow[];
  familyMembers:RecordRow[];
  familyCheckIns:RecordRow[];
};

function object(value:unknown):RecordRow|null{return value!==null&&typeof value==="object"&&!Array.isArray(value)?value as RecordRow:null}
function text(value:unknown){return typeof value==="string"?value:""}
function dateLabel(value:unknown){const valueText=text(value);if(!valueText)return "an unknown date";const date=new Date(valueText);return Number.isNaN(date.valueOf())?valueText:new Intl.DateTimeFormat("en",{dateStyle:"medium",timeZone:"UTC"}).format(date)}

export function directRecordAnswer(question:string,records:Pick<AssistantRecords,"documents"|"documentReviews"|"timeline">){
  if(!/\b(mri|magnetic resonance)\b/i.test(question)||!/\b(have|had|ever|record|records|done|undergone)\b/i.test(question))return null;
  const documentNames=records.documents.filter(row=>/\b(mri|magnetic resonance)\b/i.test(text(row.name)));
  const reviews:RecordRow[]=records.documentReviews.flatMap(row=>{const output=object(row.output);if(!output)return[];const searchable=JSON.stringify({documentType:output.documentType,summary:output.summary,facts:output.facts,timelineDraft:output.timelineDraft});return /\b(mri|magnetic resonance)\b/i.test(searchable)?[{...output,reviewedAt:row.created_at} as RecordRow]:[]});
  const timeline=records.timeline.filter(row=>/\b(mri|magnetic resonance)\b/i.test(`${text(row.title)} ${text(row.description)}`));
  if(reviews.length){const review=reviews[0];const draft=object(review.timelineDraft);const title=text(draft?.title)||text(review.summary)||"MRI report";return `Yes. Your LifeLens records include ${title}, dated ${dateLabel(review.documentDate??draft?.occurredOn)}. This information came from an AI-extracted document review, so compare it with the original report.`}
  if(timeline.length){const event=timeline[0];return `Yes. Your timeline includes ${text(event.title)||"an MRI record"}, dated ${dateLabel(event.occurred_at)}.`}
  if(documentNames.length){const document=documentNames[0];return `Yes. Your document vault includes ${text(document.name)}, uploaded ${dateLabel(document.created_at)}. Open the original document to confirm its details.`}
  return "I couldn’t find an MRI in the records currently stored in LifeLens.";
}

function compactReview(row:RecordRow){const output=object(row.output);if(!output)return null;return{documentId:row.document_id,reviewedAt:row.created_at,documentType:output.documentType,summary:output.summary,documentDate:output.documentDate,provider:output.provider,facility:output.facility,facts:Array.isArray(output.facts)?output.facts.slice(0,15):[],followUpItems:Array.isArray(output.followUpItems)?output.followUpItems.slice(0,10):[],timelineDraft:output.timelineDraft,medications:Array.isArray(output.medications)?output.medications.slice(0,10):[]}}

export function focusedRecordContext(question:string,records:AssistantRecords){
  const q=question.toLowerCase();
  const wantsMedication=/medic|prescription|pill|dose|dosage|refill/.test(q);
  const wantsAppointment=/appointment|doctor|visit|provider|schedule/.test(q);
  const wantsDocument=/document|report|record|mri|scan|lab|test|result|imaging|pdf/.test(q);
  const wantsFamily=/family|relative|caregiver|check.?in/.test(q);
  const selected={profile:records.profile,plan:records.plan} as Record<string,unknown>;
  if(wantsMedication)selected.medications=records.medications;
  if(wantsAppointment)selected.appointments=records.appointments;
  if(wantsDocument){selected.documents=records.documents;selected.documentReviews=records.documentReviews.map(compactReview).filter(Boolean)}
  if(wantsFamily){selected.familyMembers=records.familyMembers;selected.familyCheckIns=records.familyCheckIns}
  selected.timeline=records.timeline;
  if(!wantsMedication&&!wantsAppointment&&!wantsDocument&&!wantsFamily){selected.medications=records.medications;selected.appointments=records.appointments;selected.documents=records.documents;selected.documentReviews=records.documentReviews.map(compactReview).filter(Boolean);selected.checkIns=records.checkIns;selected.familyCheckIns=records.familyCheckIns}
  return selected;
}
