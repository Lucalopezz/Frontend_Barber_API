/** Decorative artwork: a barber chair, mirror and traditional pole. */
export function BarberIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 440 340"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern
          id="barber-stripes"
          width="36"
          height="36"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-35)"
        >
          <rect width="36" height="36" fill="#F0EEE6" />
          <rect width="12" height="36" fill="#883D43" />
          <rect x="24" width="12" height="36" fill="#314F5A" />
        </pattern>
      </defs>
      <path d="M25 307h390" stroke="#587079" strokeWidth="2" />
      <rect
        x="112"
        y="25"
        width="200"
        height="219"
        rx="90"
        fill="#34515B"
        stroke="#8C9E9E"
        strokeWidth="7"
      />
      <path
        d="M139 120V112a73 73 0 0 1 73-73"
        stroke="#66818A"
        strokeWidth="3"
      />
      <rect x="83" y="207" width="266" height="13" rx="3" fill="#A88667" />
      <path d="M97 220v85m235-85v85" stroke="#8C9E9E" strokeWidth="5" />
      <rect x="96" y="183" width="18" height="24" rx="3" fill="#DDE3DE" />
      <path d="M100 179h10m-5-9v9" stroke="#DDE3DE" strokeWidth="3" />
      <path
        d="M316 183v23m9-27v27m-19-25v25"
        stroke="#A88667"
        strokeWidth="4"
      />
      <rect x="300" y="193" width="31" height="14" rx="3" fill="#DDE3DE" />
      <rect
        x="168"
        y="130"
        width="93"
        height="91"
        rx="16"
        fill="#883D43"
        stroke="#B67470"
        strokeWidth="3"
      />
      <path
        d="M183 143v63m17-63v63m17-63v63m17-63v63m14-63v63"
        stroke="#9F5659"
        strokeWidth="2"
      />
      <rect
        x="162"
        y="118"
        width="105"
        height="25"
        rx="10"
        fill="#883D43"
        stroke="#B67470"
        strokeWidth="3"
      />
      <rect
        x="160"
        y="219"
        width="111"
        height="27"
        rx="9"
        fill="#883D43"
        stroke="#B67470"
        strokeWidth="3"
      />
      <path
        d="M147 200v36h132v-36m-132 0h20m94 0h18"
        stroke="#C5CEC7"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M214 248v43m-40 15h80m-70-2 30-13 30 13"
        stroke="#C5CEC7"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="m264 242 28 33h-38"
        stroke="#C5CEC7"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <rect
        x="373"
        y="101"
        width="25"
        height="105"
        rx="12"
        fill="url(#barber-stripes)"
        stroke="#C5CEC7"
        strokeWidth="3"
      />
      <path
        d="M370 98h31m-31 112h31"
        stroke="#C5CEC7"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M58 0v53m-19 20a19 19 0 0 1 38 0Z"
        stroke="#A88667"
        strokeWidth="3"
        fill="#A88667"
      />
    </svg>
  );
}
