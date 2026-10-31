import type { ReactElement } from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AppOwnerApp } from './app-owner/AppOwnerApp.tsx';
import { PublicWebsite } from './app-owner/PublicWebsite.tsx';
import { SignupPage } from './app-owner/SignupPage.tsx';
import { ContactPage } from './app-owner/ContactPage.tsx';
import { ResetPasswordPage } from './shared/ResetPasswordPage.tsx';
import { ConfirmEmailPage } from './shared/ConfirmEmailPage.tsx';
import './index.css';

// One tenant = one subdomain (docs/PRD.md §1.1). The bare base domain hosts
// three separate pages, chosen by path: "/" is the public marketing site
// (prospective tenants), "/app-owner" is the App Owner console, and
// "/signup" / "/contact" are the public site's own sub-pages. Everything
// under a subdomain is the tenant app. Mirrors the exact rule
// server/middleware/tenant.ts enforces on the API, so frontend and backend
// agree on what "public", "App Owner" and "tenant" each mean.
const APP_BASE_DOMAIN = import.meta.env.VITE_APP_BASE_DOMAIN || 'localhost:3000';
const currentHost = window.location.host.toLowerCase();
const isBareDomain = currentHost === APP_BASE_DOMAIN || currentHost === `www.${APP_BASE_DOMAIN}`;

// Utility pages reached via an emailed link work on either context (App
// Owner or tenant admin) — the backend tells the two apart by subdomain,
// not by which of these pages is rendering.
const path = window.location.pathname;
const resetToken = path.startsWith('/reset-password/') ? path.slice('/reset-password/'.length) : null;
const confirmToken = path.startsWith('/confirm-email/') ? path.slice('/confirm-email/'.length) : null;

let view: ReactElement;
if (resetToken) {
  view = <ResetPasswordPage token={resetToken} />;
} else if (confirmToken) {
  view = <ConfirmEmailPage token={confirmToken} />;
} else if (isBareDomain && path === '/signup') {
  view = <SignupPage />;
} else if (isBareDomain && path === '/contact') {
  view = <ContactPage />;
} else if (isBareDomain && path.startsWith('/app-owner')) {
  view = <AppOwnerApp />;
} else if (isBareDomain) {
  view = <PublicWebsite />;
} else {
  view = <App />;
}

createRoot(document.getElementById('root')!).render(view);
