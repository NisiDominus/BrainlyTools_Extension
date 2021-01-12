import { src, dest } from "gulp";

export default () => {
  let assets = [
    {
      src: ["./src/icons/**/*", "!./src/icons/**/*.psd"],
      dest: `/icons`,
    },
    {
      src: "./src/_locales/**/*",
      dest: `/_locales`,
    },
    {
      src: `./src/images/**/*`,
      dest: `/images`,
    },
    {
      src: "./src/images/shared/**/*",
      dest: `/images`,
    },
    {
      src: ["./src/**/*.html", "!./src/scripts/**/*.html"],
      dest: ``,
    },
    {
      src: "src/scripts/**/*.min.js",
      dest: `/scripts`,
    },
    {
      src: "src/configs/*.json",
      dest: `/configs`,
    },
  ];

  assets = assets.map(asset =>
    src(asset.src).pipe(dest(`${process.env.BUILD_FOLDER}${asset.dest}`)),
  );

  return assets[assets.length - 1];
};
