export default function Disclaimer() {
  return (
    <div className="disclaimer">
      <div className="disclaimer__mark" aria-hidden="true">!</div>
      <div className="disclaimer__body">
        <div className="disclaimer__title">Before you pay</div>
        <p className="disclaimer__text">
          Seats are held for <strong>5 minutes</strong>. Do not close this tab.
          You will receive an E-ticket via SMS once payment is verified.
          Charges are non-refundable after the ticket is issued.
        </p>
      </div>
    </div>
  )
}