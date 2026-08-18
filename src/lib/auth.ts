import { UserManager } from "oidc-client-ts";

const cognitoAuthConfig = {
  authority:
    "https://cognito-idp.af-south-1.amazonaws.com/af-south-1_DM6oJp4g7",
  client_id: "74jtfm3s6ehq43f983b24br1tq",
  redirect_uri: import.meta.env.VITE_LOGIN_REDIRECT_URL, // e.g. https://books.jetdomains.co.za/callback
  response_type: "code",
  scope: "email openid phone",
};

export const userManager = new UserManager({ ...cognitoAuthConfig });

export async function getUser() {
  return userManager.getUser();
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getUser();
  return !!user && !user.expired;
}

export function signIn() {
  return userManager.signinRedirect();
}

export async function signOutRedirect() {
  const clientId = "74jtfm3s6ehq43f983b24br1tq";
  const logoutUri = import.meta.env.VITE_LOGOUT_REDIRECT_URL;
  const cognitoDomain = "https://af-south-1dm6ojp4g7.auth.af-south-1.amazoncognito.com";
  window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
}

export function signOut() {
  userManager.removeUser();
  return signOutRedirect();
}

export async function getOrganisations(user: any) {
  const apiKey = import.meta.env.VITE_API_KEY;
  const res = await fetch(
    `https://api.jetdomains.online/v0/get_organisations.php?userId=${user.profile.sub}&email=${encodeURIComponent(user.profile.email)}&key=${apiKey}&timestamp=${Date.now()}`
  );
  const result = await res.json();
  if (!result.success) throw new Error("Failed to load organisations");
  return result.organisations;
}