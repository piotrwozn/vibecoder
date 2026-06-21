import { t } from "../../i18n/i18n";
import { el, setText, text } from "../dom";
import { createIcon } from "./app-icons";
import type { ToastOptions, ToastTone } from "./view-types";

const TOAST_POOL_SIZE = 3;

export interface ToastPool {
  readonly root: HTMLElement;
  readonly show: (message: string, tone: ToastTone, options?: ToastOptions) => void;
}

interface ToastNode {
  onClick: (() => void) | undefined;
  readonly icon: HTMLElement;
  readonly root: HTMLButtonElement;
  readonly text: Text;
}

export function createToasts(): ToastPool {
  const root = el("section", {
    ariaLabel: t("ui.toast.ariaLabel"),
    className: "toast-stack"
  });
  root.setAttribute("aria-live", "polite");
  const toasts: ToastNode[] = [];
  let nextIndex = 0;

  for (let i = 0; i < TOAST_POOL_SIZE; i += 1) {
    const toast = el("button", { className: "toast" });
    const icon = el("span", { className: "toast__icon" });
    const textWrap = el("span", { className: "toast__text" });
    const toastText = text("");
    const node: ToastNode = { icon, onClick: undefined, root: toast, text: toastText };
    toast.type = "button";
    toast.tabIndex = -1;
    toast.hidden = true;
    icon.hidden = true;
    textWrap.append(toastText);
    toast.append(icon, textWrap);
    toast.addEventListener("animationend", () => {
      toast.hidden = true;
      toast.classList.remove("toast--active");
    });
    toast.addEventListener("click", () => {
      node.onClick?.();
      toast.hidden = true;
      toast.classList.remove("toast--active", "toast--action");
    });
    root.append(toast);
    toasts.push(node);
  }

  return {
    root,

    show(message: string, tone: ToastTone, options?: ToastOptions): void {
      const toast = toasts[nextIndex];

      if (toast === undefined) {
        return;
      }

      toast.onClick = options?.onClick;
      toast.root.tabIndex = toast.onClick === undefined ? -1 : 0;
      toast.root.classList.toggle("toast--action", toast.onClick !== undefined);
      toast.root.setAttribute("aria-label", message);
      toast.icon.replaceChildren();
      if (options?.iconPath === undefined) {
        toast.icon.hidden = true;
      } else {
        toast.icon.hidden = false;
        toast.icon.append(createIcon(options.iconPath));
      }
      setText(toast.text, message);
      toast.root.dataset.tone = tone;
      toast.root.hidden = false;
      toast.root.classList.remove("toast--active");
      void toast.root.offsetWidth;
      toast.root.classList.add("toast--active");
      nextIndex = (nextIndex + 1) % TOAST_POOL_SIZE;
    }
  };
}
