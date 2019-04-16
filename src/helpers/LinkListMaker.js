const LinkedList = require('./LinkList');

const linkListMaker = (arr, headNode) => {
  const ll = new LinkedList();

  let currNode = arr.find(item => {
    return item.id === headNode.id;
  });

  while (currNode !== null) {
    ll.insertLast(currNode);
    if (currNode.next !== null) {
      currNode = arr.find(item => {
        return item.id === currNode.next;
      });
    } else {
      currNode = null;
    }
  }

  return ll;
};

module.exports = linkListMaker;
