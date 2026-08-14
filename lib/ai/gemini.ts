import "server-only";
import {createGoogleGenerativeAI} from "@ai-sdk/google";

export const DEFAULT_GEMINI_MODEL="gemini-3.5-flash";
const LEGACY_MODELS=new Set(["gemini-2.5-flash"]);

export function geminiConfig(){
  const apiKey=process.env.GEMINI_API_KEY?.trim();
  const configuredModel=process.env.GEMINI_MODEL?.trim();
  const model=!configuredModel||LEGACY_MODELS.has(configuredModel)?DEFAULT_GEMINI_MODEL:configuredModel;
  return apiKey?{apiKey,model}:null;
}

export function geminiModel(){
  const config=geminiConfig();
  if(!config)throw new Error("GEMINI_NOT_CONFIGURED");
  const provider=createGoogleGenerativeAI({apiKey:config.apiKey});
  return {model:provider(config.model),modelId:config.model};
}
