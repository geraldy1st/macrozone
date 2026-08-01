export type LegalPageId = "terms" | "privacy" | "acknowledgements";

export type LegalSection = {
  heading: string;
  body: string;
};

/** Basic legal copy for MVP — not a substitute for lawyer-reviewed policies. */
export const LEGAL_PAGES: Record<
  LegalPageId,
  { titleKey: string; sections: LegalSection[] }
> = {
  terms: {
    titleKey: "legal.termsTitle",
    sections: [
      {
        heading: "1. Acceptance",
        body: "By using nutriFlow (the “App”), you agree to these basic Terms of Use. If you do not agree, please do not use the App.",
      },
      {
        heading: "2. Service description",
        body: "nutriFlow helps you track meals and macros, optionally share content with the community, and use optional AI features. The App is provided for personal, non-commercial use as-is.",
      },
      {
        heading: "3. Accounts",
        body: "You are responsible for keeping your account credentials secure and for activity under your account. You must provide accurate information when registering.",
      },
      {
        heading: "4. Acceptable use",
        body: "You agree not to misuse the App: no harassment, illegal content, spam, scraping, or attempts to disrupt services. Community posts may be removed if they violate these rules.",
      },
      {
        heading: "5. Health disclaimer",
        body: "nutriFlow is not medical advice. Nutrition estimates (including AI analysis) may be inaccurate. Always consult a qualified professional for health decisions.",
      },
      {
        heading: "6. Changes",
        body: "We may update these terms from time to time. Continued use of the App after changes means you accept the updated terms.",
      },
    ],
  },
  privacy: {
    titleKey: "legal.privacyTitle",
    sections: [
      {
        heading: "1. Data we process",
        body: "Depending on how you use the App, we may process account data (email), profile details you enter, meals and macros you log, community posts you publish, and technical data needed to run the service (e.g. authentication tokens).",
      },
      {
        heading: "2. Why we process data",
        body: "To provide meal tracking, sync your account, enable community features, improve the product, and secure the service. AI features send relevant content to third-party AI providers only when you use those features.",
      },
      {
        heading: "3. Storage and security",
        body: "Data may be stored on your device and/or on cloud providers (e.g. Supabase, hosting). We apply reasonable safeguards but no system is 100% secure.",
      },
      {
        heading: "4. Sharing",
        body: "We do not sell your personal data. Content you share publicly in Community is visible to other users. We may use service providers that process data on our behalf under contract.",
      },
      {
        heading: "5. Your rights",
        body: "Depending on your region, you may have rights to access, correct, or delete your data. You can delete your account in Settings when the deletion feature is configured. Contact support via your usual project channel for requests.",
      },
      {
        heading: "6. Retention",
        body: "We keep data as long as needed to provide the App or as required by law. Local guest data stays on your device until you clear app data.",
      },
    ],
  },
  acknowledgements: {
    titleKey: "legal.acknowledgementsTitle",
    sections: [
      {
        heading: "Open source",
        body: "nutriFlow is built with Expo, React Native, Supabase, and many open-source libraries. We thank the maintainers and contributors of those projects.",
      },
      {
        heading: "AI",
        body: "Optional meal and recipe analysis may use third-party AI services. Results are estimates only.",
      },
      {
        heading: "Design inspiration",
        body: "Celebration color gradients are inspired by public gradient collections such as uiGradients (https://uigradients.com).",
      },
      {
        heading: "Disclaimer",
        body: "This acknowledgement page is informational and does not grant extra licenses beyond each dependency’s own license terms.",
      },
    ],
  },
};
