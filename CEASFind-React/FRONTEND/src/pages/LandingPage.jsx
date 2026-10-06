import React from "react";

const characterLayers = [
  ["under-shirt", "homepage (under shirt).png"],
  ["tie", "homepage (tie).png"],
  ["under-shirt-collar", "homepage (under shirt collar).png"],
  ["right-arm", "homepage (right arm).png"],
  ["right-coat", "homepage (right coat).png"],
  ["back-coat", "homepage (back coat).png"],
  ["right-leg", "homepage (right leg).png"],
  ["left-leg", "homepage (left leg).png"],
  ["back-hair", "homapage (back hair).png"],
  ["left-coat", "homepage (left coat).png"],
  ["face", "homepage (face).png"],
  ["blush", "homepage (blush).png"],
  ["mouth", "homepage (mouth).png"],
  ["eyes", "homepage (eyes).png"],
  ["eyelashes", "homepage (eyelashes).png"],
  ["eyebrow", "homepage (eyebrow).png"],
  ["front-hair", "homapage (front hair).png"],
  ["inner-hair", "homapage (inner hair).png"],
  ["hat", "homapage (hat).png"],
  ["magnifying-glass", "homapage (magnifying glass).png"],
  ["left-arm", "homepage (left arm).png"],
];

const waveLayers = [1, 2, 3, 4, 5, 6];

export default function LandingPage() {
  return (
    <>
      <header className="header">
        <div className="brand">
          <img
            className="app-logo"
            src="/elements/user icon white.png"
            alt="CEAS FIND logo"
          />
          <span className="brand-name">CEAS FIND</span>
        </div>
        <a href="/auth.html" className="header-cta">
          Sign In
        </a>
      </header>

      <div className="wave-container" aria-hidden="true">
        {waveLayers.map((wave) => (
          <img
            key={wave}
            className={`wave${wave}`}
            src={`/elements/wave ${wave}.png`}
            alt=""
          />
        ))}
      </div>

      <main className="content-wrapper">
        <div className="hero-text">
          <div className="tag-line">
            <div className="tag-dot" />
            <span>Gordon College · CEAS</span>
          </div>
          <h1>
            CEAS <span className="accent">FIND</span>
          </h1>
          <p className="subtitle">
            Lost it? Found it? CEAS Find it. A campus hub for reporting lost items
            and recovering found property within Gordon College.
          </p>
          <div className="cta-group">
            <a href="/auth.html" className="btn-primary">
              Go to Feed
            </a>
          </div>
        </div>

        <div className="oc-container" aria-hidden="true">
          {characterLayers.map(([className, filename]) => (
            <img
              key={className}
              className={className}
              src={`/elements/${filename}`}
              alt=""
            />
          ))}
        </div>
      </main>
    </>
  );
}
