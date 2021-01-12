import HTMLDecode from "./HTMLDecode";

type PropsType = {
  decode?: boolean;
  noTitle?: boolean;
};

const defaultLatexURL = `//tex.z-dn.net/?f=`;

export default function replaceLatexWithURL(
  _content: string,
  props: PropsType = {},
) {
  if (!_content || typeof _content !== "string") return _content;

  let content = _content;

  if (props.decode) {
    content = HTMLDecode(content);
  }

  content = content
    // https://regex101.com/r/JKt5LV/1
    // .replace(/https?:\/\/(tex\..*?\.)/gi, "//$1")
    // https://regex101.com/r/G0ZbCI/1
    .replace(/(?:https?:)?\/\/(tex\..*?\/\?f=)/gi, defaultLatexURL)
    // .replace(/(?:\r\n|\n)/g, "")
    // https://regex101.com/r/XKRwQN/1
    .replace(/\[tex\](.*?)\[\/tex\]/gis, (_, _latex: string) => {
      const latex = _latex.replace(/"/g, `&#x22;`).replace(/^\s+|\s+$|\r/g, "");

      const latexEncodedPath = window.encodeURIComponent(
        latex.replace(/ +/g, " ").replace(/&amp;/g, "&"),
      );

      /* if (!latex.startsWith("\\")) {
          latexEncodedPath = `%5C${latexEncodedPath}`;
        } */

      return `<div><img class="latex" src="${defaultLatexURL}${latexEncodedPath}"${
        props.noTitle ? "" : ` title="${latex.replace(/\\\\ ?/g, "\n")}"`
      }></div>`;
    });

  return content;
}
