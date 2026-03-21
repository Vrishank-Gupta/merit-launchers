export default function Marquee() {
  return (
    <div className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-[gradient_3s_linear_infinite] overflow-hidden py-2">
      <div className="animate-[scroll_8s_linear_infinite] whitespace-nowrap">
        <span className="inline-block text-primary-foreground font-semibold text-sm md:text-base px-4">
          💥 Premium Mock Tests on our App "Meritlaunchers" — at Nominal Prices for CUET, CLAT, CTET, IPMAT, SSC & DSSSB! 🚀
          🌟 Pioneers in competitive exam preparation — trusted by achievers nationwide!
        </span>
        <span className="inline-block text-primary-foreground font-semibold text-sm md:text-base px-4">
          💥 Premium Mock Tests on our App "Meritlaunchers" — at Nominal Prices for CUET, CLAT, CTET, IPMAT, SSC & DSSSB! 🚀
          🌟 Pioneers in competitive exam preparation — trusted by achievers nationwide!
        </span>
      </div>
    </div>
  );
}
