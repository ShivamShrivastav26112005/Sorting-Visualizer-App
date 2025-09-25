let isAnimating = false;
let sortingSpeed = 500;
let treeSpeed = 500;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const playSound = () => {
  const audio = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.frequency.value = 800;
  gain.gain.setValueAtTime(0.1,audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01,audio.currentTime+0.1);
  osc.start(audio.currentTime);
  osc.stop(audio.currentTime+0.1);
};

// --- Tab switching ---
document.querySelectorAll('.nav-tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

class SortingVisualizer {
  constructor() {
    this.array = [];
    this.isSorting = false;
    this.speed = 500;
    this.algorithm = 'bubble';

    this.init();
  }

  init() {
    // Event listeners
    document.getElementById('generateArray').addEventListener('click', () => this.generateArray());
    document.getElementById('setCustomArray').addEventListener('click', () => this.setCustomArray());
    document.getElementById('startSort').addEventListener('click', () => this.startSort());
    document.getElementById('stopSort').addEventListener('click', () => this.stopSort());
    document.getElementById('sortingAlgorithm').addEventListener('change', (e) => {
      this.algorithm = e.target.value;
      this.updateComplexityInfo();
    });
    document.getElementById('sortSpeed').addEventListener('input', (e) => {
      this.speed = 1100 - (e.target.value * 100);
      document.getElementById('speedValue').textContent = e.target.value;
    });

    // Generate initial array
    this.generateArray();
    this.updateComplexityInfo();
  }

  generateArray() {
    const size = parseInt(document.getElementById('arraySize').value) || 10;
    this.array = [];
    for (let i = 0; i < size; i++) {
      this.array.push(Math.floor(Math.random() * 300) + 10);
    }
    this.renderArray();
  }

  setCustomArray() {
    const input = document.getElementById('customArray').value;
    const values = input.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
    if (values.length > 0) {
      this.array = values;
      this.renderArray();
    } else {
      alert('Please enter valid numbers separated by commas.');
    }
  }

  renderArray(highlights = []) {
    const container = document.getElementById('sortingContainer');
    container.innerHTML = '';
    this.array.forEach((value, index) => {
      const bar = document.createElement('div');
      bar.className = 'bar';
      bar.id = `bar-${index}`;
      bar.style.height = `${value}px`;
      bar.textContent = value;
      if (highlights.includes(index)) {
        bar.classList.add('highlight');
      }
      container.appendChild(bar);
    });
  }

  async startSort() {
    if (this.isSorting) return;
    this.isSorting = true;
    document.getElementById('startSort').disabled = true;
    document.getElementById('stopSort').disabled = false;

    try {
      switch (this.algorithm) {
        case 'bubble':
          await this.bubbleSort();
          break;
        case 'selection':
          await this.selectionSort();
          break;
        case 'insertion':
          await this.insertionSort();
          break;
        case 'merge':
          await this.mergeSort();
          break;
        case 'quick':
          await this.quickSort();
          break;
      }
    } catch (error) {
      if (error.message !== 'Sorting stopped') {
        console.error(error);
      }
    }

    this.isSorting = false;
    document.getElementById('startSort').disabled = false;
    document.getElementById('stopSort').disabled = true;
  }

  stopSort() {
    this.isSorting = false;
    document.getElementById('startSort').disabled = false;
    document.getElementById('stopSort').disabled = true;
  }

  async bubbleSort() {
    const n = this.array.length;
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (!this.isSorting) throw new Error('Sorting stopped');

        this.renderArray([j, j + 1]);
        await sleep(this.speed);

        if (this.array[j] > this.array[j + 1]) {
          [this.array[j], this.array[j + 1]] = [this.array[j + 1], this.array[j]];
          this.renderArray([j, j + 1]);
          playSound();
          await sleep(this.speed);
        }
      }
    }
    this.renderArray();
  }

  async selectionSort() {
    const n = this.array.length;
    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      for (let j = i + 1; j < n; j++) {
        if (!this.isSorting) throw new Error('Sorting stopped');

        this.renderArray([minIdx, j]);
        await sleep(this.speed);

        if (this.array[j] < this.array[minIdx]) {
          minIdx = j;
        }
      }
      if (minIdx !== i) {
        [this.array[i], this.array[minIdx]] = [this.array[minIdx], this.array[i]];
        this.renderArray([i, minIdx]);
        playSound();
        await sleep(this.speed);
      }
    }
    this.renderArray();
  }

  async insertionSort() {
    const n = this.array.length;
    for (let i = 1; i < n; i++) {
      let key = this.array[i];
      let j = i - 1;

      while (j >= 0 && this.array[j] > key) {
        if (!this.isSorting) throw new Error('Sorting stopped');

        this.renderArray([j, j + 1]);
        await sleep(this.speed);

        this.array[j + 1] = this.array[j];
        j--;
      }
      this.array[j + 1] = key;
      this.renderArray([j + 1]);
      playSound();
      await sleep(this.speed);
    }
    this.renderArray();
  }

  async mergeSort() {
    await this.mergeSortHelper(0, this.array.length - 1);
    this.renderArray();
  }

  async mergeSortHelper(left, right) {
    if (left >= right) return;

    const mid = Math.floor((left + right) / 2);
    await this.mergeSortHelper(left, mid);
    await this.mergeSortHelper(mid + 1, right);
    await this.merge(left, mid, right);
  }

  async merge(left, mid, right) {
    const n1 = mid - left + 1;
    const n2 = right - mid;
    const L = this.array.slice(left, mid + 1);
    const R = this.array.slice(mid + 1, right + 1);

    let i = 0, j = 0, k = left;

    while (i < n1 && j < n2) {
      if (!this.isSorting) throw new Error('Sorting stopped');

      this.renderArray([k]);
      await sleep(this.speed);

      if (L[i] <= R[j]) {
        this.array[k] = L[i];
        i++;
      } else {
        this.array[k] = R[j];
        j++;
      }
      k++;
      playSound();
    }

    while (i < n1) {
      this.array[k] = L[i];
      i++;
      k++;
    }

    while (j < n2) {
      this.array[k] = R[j];
      j++;
      k++;
    }
  }

  async quickSort() {
    await this.quickSortHelper(0, this.array.length - 1);
    this.renderArray();
  }

  async quickSortHelper(low, high) {
    if (low < high) {
      const pi = await this.partition(low, high);
      await this.quickSortHelper(low, pi - 1);
      await this.quickSortHelper(pi + 1, high);
    }
  }

  async partition(low, high) {
    const pivot = this.array[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
      if (!this.isSorting) throw new Error('Sorting stopped');

      this.renderArray([i + 1, j, high]);
      await sleep(this.speed);

      if (this.array[j] < pivot) {
        i++;
        [this.array[i], this.array[j]] = [this.array[j], this.array[i]];
        playSound();
      }
    }
    [this.array[i + 1], this.array[high]] = [this.array[high], this.array[i + 1]];
    return i + 1;
  }

  updateComplexityInfo() {
    const complexities = {
      bubble: { time: 'O(n²)', space: 'O(1)', stability: 'Stable' },
      selection: { time: 'O(n²)', space: 'O(1)', stability: 'Unstable' },
      insertion: { time: 'O(n²)', space: 'O(1)', stability: 'Stable' },
      merge: { time: 'O(n log n)', space: 'O(n)', stability: 'Stable' },
      quick: { time: 'O(n²)', space: 'O(log n)', stability: 'Unstable' }
    };

    const info = complexities[this.algorithm];
    document.getElementById('currentAlgorithm').textContent = `${this.algorithm.charAt(0).toUpperCase() + this.algorithm.slice(1)} Sort`;
    document.getElementById('timeComplexity').textContent = info.time;
    document.getElementById('spaceComplexity').textContent = info.space;
    document.getElementById('stability').textContent = info.stability;
  }
}

