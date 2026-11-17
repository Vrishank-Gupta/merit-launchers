import { forwardRef, type AnchorHTMLAttributes } from "react";
import { trackEvent } from "@/lib/analytics";
import { PLAY_STORE_URL } from "@/lib/links";

type FreeTestLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  source?: string;
};

/** Link for "free test" CTAs: the free mock test is taken in the Android app. */
const FreeTestLink = forwardRef<HTMLAnchorElement, FreeTestLinkProps>(
  ({ source = "unknown", onClick, children, ...props }, ref) => (
    <a
      ref={ref}
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => {
        trackEvent("free_test_click", { source, destination: "play_store" });
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </a>
  ),
);
FreeTestLink.displayName = "FreeTestLink";

export default FreeTestLink;
