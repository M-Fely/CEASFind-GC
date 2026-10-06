import React, { useEffect, useState } from "react";

const terms = [
  ["1. Eligibility", "CEAS FIND is exclusively for students, faculty, and staff of Gordon College's College of Engineering, Architecture, and Sciences (CEAS). Access requires a valid Gordon College Google account ending in the institution's domain."],
  ["2. Acceptable Use", "You agree to use CEAS FIND only for reporting and recovering genuinely lost or found items within the Gordon College campus. Posting false, misleading, or fabricated item reports is strictly prohibited and may result in permanent account suspension."],
  ["3. Content Responsibility", "You are solely responsible for all content you post, including item descriptions, photos, and messages. Do not post private information of others without consent. Content that is offensive, discriminatory, or harmful is not permitted."],
  ["4. Claiming Items", "Claiming an item requires submitting proof of ownership via the platform. False claims are a violation of these terms and may be reported to Gordon College administration. The platform administrator reserves the right to verify claims and take appropriate action."],
  ["5. Admin Privileges", "Designated administrators have the authority to remove any post that violates these terms, is flagged as fraudulent, or is otherwise inappropriate. Admin decisions are final."],
  ["6. Privacy", "Your Google domain account name and email will be visible to other signed-in users when you post an item. Do not share sensitive personal information beyond what is necessary to identify a lost item."],
  ["7. Limitation of Liability", "CEAS FIND facilitates communication between users but does not guarantee the recovery of lost items. The platform and its administrators are not liable for any loss, damage, or dispute arising from item transactions between users."],
  ["8. Amendments", "These terms may be updated at any time. Continued use of the platform constitutes acceptance of the updated terms."],
];

export default function AuthPage() {
  const [termsOpen, setTermsOpen] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const [termsCheck, setTermsCheck] = useState(false);
  const [showAcceptance, setShowAcceptance] = useState(false);
  const [courseCode, setCourseCode] = useState("");

  useEffect(() => {
    window._openCourseModal = () => setCourseOpen(true);
    window._closeCourseModal = () => setCourseOpen(false);
    return () => {
      delete window._openCourseModal;
      delete window._closeCourseModal;
    };
  }, []);

  function startGoogleSignIn() {
    if (!localStorage.getItem("ceas_tac_accepted")) {
      setTermsCheck(false);
      setShowAcceptance(true);
      setTermsOpen(true);
    } else if (window._ceasSignIn) {
      window._ceasSignIn();
    }
  }

  function acceptTerms() {
    localStorage.setItem("ceas_tac_accepted", "1");
    setTermsOpen(false);
    if (window._ceasSignIn) window._ceasSignIn();
  }

  function finishRegistration() {
    if (window._ceasFinishReg) window._ceasFinishReg(courseCode.trim());
  }

  return (
    <>
      <div className="bg-waves" aria-hidden="true">
        <div className="bg-wave">
          <svg viewBox="0 0 1440 160" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path d="M0,80 C240,130 480,30 720,80 C960,130 1200,30 1440,80 L1440,160 L0,160 Z" /></svg>
        </div>
        <div className="bg-wave">
          <svg viewBox="0 0 1440 160" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path d="M0,60 C360,120 720,20 1080,80 C1200,100 1350,50 1440,70 L1440,160 L0,160 Z" /></svg>
        </div>
        <div className="bg-wave">
          <svg viewBox="0 0 1440 160" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path d="M0,100 C180,50 360,120 540,90 C720,60 900,110 1080,80 C1260,50 1380,100 1440,90 L1440,160 L0,160 Z" /></svg>
        </div>
      </div>

      <div className="header">
        <img className="app-logo" src="/elements/user icon white.png" alt="" />
        <h4>CEAS FIND</h4>
      </div>

      <main className="auth-center">
        <section className="auth-card" aria-label="Sign in to CEAS FIND">
          <div className="auth-logo">CEAS FIND</div>
          <p className="auth-tagline">Gordon College CEAS Lost &amp; Found Platform</p>
          <div className="notice-box">
            <span className="material-symbols-outlined">info</span>
            <span>Sign in with your <strong>Gordon College Google account</strong>. Only CEAS domain accounts are accepted.</span>
          </div>
          <button className="btn-google" id="google-login-btn" type="button" onClick={startGoogleSignIn}>
            <svg className="google-icon" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.3 6.5 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.2-.1-2.4-.4-3.5z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19.1 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.3 6.5 29.4 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.4C29.4 35 26.8 36 24 36c-5.2 0-9.6-3.4-11.2-8H6.1C9.4 35.5 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.8l6.3 5.4C40.8 36.3 44 30.6 44 24c0-1.2-.1-2.4-.4-3.5z" />
            </svg>
            Sign In with Google
          </button>
          <p className="tac-link">By signing in, you agree to our <a id="open-tac" href="#terms" onClick={(event) => { event.preventDefault(); setShowAcceptance(false); setTermsOpen(true); }}>Terms and Conditions</a>.</p>
        </section>
      </main>

      <div className={`modal-overlay${termsOpen ? " open" : ""}`} id="tac-modal" aria-hidden={!termsOpen}>
        <section className="modal-box" role="dialog" aria-modal="true" aria-labelledby="terms-title">
          <div className="modal-title" id="terms-title">Terms &amp; Conditions</div>
          <p className="modal-subtitle">Please read and accept before continuing.</p>
          <div className="tac-scroll">
            {terms.map(([title, text]) => <React.Fragment key={title}><h3>{title}</h3><p>{text}</p></React.Fragment>)}
          </div>
          <label className="checkbox-row" style={{ display: showAcceptance ? "flex" : "none" }}>
            <input type="checkbox" id="tac-check" checked={termsCheck} onChange={(event) => setTermsCheck(event.target.checked)} />
            I have read and agree to the Terms and Conditions
          </label>
          <div className="modal-actions">
            <button className="btn-ghost" id="tac-cancel" type="button" onClick={() => setTermsOpen(false)}>Cancel</button>
            <button className="btn-primary" id="tac-accept" type="button" style={{ display: showAcceptance ? "block" : "none" }} disabled={!termsCheck} onClick={acceptTerms}>Accept &amp; Continue</button>
          </div>
        </section>
      </div>

      <div className={`modal-overlay${courseOpen ? " open" : ""}`} id="course-modal" aria-hidden={!courseOpen}>
        <section className="modal-box" role="dialog" aria-modal="true" aria-labelledby="course-title">
          <div className="modal-title" id="course-title">Complete Registration</div>
          <p className="modal-subtitle">One last step — enter your CEAS course code to finish setting up your account.</p>
          <div className="form-field">
            <label htmlFor="course-code-input">CEAS Course Code</label>
            <input type="text" id="course-code-input" placeholder="e.g. BSCS-101" autoComplete="off" value={courseCode} onChange={(event) => setCourseCode(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") finishRegistration(); }} />
          </div>
          <div className="modal-actions">
            <button className="btn-ghost" id="course-cancel" type="button" onClick={() => setCourseOpen(false)}>Back</button>
            <button className="btn-primary" id="course-submit" type="button" onClick={finishRegistration}>Finish Registration</button>
          </div>
        </section>
      </div>
    </>
  );
}