class LinkedListVisualizer {
  constructor() {
    this.head = null;
    this.length = 0;
    this.init();
  }

  init() {
    document.getElementById('addToHead').addEventListener('click', () => this.addToHead());
    document.getElementById('addToTail').addEventListener('click', () => this.addToTail());
    document.getElementById('insertAt').addEventListener('click', () => this.insertAt());
    document.getElementById('removeHead').addEventListener('click', () => this.removeHead());
    document.getElementById('removeTail').addEventListener('click', () => this.removeTail());
    document.getElementById('searchNode').addEventListener('click', () => this.searchNode());
    document.getElementById('clearList').addEventListener('click', () => this.clearList());
    this.render();
  }

  addToHead() {
    const value = parseInt(document.getElementById('nodeValue').value);
    if (isNaN(value)) return;

    const newNode = { value, next: this.head };
    this.head = newNode;
    this.length++;
    this.render();
  }

  addToTail() {
    const value = parseInt(document.getElementById('nodeValue').value);
    if (isNaN(value)) return;

    const newNode = { value, next: null };
    if (!this.head) {
      this.head = newNode;
    } else {
      let current = this.head;
      while (current.next) {
        current = current.next;
      }
      current.next = newNode;
    }
    this.length++;
    this.render();
  }

  insertAt() {
    const value = parseInt(document.getElementById('nodeValue').value);
    const index = parseInt(document.getElementById('insertIndex').value);
    if (isNaN(value) || isNaN(index) || index < 0 || index > this.length) return;

    if (index === 0) {
      this.addToHead();
      return;
    }

    const newNode = { value, next: null };
    let current = this.head;
    for (let i = 0; i < index - 1; i++) {
      current = current.next;
    }
    newNode.next = current.next;
    current.next = newNode;
    this.length++;
    this.render();
  }

