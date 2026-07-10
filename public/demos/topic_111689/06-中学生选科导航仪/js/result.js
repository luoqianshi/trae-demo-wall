function saveResult(){
  alert('已保存测评结果，可分享给家长和老师参考');
}

function goToMajor(category) {
  location.href = 'major.html?category=' + encodeURIComponent(category);
}

console.log('结果页已加载');
