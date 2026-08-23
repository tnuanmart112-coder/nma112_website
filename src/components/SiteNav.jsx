import { useEffect, useState } from "react";

const navItems = [
  { href: "/", label: "主畫面" },
  { href: "/作品介紹", label: "作品介紹" },
  { href: "/活動資訊", label: "活動資訊" },
  { href: "/周邊商品", label: "周邊商品" },
  { href: "/參觀地圖", label: "參觀地圖" },
];

export function SiteNav() {
  const [pathname, setPathname] = useState(decodeURI(window.location.pathname));

  useEffect(() => {
    const handleNavigation = () => {
      setPathname(decodeURI(window.location.pathname));
    };

    window.addEventListener("popstate", handleNavigation);

    return () => {
      window.removeEventListener("popstate", handleNavigation);
    };
  }, []);

  function handleClick(event, href) {
    event.preventDefault();
    window.history.pushState({}, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  return (
    <header className="site-header">
      <a className="site-mark" href="/" onClick={(event) => handleClick(event, "/")}>
        NEW ▢▢ RELEASE
      </a>
      <nav className="site-nav" aria-label="主要分頁">
        {navItems.map((item) => (
          <a
            key={item.href}
            className={pathname === item.href ? "active" : ""}
            href={item.href}
            onClick={(event) => handleClick(event, item.href)}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
