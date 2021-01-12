import clsx from "clsx";
import type { ChildrenParamType } from "@style-guide/helpers/AddChildren";
import CreateElement from "@components/CreateElement";
import Icon from "./Icon";
import type { CommonComponentPropsType } from "./helpers/SetProps";

const SG = "sg-toplayer";
const SGD = `${SG}--`;
const SGL = `${SG}__`;

type CommonToplayerSizeType = "small" | "medium" | "large";
type ToplayerSizeType = CommonToplayerSizeType | "90prc" | "fit-content";

export type ToplayerPropsType = {
  children?: ChildrenParamType;
  onClose?: (event: MouseEvent | KeyboardEvent) => void;
  size?: ToplayerSizeType;
  maxSize?: CommonToplayerSizeType;
  lead?: boolean;
  fill?: boolean;
  modal?: boolean;
  withBugbox?: boolean;
  smallSpaced?: boolean;
  splashScreen?: boolean;
  limitedWidth?: boolean;
  row?: boolean;
  noPadding?: boolean;
  transparent?: boolean;
  className?: string;
} & CommonComponentPropsType;

export default class Toplayer {
  closeIconContainer: HTMLDivElement;
  wrapper: HTMLDivElement;
  element: HTMLDivElement;

  constructor({
    children,
    onClose,
    size,
    maxSize,
    lead,
    fill,
    modal,
    withBugbox,
    smallSpaced,
    splashScreen,
    limitedWidth,
    row,
    noPadding,
    transparent,
    className,
    ...props
  }: ToplayerPropsType) {
    const topLayerClassName = clsx(
      SG,
      {
        [`${SGD}lead`]: lead,
        [`${SGD}fill`]: fill,
        [`${SGD}modal`]: modal,
        [`${SGD}with-bugbox`]: withBugbox,
        [`${SGD}small-spaced`]: smallSpaced,
        [`${SGD}splash-screen`]: splashScreen,
        [`${SGD}limited-width`]: limitedWidth,
        [`${SGD}row`]: row,
        [`${SGD}transparent`]: transparent,
        [SGD + size]: size,
        [`${SGD}max-width-${size}`]: maxSize,
      },
      className,
    );

    const toplayerWrapperClassName = clsx(`${SGL}wrapper`, {
      [`${SGL}wrapper--no-padding`]: noPadding,
    });

    this.wrapper = CreateElement({
      tag: "div",
      children,
      className: toplayerWrapperClassName,
    });

    if (onClose)
      this.closeIconContainer = CreateElement({
        tag: "div",
        className: `${SGL}close`,
        onClick: onClose,
        children: new Icon({
          size: 24,
          type: "close",
          color: "gray-secondary",
        }),
      });

    this.element = CreateElement({
      ...props,
      tag: "div",
      children: [this.closeIconContainer, this.wrapper],
      className: topLayerClassName,
    });
  }
}