  removeHead() {
    if (!this.head) return;
    this.head = this.head.next;
    this.length--;
    this.render();
  }

  removeTail() {
    if (!this.head) return;
    if (!this.head.next) {
      this.head = null;
    } else {
      let current = this.head;
      while (current.next.next) {
        current = current.next;
      }
      current.next = null;
    }
    this.length--;
    this.render();
  }

  searchNode() {
    const value = parseInt(document.getElementById('searchValue').value);
    if (isNaN(value)) return;

    let current = this.head;
    let index = 0;
    while (current) {
      if (current.value === value) {
        alert(`Value ${value} found at index ${index}`);
        return;
      }
      current = current.next;
      index++;
    }
    alert(`Value ${value} not found in the list`);
  }

  clearList() {
    this.head = null;
    this.length = 0;
    this.render();
  }

  render() {
    const container = document.getElementById('linkedListContainer');
    container.innerHTML = '';

    if (!this.head) {
      container.innerHTML = '<div class="node">NULL</div>';
    } else {
      let current = this.head;
      while (current) {
        const nodeDiv = document.createElement('div');
        nodeDiv.className = 'node';
        nodeDiv.textContent = current.value;
        container.appendChild(nodeDiv);

        if (current.next) {
          const arrow = document.createElement('div');
          arrow.className = 'arrow';
          arrow.textContent = '→';
          container.appendChild(arrow);
        }
        current = current.next;
      }
      const nullDiv = document.createElement('div');
      nullDiv.className = 'node';
      nullDiv.textContent = 'NULL';
      container.appendChild(nullDiv);
    }

    document.getElementById('listLength').textContent = this.length;
  }
}

class StackVisualizer {
  constructor() {
    this.stack = [];
    this.init();
  }

  init() {
    document.getElementById('pushStack').addEventListener('click', () => this.push());
    document.getElementById('popStack').addEventListener('click', () => this.pop());
    document.getElementById('peekStack').addEventListener('click', () => this.peek());
    document.getElementById('clearStack').addEventListener('click', () => this.clear());
    this.render();
  }

  push() {
    const value = parseInt(document.getElementById('stackValue').value);
    if (isNaN(value)) return;
    this.stack.push(value);
    this.render();
  }

  pop() {
    if (this.stack.length === 0) {
      alert('Stack is empty');
      return;
    }
    const popped = this.stack.pop();
    alert(`Popped: ${popped}`);
    this.render();
  }

  peek() {
    if (this.stack.length === 0) {
      alert('Stack is empty');
      return;
    }
    alert(`Top element: ${this.stack[this.stack.length - 1]}`);
  }

  clear() {
    this.stack = [];
    this.render();
  }

  render() {
    const container = document.getElementById('stackContainer');
    container.innerHTML = '';

    if (this.stack.length === 0) {
      container.innerHTML = '<div class="stack-empty">Stack is empty</div>';
    } else {
      this.stack.forEach((value, index) => {
        const item = document.createElement('div');
        item.className = 'stack-item';
        item.textContent = value;
        if (index === this.stack.length - 1) {
          item.classList.add('top');
        }
        container.appendChild(item);
      });
    }

    document.getElementById('stackSize').textContent = this.stack.length;
    document.getElementById('stackTop').textContent = this.stack.length > 0 ? this.stack[this.stack.length - 1] : 'Empty';
  }
}

