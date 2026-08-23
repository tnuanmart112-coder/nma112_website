import { SiteNav } from "./components/SiteNav.jsx";
import { SiteBackground } from "./components/SiteBackground.jsx";
import { ActivityInfoPage } from "./pages/ActivityInfoPage.jsx";
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
};

export default function App() {
  const pathname = decodeURI(window.location.pathname);
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
