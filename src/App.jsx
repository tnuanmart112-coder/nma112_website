import { useEffect, useState } from "react";
import { SiteNav } from "./components/SiteNav.jsx";
import { SiteBackground } from "./components/SiteBackground.jsx";
import { ActivityInfoPage } from "./pages/ActivityInfoPage.jsx";
import { AdminPage } from "./pages/AdminPage.jsx";
import { MainPage } from "./pages/MainPage.jsx";
import { MapPage } from "./pages/MapPage.jsx";
import { MerchandisePage } from "./pages/MerchandisePage.jsx";
import { WorksPage } from "./pages/WorksPage.jsx";

const routes = {
  "/": MainPage,
  "/作品介紹": WorksPage,
  "/活動資訊": ActivityInfoPage,
  "/周邊商品": MerchandisePage,
  "/參觀地圖": MapPage,
  "/admin": AdminPage,
};

export default function App() {
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

  const Page = routes[pathname] || MainPage;

  return (
    <>
      <SiteBackground />
      <SiteNav />
      <main>
        <Page />
      </main>
    </>
  );
}
