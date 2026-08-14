import "server-only";
import { createGoogleVertex } from "@ai-sdk/google-vertex";
import { getVercelOidcToken } from "@vercel/oidc";
import { ExternalAccountClient } from "google-auth-library";

export const DEFAULT_VERTEX_MODEL = "gemini-2.5-flash";

export function vertexConfig() {
  const project = process.env.GOOGLE_VERTEX_PROJECT?.trim();
  const location = process.env.GOOGLE_VERTEX_LOCATION?.trim() || "us-central1";
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  const projectNumber = process.env.GCP_PROJECT_NUMBER?.trim();
  const poolId = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID?.trim();
  const providerId = process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID?.trim();
  const serviceAccountEmail = process.env.GCP_SERVICE_ACCOUNT_EMAIL?.trim();
  const model = process.env.GOOGLE_VERTEX_MODEL?.trim() || DEFAULT_VERTEX_MODEL;
  const hasKeyCredentials = Boolean(clientEmail && privateKey);
  const hasWorkloadIdentity = Boolean(projectNumber && poolId && providerId && serviceAccountEmail);
  if (!project || (!hasKeyCredentials && !hasWorkloadIdentity)) return null;
  return { project, location, clientEmail, privateKey, projectNumber, poolId, providerId, serviceAccountEmail, model, hasWorkloadIdentity };
}

export async function vertexModel() {
  const config = vertexConfig();
  if (!config) throw new Error("VERTEX_NOT_CONFIGURED");
  if (config.hasWorkloadIdentity) {
    const audience = `//iam.googleapis.com/projects/${config.projectNumber}/locations/global/workloadIdentityPools/${config.poolId}/providers/${config.providerId}`;
    const authClient = ExternalAccountClient.fromJSON({
      type: "external_account",
      audience,
      subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
      token_url: "https://sts.googleapis.com/v1/token",
      service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${config.serviceAccountEmail}:generateAccessToken`,
      subject_token_supplier: { getSubjectToken: () => getVercelOidcToken({ expirationBufferMs: 5 * 60 * 1000 }) },
    });
    if (!authClient) throw new Error("VERTEX_OIDC_CONFIGURATION_INVALID");
    const provider = createGoogleVertex({ project: config.project, location: config.location, googleAuthOptions: { authClient, projectId: config.project } });
    return { model: provider(config.model), modelId: config.model };
  }
  const provider = createGoogleVertex({
    project: config.project,
    location: config.location,
    googleAuthOptions: {
      credentials: { client_email: config.clientEmail!, private_key: config.privateKey! },
    },
  });
  return { model: provider(config.model), modelId: config.model };
}
