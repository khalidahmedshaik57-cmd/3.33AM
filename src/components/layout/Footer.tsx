import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer" id="about">
      <div className="footer-top">
        <div>
          <p className="eyebrow">For the in-between hours</p>
          <p className="footer-manifesto">Make room for<br />your own time.</p>
        </div>
        <div className="footer-links">
          <Link href="/shop">Shop all</Link>
          <a href="mailto:hello@333am.example">Contact</a>
          <span>Thoughtfully made. Worn often.</span>
        </div>
      </div>
      <div className="footer-bottom"><span>© 3.33AM 2026</span><span>Designed for the hours that are yours.</span></div>
    </footer>
  );
}
