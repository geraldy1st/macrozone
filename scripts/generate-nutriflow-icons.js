const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const imagesDir = path.join(__dirname, "..", "assets", "images");

const exportsList = [
  { svg: "nutriflow-icon.svg", png: "icon.png", size: 1024 },
  { svg: "nutriflow-icon.svg", png: "splash-icon.png", size: 1024 },
  { svg: "nutriflow-icon-foreground.svg", png: "android-icon-foreground.png", size: 1024 },
  { svg: "nutriflow-icon-monochrome.svg", png: "android-icon-monochrome.png", size: 1024 },
  { svg: "nutriflow-icon.svg", png: "favicon.png", size: 48 },
];

async function solidBackgroundPng(outputPath, size, color) {
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: color,
    },
  })
    .png()
    .toFile(outputPath);
}

async function svgToPng(svgName, pngName, size) {
  const svgPath = path.join(imagesDir, svgName);
  const pngPath = path.join(imagesDir, pngName);
  await sharp(fs.readFileSync(svgPath)).resize(size, size).png().toFile(pngPath);
  console.log(`Created ${pngName} (${size}x${size})`);
}

async function main() {
  for (const item of exportsList) {
    await svgToPng(item.svg, item.png, item.size);
  }

  const bgPath = path.join(imagesDir, "android-icon-background.png");
  await solidBackgroundPng(bgPath, 1024, "#1a1a2e");
  console.log("Created android-icon-background.png (1024x1024)");

  fs.copyFileSync(
    path.join(imagesDir, "nutriflow-icon.svg"),
    path.join(imagesDir, "nutriflow-logo.svg"),
  );
  console.log("Created nutriflow-logo.svg");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});