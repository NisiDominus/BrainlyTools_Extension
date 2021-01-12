import type { ChildrenParamType } from "@style-guide/helpers/AddChildren";
import clsx from "clsx";
import CreateElement from "@components/CreateElement";

type ExtensionIconTypeType =
  | "subject-all"
  | "ext-info"
  | "ext-icon"
  | "ext-csv"
  | "ext-ods"
  | "ext-xlsx"
  | "ext-numbers"
  | "ext-measuring-tape"
  | "ext-sheet"
  | "ext-shield"
  | "ext-thumbs-up"
  | "ext-thumbs-up-outline"
  | "ext-thumbs-down"
  | "ext-thumbs-down-outline"
  | "ext-move";

export type IconTypeType =
  | "academic_cap"
  | "all_questions"
  | "answer"
  | "arrow_double_down"
  | "arrow_down"
  | "arrow_left"
  | "arrow_right"
  | "arrow_up"
  | "ask_bubble"
  | "ask_parent_to_pay"
  | "attachment"
  | "bell_checked"
  | "bell_outlined"
  | "bold"
  | "bulleted_list"
  | "calendar"
  | "camera"
  | "chapter"
  | "check"
  | "clipboard"
  | "close"
  | "comment"
  | "comment_outlined"
  | "counter"
  | "credit_card"
  | "crown_outlined"
  | "equation"
  | "excellent"
  | "exclamation_mark"
  | "facebook"
  | "filters"
  | "friend_add"
  | "friend_remove"
  | "friend_pending"
  | "friend_checked"
  | "friends"
  | "fullscreen"
  | "heading"
  | "heart"
  | "heart_outlined"
  | "image"
  | "influence"
  | "instagram"
  | "italic"
  | "less"
  | "linkedin"
  | "lock_with_play"
  | "logout"
  | "medium"
  | "menu"
  | "messages"
  | "mic"
  | "money_transfer"
  | "add_more"
  | "notifications"
  | "numbered_list"
  | "open_in_new_tab"
  | "padlock"
  | "pencil"
  | "play"
  | "plus"
  | "points"
  | "profile"
  | "profile_view"
  | "question"
  | "recent_questions"
  | "reload"
  | "report_flag"
  | "report_flag_outlined"
  | "rotate"
  | "rotate_90"
  | "search"
  | "seen"
  | "settings"
  | "share"
  | "sms"
  | "star"
  | "star_half"
  | "star_half_outlined"
  | "star_outlined"
  | "subtitle"
  | "symbols"
  | "title"
  | "toughest_questions"
  | "trash"
  | "twitter"
  | "underlined"
  | "unseen"
  | "verified"
  | "warning"
  | "youtube"
  | "arrow_top_right"
  | "circle"
  | "crop"
  | "cyrillic"
  | "draw"
  | "drawing_mode"
  | "european"
  | "greek"
  | "highlight"
  | "line"
  | "more"
  | "pause"
  | "rectangle"
  | "sup_sub"
  | "triangle"
  | "pi"
  | "quote"
  | "spark"
  | "dot"
  | ExtensionIconTypeType;

export type IconColorType =
  | "adaptive"
  | "blue"
  | "dark"
  | "gray"
  | "gray-light"
  | "gray-secondary"
  | "lavender"
  | "light"
  | "mint"
  | "mustard"
  | "navy-blue"
  | "peach";

export type IconTagType = "div" | "span";

export type IconSizeType = 16 | 24 | 32 | 40 | 56 | 80 | 104;

// TODO Move common props to common object
export type IconPropsType = {
  [x: string]: any;
} & (
  | {
      className?: string;
      color?: IconColorType;
      size?: IconSizeType;
      tag?: IconTagType;
      children?: null;
      type: IconTypeType;
      // Additional
      reverse?: boolean;
    }
  | {
      className?: string;
      color?: IconColorType;
      size?: IconSizeType;
      tag?: IconTagType;
      children: ChildrenParamType;
      type?: null;
      // Additional
      reverse?: boolean;
    }
);

const sg = "sg-icon";
const SGD = `${sg}--`;

class Icon {
  type: IconTypeType;
  size: IconSizeType;
  color: IconColorType;
  element: HTMLElement;
  svg: SVGSVGElement;
  use: SVGUseElement;

  constructor({
    type,
    size,
    color,
    className,
    tag = "div",
    reverse,
    children,
    ...props
  }: IconPropsType) {
    this.type = type;
    this.size = size;
    this.color = color;

    const iconClass = clsx(
      sg,
      {
        [SGD + String(color)]: color,
        [`${SGD}x${String(size)}`]: size,
        [`${SGD}reverse`]: reverse,
      },
      className,
    );

    if (type) {
      this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      this.use = document.createElementNS("http://www.w3.org/2000/svg", "use");

      this.svg.appendChild(this.use);

      this.svg.classList.add(`${sg}__svg`);
      this.use.setAttributeNS(
        "http://www.w3.org/1999/xlink",
        "xlink:href",
        `#icon-${type}`,
      );
    }

    this.element = CreateElement({
      tag,
      className: iconClass,
      children: [children, this.svg],
      ...props,
    });
  }

  ChangeSize(size: IconSizeType) {
    if (size === this.size) return this;

    this.element.classList.remove(`${SGD}x${String(this.size)}`);
    this.element.classList.add(`${SGD}x${size}`);

    this.size = size;

    return this;
  }

  ChangeColor(color: IconColorType) {
    this.element.classList.remove(SGD + String(this.color));
    this.element.classList.add(SGD + color);

    this.color = color;

    return this;
  }

  ChangeType(type: IconTypeType) {
    if (this.type === type) return this;

    this.use.setAttributeNS(
      "http://www.w3.org/1999/xlink",
      "xlink:href",
      `#icon-${type}`,
    );

    this.type = type;

    return this;
  }

  TogglePulse() {
    this.element.classList.toggle(`${SGD}pulse`);

    return this;
  }
}

export default Icon;
