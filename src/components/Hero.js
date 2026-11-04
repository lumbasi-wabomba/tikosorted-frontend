export default function Hero({ count, nextDate }) {
  return (
    <section className="hero">
      <div className="hero__label">UPCOMING EVENTS · NAIROBI</div>
      <div className="hero__body">
        <div>
          <h1 className="hero__title">
            The city’s live events, <br /> easily booked<br />in one place.
          </h1>
          <p className="hero__sub">
            Browse. Lock your seat. Pay by M-Pesa.<br /> Walk in with confidence.
          </p>
        </div>
        <a href="#catalog" className="hero__cta">
          Browse the catalog
          <span aria-hidden="true">→</span>
        </a>
      </div>
      <div className="hero__strip">
        <div><span className="k">EVENTS LIVE</span><span className="v">{count ?? '—'}</span></div>
        <div><span className="k">NEXT DROP</span><span className="v">{nextDate ?? '—'}</span></div>
        <div><span className="k">PAYMENT</span><span className="v">M-PESA · CARD</span></div>
        <div><span className="k">SUPPORT</span><span className="v">TIKOSORTED.COM</span></div>
      </div>
    </section>
  )
}