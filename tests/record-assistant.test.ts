import {describe,expect,it} from "vitest";
import {directRecordAnswer,focusedRecordContext,type AssistantRecords} from "@/lib/ai/record-assistant";

const records:AssistantRecords={profile:null,plan:"FREE",medications:[],appointments:[],timeline:[],checkIns:[],documents:[],documentReviews:[],familyMembers:[],familyCheckIns:[]};

describe("LifeLens record assistant",()=>{
  it("answers MRI history directly from an extracted report",()=>{
    const answer=directRecordAnswer("Have I ever had an MRI?",{
      ...records,
      documentReviews:[{
        created_at:"2026-08-14",
        output:{
          documentType:"imaging_report",
          summary:"Brain MRI report",
          documentDate:"2025-07-10",
          timelineDraft:{title:"Brain MRI report",occurredOn:"2025-07-10"},
        },
      }],
    });
    expect(answer).toContain("Yes");expect(answer).toContain("Brain MRI report");expect(answer).toContain("Jul 10, 2025");expect(answer).toContain("AI-extracted");
  });

  it("states when no MRI record exists",()=>{expect(directRecordAnswer("Have I ever had an MRI?",records)).toContain("couldn’t find")});
  it("leaves unrelated questions for the model",()=>{expect(directRecordAnswer("When is my next appointment?",records)).toBeNull()});
  it("only sends relevant record categories for document questions",()=>{const context=focusedRecordContext("What does my MRI record say?",records);expect(context).toHaveProperty("documentReviews");expect(context).not.toHaveProperty("familyMembers")});
});