class QueueVisualizer {
  constructor() {
    this.queue = [];
    this.init();
  }

  init() {
    document.getElementById('enqueue').addEventListener('click', () => this.enqueue());
    document.getElementById('dequeue').addEventListener('click', () => this.dequeue());
    document.getElementById('frontQueue').addEventListener('click', () => this.front());
    document.getElementById('rearQueue').addEventListener('click', () => this.rear());
    document.getElementById('clearQueue').addEventListener('click', () => this.clear());
    this.render();
  }

  enqueue() {
    const value = parseInt(document.getElementById('queueValue').value);
    if (isNaN(value)) return;
    this.queue.push(value);
    this.render();
  }

  dequeue() {
    if (this.queue.length === 0) {
      alert('Queue is empty');
      return;
    }
    const dequeued = this.queue.shift();
    alert(`Dequeued: ${dequeued}`);
    this.render();
  }

  front() {
    if (this.queue.length === 0) {
      alert('Queue is empty');
      return;
    }
    alert(`Front element: ${this.queue[0]}`);
  }

  rear() {
    if (this.queue.length === 0) {
      alert('Queue is empty');
      return;
    }
    alert(`Rear element: ${this.queue[this.queue.length - 1]}`);
  }

  clear() {
    this.queue = [];
    this.render();
  }

  render() {
    const container = document.getElementById('queueContainer');
    container.innerHTML = '';

    if (this.queue.length === 0) {
      container.innerHTML = '<div class="queue-empty">Queue is empty</div>';
    } else {
      this.queue.forEach((value, index) => {
        const item = document.createElement('div');
        item.className = 'queue-item';
        item.textContent = value;
        if (index === 0) {
          item.classList.add('front');
        }
        if (index === this.queue.length - 1) {
          item.classList.add('rear');
        }
        container.appendChild(item);
      });
    }

    document.getElementById('queueSize').textContent = this.queue.length;
    document.getElementById('queueFront').textContent = this.queue.length > 0 ? this.queue[0] : 'Empty';
    document.getElementById('queueRear').textContent = this.queue.length > 0 ? this.queue[this.queue.length - 1] : 'Empty';
  }
}

class BinarySearchTree {
  constructor() {
    this.root = null;
    this.speed = 500;
    this.init();
  }

  init() {
    document.getElementById('insertTree').addEventListener('click', () => this.insert());
    document.getElementById('deleteTree').addEventListener('click', () => this.delete());
    document.getElementById('inOrder').addEventListener('click', () => this.inOrderTraversal());
    document.getElementById('preOrder').addEventListener('click', () => this.preOrderTraversal());
    document.getElementById('postOrder').addEventListener('click', () => this.postOrderTraversal());
    document.getElementById('levelOrder').addEventListener('click', () => this.levelOrderTraversal());
    document.getElementById('clearTree').addEventListener('click', () => this.clear());
    document.getElementById('treeSpeed').addEventListener('input', (e) => {
      this.speed = 1100 - (e.target.value * 100);
      document.getElementById('treeSpeedValue').textContent = e.target.value;
    });
    this.render();
  }

  insert() {
    const value = parseInt(document.getElementById('treeValue').value);
    if (isNaN(value)) return;
    this.root = this.insertNode(this.root, value);
    this.render();
  }

  delete() {
    const value = parseInt(document.getElementById('deleteValue').value);
    if (isNaN(value)) return;
    this.root = this.deleteNode(this.root, value);
    this.render();
    alert(`Node with value ${value} has been deleted.`);
  }

  insertNode(node, value) {
    if (node === null) {
      return { value, left: null, right: null };
    }
    if (value < node.value) {
      node.left = this.insertNode(node.left, value);
    } else if (value > node.value) {
      node.right = this.insertNode(node.right, value);
    }
    return node;
  }

  deleteNode(node, value) {
    if (node === null) return null;

    if (value < node.value) {
      node.left = this.deleteNode(node.left, value);
    } else if (value > node.value) {
      node.right = this.deleteNode(node.right, value);
    } else {
      // Node to be deleted found
      if (!node.left) return node.right;
      if (!node.right) return node.left;

      // Node with two children: Get inorder successor (smallest in the right subtree)
      let minLargerNode = node.right;
      while (minLargerNode.left) {
        minLargerNode = minLargerNode.left;
      }
      node.value = minLargerNode.value;
      node.right = this.deleteNode(node.right, minLargerNode.value);
    }
    return node;
  }

