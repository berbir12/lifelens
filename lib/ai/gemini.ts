import "server-only";
import {createGoogleGenerativeAI} from "@ai-sdk/google";

export const DEFAULT_GEMINI_MODEL="gemini-3.5-flash";
export const DEFAULT_GEMINI_ASSISTANT_MODEL="gemini-3.5-flash-lite";
const LEGACY_MODELS=new Set(["gemini-2.5-flash"]);

export function geminiConfig(){
  const apiKey=process.env.GEMINI_API_KEY?.trim();
  const configuredModel=process.env.GEMINI_MODEL?.trim();
  const model=!configuredModel||LEGACY_MODELS.has(configuredModel)?DEFAULT_GEMINI_MODEL:configuredModel;
  return apiKey?{apiKey,model}:null;
}

export function geminiModel(modelOverride?:string){
  const config=geminiConfig();
  if(!config)throw new Error("GEMINI_NOT_CONFIGURED");
  const provider=createGoogleGenerativeAI({apiKey:config.apiKey});
  const modelId=modelOverride?.trim()||config.model;
  return {model:provider(modelId),modelId};
}

export function geminiAssistantModel(){return geminiModel(process.env.GEMINI_ASSISTANT_MODEL?.trim()||DEFAULT_GEMINI_ASSISTANT_MODEL)}
