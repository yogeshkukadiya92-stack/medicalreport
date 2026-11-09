export default function PrivacyPolicyPage() {
  return <main className="min-h-screen bg-[#edf4f2] px-5 py-10 text-[#162523]"><article className="mx-auto max-w-2xl space-y-5 rounded-2xl bg-white p-7 leading-7 shadow-sm">
    <p className="text-sm font-bold text-[#087766]">MediVault Health Records</p>
    <h1 className="text-3xl font-black">Privacy policy</h1>
    <p className="text-sm text-[#53645f]">Updated 9 November 2026</p>
    <h2 className="text-xl font-bold">Information you provide</h2>
    <p>MediVault stores your account details, family profiles, reports you upload, extracted measurements, sharing preferences and account activity. Profiles may include a name, age, relationship, blood group and contact number. Your password is stored as a salted hash. The mobile app stores its sign-in token using iOS or Android secure storage.</p>
    <h2 className="text-xl font-bold">How reports are processed</h2>
    <p>We use this information to keep your health vault, display reports and trends, and provide sharing that you request. When you choose AI extraction, the selected report content is sent through the MediVault server to Google Gemini for processing. Reports may contain sensitive health and identifying information. Only upload reports you have permission to process. AI results can contain errors; check them against the original report.</p>
    <p>Google operates the external AI service under its own <a className="underline" href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">privacy policy</a>. MediVault uses server hosting and database infrastructure to store and deliver your data. HTTPS protects communication with the production service.</p>
    <h2 className="text-xl font-bold">Camera, photos and files</h2>
    <p>The app uses the camera when you choose to capture a report. The system photo and document pickers let you select a file to upload. Original reports opened on your device may be cached temporarily; the app removes its downloaded preview cache when you sign out.</p>
    <h2 className="text-xl font-bold">Sharing and activity</h2>
    <p>Anyone with a report link you create can view that report until the link expires or you revoke it. Recipients can retain copies they have already viewed or downloaded. Sign-ins, consent changes and report access may be recorded for account history and security. Review your sharing and consent preferences in Privacy &amp; Security.</p>
    <h2 className="text-xl font-bold">Retention and deletion</h2>
    <p>Your vault is kept while your account is active. You can permanently delete your account, family vault, uploaded files, share links and associated account activity from Privacy &amp; Security → Account deletion, or from the <a className="underline" href="/account-deletion">account deletion page</a> without reinstalling the app. The issuing clinic retains its independent clinical records; contact that clinic about its records. Organization-managed accounts must first transfer or close their organization. For questions about provider retention, backups or a deletion that could not finish, contact support.</p>
    <h2 className="text-xl font-bold">Contact and requests</h2>
    <p>For access, correction, deletion or privacy questions, email <a className="underline break-all" href="mailto:yogeshkukadiya92@gmail.com">yogeshkukadiya92@gmail.com</a>. Please describe the issue without attaching medical reports, passwords or OTP codes. We may need to verify account ownership before acting on a request.</p>
    <nav className="flex flex-wrap gap-6"><a className="underline" href="/support">Help &amp; support</a><a className="underline" href="/account-deletion">Delete account</a></nav>
  </article></main>;
}
