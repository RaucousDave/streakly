import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  plugins: [magicLinkClient()],
});


export const googleSignIn = async () => {
  const {error} = await authClient.signIn.social({provider: "google", callbackURL: `${import.meta.env.VITE_FRONTEND_URL}/dashboard`})

  if(error){
    console.log(error)
  }
}
export const {
  signOut,
  useSession,
  requestPasswordReset,
  resetPassword,
} = authClient;

console.log(authClient);
