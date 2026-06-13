import { startLoop } from "./core/loop";
import { t } from "./i18n/i18n";
import { mountApp } from "./ui/render";
import "./ui/theme.css";
import "./ui/layout.css";

const root = document.querySelector<HTMLElement>("#app");

if (root === null) {
  throw new Error("Missing #app root");
}

document.title = t("app.title");

const app = mountApp(root);
let testTicks = 0;

startLoop({
  tick(): void {
    testTicks += 1;
    app.updateTickCount(testTicks);
  },
  render(alpha): void {
    app.updateFrameAlpha(alpha);
  }
});
