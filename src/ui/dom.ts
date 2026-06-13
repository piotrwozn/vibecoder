interface ElementOptions {
  ariaLabel?: string;
  className?: string;
  title?: string;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options: ElementOptions = {}
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tagName);

  if (options.className !== undefined) {
    node.className = options.className;
  }

  if (options.ariaLabel !== undefined) {
    node.setAttribute("aria-label", options.ariaLabel);
  }

  if (options.title !== undefined) {
    node.title = options.title;
  }

  return node;
}

export function text(value = ""): Text {
  return document.createTextNode(value);
}

export function setText(node: Text, value: string | number): void {
  const nextValue = String(value);

  if (node.data !== nextValue) {
    node.data = nextValue;
  }
}
