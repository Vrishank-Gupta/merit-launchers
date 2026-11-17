import { forwardRef, useEffect, useState, type AnchorHTMLAttributes } from "react";
import { trackEvent } from "@/lib/analytics";
import { PLAY_STORE_URL, WEB_APP_URL } from "@/lib/links";

type FreeTestLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  source?: string;
};

/**
 * Link for "free test" CTAs. Android visitors go to the Play Store app; everyone
 * else (iPhone, desktop) goes to the web app, since there is no iOS app.
 * Renders the web-app link by default so prerendered HTML and non-JS crawlers
 * get a working URL.
 */
const FreeTestLink = forwardRef<HTMLAnchorElement, FreeTestLinkProps>(
  ({ source = "unknown", onClick, children, ...props }, ref) => {
    const [isAndroid, setIsAndroid] = useState(false);

    useEffect(() => {
      setIsAndroid(/android/i.test(navigator.userAgent));
    }, []);

    return (
      <a
        ref={ref}
        href={isAndroid ? PLAY_STORE_URL : WEB_APP_URL}
        {...(isAndroid ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        onClick={(event) => {
          trackEvent("free_test_click", { source, destination: isAndroid ? "play_store" : "web_app" });
          onClick?.(event);
        }}
        {...props}
      >
        {children}
      </a>
    );
  },
);
FreeTestLink.displayName = "FreeTestLink";

export default FreeTestLink;
