import CreateElement from "@components/CreateElement";
import InsertAfter from "@root/helpers/InsertAfter";
import clsx from "clsx";
import AddChildren, { ChildrenParamType } from "./helpers/AddChildren";
import { CommonComponentPropsType } from "./helpers/SetProps";
import Icon, { IconColorType } from "./Icon";
import Text, { TextColorType, TextElement } from "./Text";

type LabelType = "default" | "solid" | "transparent" | "transparent-color";

export type LabelColorType =
  | "blue"
  | "mint"
  | "lavender"
  | "peach"
  | "mustard"
  | "gray"
  | "achromatic";

type LabelIconType = Icon | HTMLElement | Node;

export type LabelPropsType = {
  type?: LabelType;
  color?: LabelColorType;
  icon?: LabelIconType;
  onClose?: (event: MouseEvent) => HTMLButtonElement;
  children?: ChildrenParamType;
  className?: string;
  tag?: "div" | "label";
  noSelection?: boolean;
  [x: string]: any;
} & CommonComponentPropsType;

const SG = "sg-label";
const SGD = `${SG}--`;
const SGL = `${SG}__`;

export const COLORS_SOLID_MAP = {
  blue: "blue-primary",
  mint: "mint-primary",
  lavender: "lavender-primary",
  peach: "peach-primary",
  mustard: "mustard-primary",
  gray: "gray-secondary",
  achromatic: "black",
};

export const COLORS_DEFAULT_MAP = {
  blue: "blue-secondary-light",
  mint: "mint-secondary-light",
  lavender: "lavender-secondary-light",
  peach: "peach-secondary-light",
  mustard: "mustard-secondary-light",
  gray: "gray-secondary-light",
  achromatic: "white",
};

const TRANSPARENT_COLOR_TEXT_MAP: {
  [colorName in
    | "blue"
    | "mint"
    | "lavender"
    | "peach"
    | "mustard"
    | "gray"
    | "achromatic"]: TextColorType;
} = {
  blue: "blue-dark",
  mint: "mint-dark",
  lavender: "lavender-dark",
  peach: "peach-dark",
  mustard: "mustard-dark",
  gray: "gray-secondary",
  achromatic: "default",
};

const TRANSPARENT_ICON_COLOR_MAP: {
  [colorName in
    | "blue"
    | "mint"
    | "lavender"
    | "peach"
    | "mustard"
    | "gray"
    | "default"]: IconColorType;
} = {
  blue: "blue",
  mint: "mint",
  lavender: "lavender",
  peach: "peach",
  mustard: "mustard",
  gray: "gray-secondary",
  default: "dark",
};

export default class Label {
  type: LabelType;
  color?: LabelColorType;
  element: HTMLDivElement | HTMLLabelElement;
  icon: LabelIconType;
  iconContainer: HTMLDivElement;
  childrenContainer: HTMLSpanElement;
  textElement: TextElement<"div">;
  closeButton: HTMLButtonElement;
  #closeIconColor: IconColorType;
  #textColor: TextColorType;
  #iconColor: IconColorType;

  constructor({
    children,
    type,
    icon,
    onClose,
    color = "achromatic",
    className,
    tag = "div",
    noSelection,
    ...props
  }: LabelPropsType) {
    this.type = type;

    const labelClass = clsx(
      SG,
      {
        [`${SGD}closable`]: !!onClose,
        [`${SGD}transparent`]:
          type === "transparent" || type === "transparent-color",
        //
        [`${SGD}no-selection`]: noSelection,
      },
      className,
    );

    this.element = CreateElement({
      tag,
      className: labelClass,
      ...props,
    });

    this.ChangeColor(color);

    if (icon) {
      this.ChangeIcon(icon);

      if (!(icon instanceof HTMLElement || icon instanceof Node)) {
        if (!icon.color) {
          this.ChangeIconColor();
        }

        if (!icon.size) {
          icon.ChangeSize(16);
        }
      }
    }

    if (children) {
      this.ChangeChildren(children);
    }

    if (onClose) {
      this.ChangeCloseIconColor();

      this.closeButton = CreateElement({
        tag: "button",
        className: `${SGL}close-button`,
        onClick: onClose,
        children: new Icon({
          size: 16,
          type: "close",
          color: this.#closeIconColor,
        }),
      });

      this.element.append(this.closeButton);
    }
  }

  ChangeIcon(icon: LabelIconType) {
    if (icon) {
      if (!this.iconContainer) {
        this.iconContainer = CreateElement({
          tag: "div",
          className: `${SGL}icon`,
        });

        this.element.prepend(this.iconContainer);
      } else
        while (this.iconContainer.firstChild)
          this.iconContainer.removeChild(this.iconContainer.lastChild);

      if (icon instanceof HTMLElement || icon instanceof Node)
        // @ts-expect-error
        // eslint-disable-next-line no-param-reassign
        icon = { element: icon };

      if (!(icon instanceof HTMLElement || icon instanceof Node))
        this.iconContainer.appendChild(icon.element);
    } else {
      this.iconContainer?.remove();

      this.iconContainer = null;
    }

    this.icon = icon;
  }

  ChangeChildren(children: ChildrenParamType) {
    if (children) {
      if (!this.textElement) {
        this.ChangeTextColor();

        this.textElement = Text({
          tag: "div",
          noWrap: true,
          size: "small",
          weight: "bold",
          color: this.#textColor,
          children,
        });
      } else {
        while (this.textElement.firstChild)
          this.textElement.removeChild(this.textElement.lastChild);

        AddChildren(this.textElement, children);
      }

      if (!this.childrenContainer) {
        this.childrenContainer = CreateElement({
          tag: "span",
          className: `${SGL}text`,
          children: this.textElement,
        });

        if (this.iconContainer)
          InsertAfter(this.childrenContainer, this.iconContainer);
        else {
          this.element.prepend(this.childrenContainer);
        }
      }
    }
  }

  private ChangeCloseIconColor() {
    this.#closeIconColor =
      this.type === "default" || this.type === "transparent"
        ? "dark"
        : this.type === "solid"
        ? "light"
        : TRANSPARENT_ICON_COLOR_MAP[this.color];
  }

  ChangeTextColor() {
    this.#textColor =
      !this.type || this.type === "default" || this.type === "transparent"
        ? "default"
        : this.type === "solid"
        ? "white"
        : TRANSPARENT_COLOR_TEXT_MAP[this.color];

    if (this.textElement) {
      this.textElement.ChangeColor(this.#textColor);
    }
  }

  ChangeIconColor() {
    this.#iconColor =
      !this.type || this.type === "default"
        ? "dark"
        : this.type === "solid"
        ? "light"
        : TRANSPARENT_ICON_COLOR_MAP[this.color];

    if (this.icon && "ChangeColor" in this.icon) {
      this.icon.ChangeColor(this.#iconColor);
    }
  }

  ChangeColor(color: LabelColorType) {
    if (this.color) {
      const oldBackgroundColor: string =
        !this.type || this.type === "default"
          ? COLORS_DEFAULT_MAP[this.color]
          : COLORS_SOLID_MAP[this.color];

      this.element.classList.remove(SGD + oldBackgroundColor);
    }

    const backgroundColor: string =
      !this.type || this.type === "default"
        ? COLORS_DEFAULT_MAP[color]
        : COLORS_SOLID_MAP[color];

    if (
      backgroundColor &&
      (!this.type || this.type === "solid" || this.type === "default")
    ) {
      this.element.classList.add(SGD + backgroundColor);
    }

    this.color = color;
  }
}
