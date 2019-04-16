const LinkedList = require('./LinkList');

const linkListMaker = arr => {
  const ll = new LinkedList();
  let currNode = arr[0];

  while (currNode !== null) {
    ll.insertLast(currNode);
    currNode = currNode.next;
  }

  return ll;
};

module.exports = linkListMaker;
