const WAVES = [1, 2, 3, 4, 5, 6];

export default function Waves({ className = "wave-container" }) {
  return (
    <div className={className} aria-hidden="true">
      {WAVES.map((n) => (
        <img key={n} className={`wave${n}`} src={`/elements/wave ${n}.png`} alt="" />
      ))}
    </div>
  );
}

export function BrandHeader({ className = "nav-header" }) {
  return (
    <div className={className}>
      <img className="app-logo" src="/elements/user icon white.png" alt="CEAS FIND logo" />
      <h4>CEAS FIND</h4>
    </div>
  );
}