  inOrderTraversal() {
    const result = [];
    this._inOrder(this.root, result);
    this.showTraversalResult(result);
  }

  _inOrder(node, result) {
    if (!node) return;
    this._inOrder(node.left, result);
    result.push(node.value);
    this._inOrder(node.right, result);
  }

  preOrderTraversal() {
    const result = [];
    this._preOrder(this.root, result);
    this.showTraversalResult(result);
  }

  _preOrder(node, result) {
    if (!node) return;
    result.push(node.value);
    this._preOrder(node.left, result);
    this._preOrder(node.right, result);
  }

  postOrderTraversal() {
    const result = [];
    this._postOrder(this.root, result);
    this.showTraversalResult(result);
  }

  _postOrder(node, result) {
    if (!node) return;
    this._postOrder(node.left, result);
    this._postOrder(node.right, result);
    result.push(node.value);
  }

  levelOrderTraversal() {
    const result = [];
    const queue = [];
    if (this.root) queue.push(this.root);

    while (queue.length > 0) {
      const node = queue.shift();
      result.push(node.value);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    this.showTraversalResult(result);
  }

  showTraversalResult(result) {
    const container = document.getElementById('traversalResult');
    container.textContent = result.length > 0 ? result.join(', ') : 'None';
    document.getElementById('traversalOrder').textContent = 'Traversal done';
  }

  clear() {
    this.root = null;
    this.render();
    document.getElementById('traversalResult').textContent = 'None';
    document.getElementById('traversalOrder').textContent = 'None';
    document.getElementById('treeNodes').textContent = '0';
    document.getElementById('treeHeight').textContent = '0';
  }

  render() {
    const container = document.getElementById('treeContainer');
    container.innerHTML = '';
    if (!this.root) {
      container.innerHTML = '<p>Insert nodes to build your Binary Search Tree</p>';
      document.getElementById('treeNodes').textContent = '0';
      document.getElementById('treeHeight').textContent = '0';
      return;
    }
    this.renderTree(this.root, container, container.clientWidth / 2, 20);
    document.getElementById('treeNodes').textContent = this.countNodes(this.root);
    document.getElementById('treeHeight').textContent = this.getHeight(this.root);
  }

  renderTree(node, container, x, y) {
    if (!node) return;

    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'tree-node';
    nodeDiv.textContent = node.value;
    nodeDiv.style.position = 'absolute';
    nodeDiv.style.left = `${x}px`;
    nodeDiv.style.top = `${y}px`;
    container.appendChild(nodeDiv);

    const horizontalSpacing = 60;
    const verticalSpacing = 80;

    if (node.left) {
      const leftX = x - horizontalSpacing;
      const childY = y + verticalSpacing;
      this.drawLine(container, x + 15, y + 30, leftX + 15, childY);
      this.renderTree(node.left, container, leftX, childY);
    }
    if (node.right) {
      const rightX = x + horizontalSpacing;
      const childY = y + verticalSpacing;
      this.drawLine(container, x + 15, y + 30, rightX + 15, childY);
      this.renderTree(node.right, container, rightX, childY);
    }
  }

  drawLine(container, x1, y1, x2, y2) {
    const line = document.createElement('div');
    line.className = 'tree-line';
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    line.style.width = `${length}px`;
    line.style.transform = `rotate(${angle}deg)`;
    line.style.position = 'absolute';
    line.style.left = `${x1}px`;
    line.style.top = `${y1}px`;
    container.appendChild(line);
  }

  countNodes(node) {
    if (!node) return 0;
    return 1 + this.countNodes(node.left) + this.countNodes(node.right);
  }

  getHeight(node) {
    if (!node) return 0;
    return 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
  }
}

// Initialize all visualizers on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  window.sortingVisualizer = new SortingVisualizer();
  window.linkedListVisualizer = new LinkedListVisualizer();
  window.stackVisualizer = new StackVisualizer();
  window.queueVisualizer = new QueueVisualizer();
  window.binarySearchTree = new BinarySearchTree();
});
