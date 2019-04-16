const LinkedList = require('./LinkList');

const linkListMaker = (arr) => {
  const ll = new LinkedList();

  for(let i = 0; i < arr.length ; i++) {
    ll.insertLast(arr[i])
  }

  return ll;
}

module.exports = linkListMaker;