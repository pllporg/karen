import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { CoverPage } from "./components/sections/CoverPage";
import { BrandFoundation } from "./components/sections/BrandFoundation";
import { LogoMarks } from "./components/sections/LogoMarks";
import { ColorSystem } from "./components/sections/ColorSystem";
import { TypographySection } from "./components/sections/TypographySection";
import { NamingSystem } from "./components/sections/NamingSystem";
import { MessagingVoice } from "./components/sections/MessagingVoice";
import { GridComponents } from "./components/sections/GridComponents";
import { InteractionDesign } from "./components/sections/InteractionDesign";
import { AIInteraction } from "./components/sections/AIInteraction";
import { MarketingSite } from "./components/sections/MarketingSite";
import { AppUIKit } from "./components/sections/AppUIKit";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: CoverPage },
      { path: "foundation", Component: BrandFoundation },
      { path: "logo", Component: LogoMarks },
      { path: "color", Component: ColorSystem },
      { path: "typography", Component: TypographySection },
      { path: "naming", Component: NamingSystem },
      { path: "messaging", Component: MessagingVoice },
      { path: "grid", Component: GridComponents },
      { path: "interaction", Component: InteractionDesign },
      { path: "ai", Component: AIInteraction },
      { path: "marketing", Component: MarketingSite },
      { path: "uikit", Component: AppUIKit },
    ],
  },
]);