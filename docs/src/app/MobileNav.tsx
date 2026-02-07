"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overview" },
  { href: "/install", label: "Install" },
  { href: "/features", label: "Features" },
  { href: "/api-reference", label: "API Reference" },
  { href: "/changelog", label: "Changelog" },
  { href: "/faq", label: "FAQ" },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-header">
        <div className="mobile-typed-logo">
          <div>
            <span style={{ color: '#4C74FF' }}>&amp;&gt;&gt;</span> agent-tail
          </div>
        </div>
        <button
          className={`mobile-nav-toggle ${isOpen ? "open" : ""}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation"
        >
          <span className="mobile-nav-icon">
            <span />
            <span />
          </span>
        </button>
      </div>

      <div className={`mobile-nav-links ${isOpen ? "open" : ""}`}>
        <div className="mobile-nav-links-inner">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`mobile-nav-link ${pathname === link.href ? "active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
