const { Jimp } = require("jimp");
const path = require("path");

async function cropImages() {
  const publicDir = path.join(__dirname, "public");
  const mobileBanner = path.join(publicDir, "sorteio_mobile.png");

  try {
    const mobileImg = await Jimp.read(mobileBanner);
    mobileImg.autocrop(); 
    await mobileImg.write(mobileBanner);
    console.log("Mobile banner cropped successfully.");
  } catch (error) {
    console.error("Error cropping mobile banner:", error);
  }
}

cropImages();
