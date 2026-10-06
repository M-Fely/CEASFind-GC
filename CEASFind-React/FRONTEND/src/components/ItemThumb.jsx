export default function ItemThumb({ src, size = 60 }) {
  return (
    <div className="item-thumb" style={{ width: size, height: size }}>
      {src ? <img src={src} alt="" /> : <span className="material-symbols-outlined">image</span>}
    </div>
  );
}
