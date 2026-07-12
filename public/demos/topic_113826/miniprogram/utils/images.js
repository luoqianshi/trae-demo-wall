// miniprogram/utils/images.js
// 集中管理所有本地图片路径
const IMAGES = {
  dog: {
    yellow: "/pic/dog_yellow_xiaohuang.jpg",
    brown: "/pic/dog_brown_doubao.jpg",
    golden: "/pic/dog_golden_mantou.jpg",
    black: "/pic/dog_black_zhima.jpg",
    white: "/pic/dog_white_mantou.jpg",
  },
  cat: {
    meiduan: "/pic/cat_meiduan_tuanzi.jpg",
    yingduan: "/pic/cat_yingduan_naicha.jpg",
    blue: "/pic/cat_blue_yingduan.jpg",
    orange: "/pic/cat_orange_tangguo.jpg",
    tabby: "/pic/cat_tabby_tangyuan.jpg",
  },
};

function getImage(key) {
  const parts = key.split(".");
  if (parts.length === 2) {
    const [category, name] = parts;
    return IMAGES[category] && IMAGES[category][name]
      ? IMAGES[category][name]
      : "";
  }
  return "";
}

module.exports = { IMAGES, getImage };
