import "server-only";
import {createGoogleGenerativeAI} from "@ai-sdk/google";

export const DEFAULT_GEMINI_MODEL="gemini-2.5-flash";

export function geminiConfig(){
  const apiKey=process.env.GEMINI_API_KEY?.trim();
  const model=process.env.GEMINI_MODEL?.trim()||DEFAULT_GEMINI_MODEL;
  return apiKey?{apiKey,model}:null;
}

export function geminiModel(){
  const config=geminiConfig();
  if(!config)throw new Error("GEMINI_NOT_CONFIGURED");
  const provider=createGoogleGenerativeAI({apiKey:config.apiKey});
  return {model:provider(config.model),modelId:config.model};
}
