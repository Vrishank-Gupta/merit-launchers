import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '@/lib/analytics';
import { DEFAULT_OG_IMAGE } from '@/lib/seo';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  image?: string;
  robots?: string;
  jsonLd?: object | object[];
  pageEvent?: {
    name: string;
    params?: Record<string, string | number | boolean>;
  };
}

export default function SEO({
  title,
  description,
  keywords,
  canonical,
  image,
  robots,
  jsonLd,
  pageEvent,
}: SEOProps) {
  const location = useLocation();

  useEffect(() => {
    document.title = title;
    const resolvedCanonical = canonical || window.location.origin + location.pathname;
    const resolvedImage = image || DEFAULT_OG_IMAGE;

    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    updateMetaTag('description', description);
    if (keywords) updateMetaTag('keywords', keywords);
    updateMetaTag('robots', robots || 'index, follow');

    // Open Graph
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:url', resolvedCanonical, true);
    updateMetaTag('og:site_name', 'Merit Launchers', true);
    updateMetaTag('og:locale', 'en_IN', true);
    updateMetaTag('og:type', 'website', true);
    updateMetaTag('og:image', resolvedImage, true);

    // Twitter Card
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:site', '@meritlaunchers');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', resolvedImage);

    // Canonical
    let canonicalElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalElement) {
      canonicalElement = document.createElement('link');
      canonicalElement.rel = 'canonical';
      document.head.appendChild(canonicalElement);
    }
    canonicalElement.href = resolvedCanonical;

    // Page-level JSON-LD
    const existingPageLd = document.querySelector('script[data-page-jsonld]');
    if (existingPageLd) existingPageLd.remove();

    if (jsonLd) {
      const schemas = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-page-jsonld', 'true');
      script.textContent = JSON.stringify(schemas.length === 1 ? schemas[0] : schemas);
      document.head.appendChild(script);
    }

    return () => {
      const pageScript = document.querySelector('script[data-page-jsonld]');
      if (pageScript) pageScript.remove();
    };
  }, [title, description, keywords, canonical, image, robots, jsonLd, location]);

  // Fire page-level GA event once on mount
  useEffect(() => {
    if (pageEvent) {
      trackEvent(pageEvent.name, pageEvent.params);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
