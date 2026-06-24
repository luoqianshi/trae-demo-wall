// 知识树数据已移至 data.js

const hotWords = ['数学', '软件工程', '心理学', '理财', '哲学', '物理学', 'TRAE IDE', '线性代数'];

function getAllNodeNames() {
  const names = new Set();
  for (const tree of knowledgeTrees) {
    traverseAndCollect(tree.root, names);
  }
  return Array.from(names);
}

function traverseAndCollect(node, names) {
  names.add(node.name);
  for (const child of node.children) {
    traverseAndCollect(child, names);
  }
}

function searchNodes(keyword) {
  const results = [];
  const lowerKeyword = keyword.toLowerCase();
  
  for (const tree of knowledgeTrees) {
    traverseAndSearch(tree.root, tree, [], results, lowerKeyword);
  }
  
  return results;
}

function traverseAndSearch(node, tree, path, results, keyword) {
  const currentPath = [...path, node.name];
  
  if (node.name.toLowerCase().includes(keyword)) {
    results.push({
      tree: tree,
      node: node,
      path: currentPath
    });
  }
  
  if (node.children) {
    for (const child of node.children) {
      traverseAndSearch(child, tree, currentPath, results, keyword);
    }
  }
}

function findTreeById(treeId) {
  return knowledgeTrees.find(t => t.id === treeId);
}

function findNode(root, nodeId) {
  if (root.id === nodeId) return root;
  for (const child of root.children) {
    const found = findNode(child, nodeId);
    if (found) return found;
  }
  return null;
}

function getNodePath(root, targetId, path = []) {
  if (root.id === targetId) {
    return [...path, root.name];
  }
  
  for (const child of root.children) {
    const result = getNodePath(child, targetId, [...path, root.name]);
    if (result) return result;
  }
  
  return null;
}

function countNodes(node) {
  let count = 1;
  for (const child of node.children) {
    count += countNodes(child);
  }
  return count;
}