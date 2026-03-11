// ─────────────────────────────────────────────────────────────────────────────
// QUIZ DATA — 5 questions per program, across all 6 chapters / 20 programs
// ─────────────────────────────────────────────────────────────────────────────

export const QUIZ_CHAPTERS = [
  {
    id: "recursion",
    label: "Recursion",
    icon: "🔁",
    color: "#6c3fdb",
    colorLight: "rgba(108,63,219,0.12)",
    programs: [
      {
        key: "factorial",
        label: "Factorial",
        questions: [
          {
            q: "What is the base case for the factorial function?",
            options: ["n == 1", "n == 0", "n < 0", "n == 2"],
            answer: 1,
            explanation: "factorial(0) = 1 is the base case. Without it, the recursion would never stop.",
          },
          {
            q: "What does factorial(4) evaluate to?",
            options: ["16", "24", "12", "48"],
            answer: 1,
            explanation: "4! = 4 × 3 × 2 × 1 = 24.",
          },
          {
            q: "How many recursive calls does factorial(5) make before hitting the base case?",
            options: ["4", "5", "6", "3"],
            answer: 1,
            explanation: "factorial(5) → factorial(4) → factorial(3) → factorial(2) → factorial(1) → factorial(0). That's 5 recursive calls.",
          },
          {
            q: "What is the time complexity of the recursive factorial function?",
            options: ["O(n²)", "O(log n)", "O(n)", "O(1)"],
            answer: 2,
            explanation: "Each call reduces n by 1, so there are n+1 total calls → O(n) time.",
          },
          {
            q: "What happens if you call factorial(-1) without a guard?",
            options: ["Returns 1", "Returns 0", "Infinite recursion / stack overflow", "Returns -1"],
            answer: 2,
            explanation: "Without a guard for negative numbers, the recursion never reaches n==0 and causes a stack overflow.",
          },
        ],
      },
      {
        key: "fibonacci",
        label: "Fibonacci",
        questions: [
          {
            q: "What is fib(6) using the standard recursive definition?",
            options: ["8", "13", "5", "21"],
            answer: 0,
            explanation: "fib(0)=0, fib(1)=1, fib(2)=1, fib(3)=2, fib(4)=3, fib(5)=5, fib(6)=8.",
          },
          {
            q: "Why is naive recursive Fibonacci exponentially slow?",
            options: [
              "It uses too much memory",
              "It recomputes the same subproblems many times",
              "It has too many base cases",
              "Recursion is always slow",
            ],
            answer: 1,
            explanation: "For example, fib(3) is computed multiple times when computing fib(5). This redundancy causes O(2ⁿ) time.",
          },
          {
            q: "What is the time complexity of naive recursive Fibonacci?",
            options: ["O(n)", "O(n log n)", "O(2ⁿ)", "O(n²)"],
            answer: 2,
            explanation: "Each call branches into two more calls, creating an exponential call tree.",
          },
          {
            q: "How many total calls does fib(4) generate (including all recursive subcalls)?",
            options: ["5", "7", "9", "15"],
            answer: 2,
            explanation: "fib(4) spawns fib(3)+fib(2); fib(3) spawns fib(2)+fib(1); and so on — 9 total calls.",
          },
          {
            q: "What are the two base cases for recursive Fibonacci?",
            options: ["n==0 and n==1", "n==1 and n==2", "n==0 and n==2", "n==-1 and n==0"],
            answer: 0,
            explanation: "fib(0)=0 and fib(1)=1 are both needed to stop the double recursion.",
          },
        ],
      },
      {
        key: "sum_array",
        label: "Sum of Array",
        questions: [
          {
            q: "What is the base case for recursive sum_arr?",
            options: ["Array has one element", "Array is empty (len == 0)", "Array has two elements", "First element is 0"],
            answer: 1,
            explanation: "When the array is empty, there's nothing to sum, so we return 0.",
          },
          {
            q: "What does sum_arr([1, 2, 3, 4]) return?",
            options: ["9", "10", "6", "24"],
            answer: 1,
            explanation: "1+2+3+4 = 10.",
          },
          {
            q: "What is arr[1:] for arr = [5, 3, 8]?",
            options: ["[5, 3]", "[3, 8]", "[5, 8]", "[8]"],
            answer: 1,
            explanation: "arr[1:] slices from index 1 onward: [3, 8].",
          },
          {
            q: "How many recursive calls does sum_arr([1,2,3]) make?",
            options: ["2", "3", "4", "1"],
            answer: 2,
            explanation: "sum_arr([1,2,3]) → sum_arr([2,3]) → sum_arr([3]) → sum_arr([]) → base case. That's 4 calls total (including the base case call).",
          },
          {
            q: "What is the space complexity of recursive sum_arr on an array of length n?",
            options: ["O(1)", "O(log n)", "O(n²)", "O(n)"],
            answer: 3,
            explanation: "Each recursive call adds a new frame to the call stack, resulting in O(n) space.",
          },
        ],
      },
      {
        key: "tower_of_hanoi",
        label: "Tower of Hanoi",
        questions: [
          {
            q: "How many moves does Tower of Hanoi with 3 disks require?",
            options: ["5", "6", "7", "9"],
            answer: 2,
            explanation: "The formula is 2ⁿ - 1. For n=3: 2³-1 = 7 moves.",
          },
          {
            q: "What is the key rule of Tower of Hanoi?",
            options: [
              "You can move multiple disks at once",
              "A larger disk can never be placed on top of a smaller disk",
              "You must always use all three pegs",
              "The smallest disk must always move first",
            ],
            answer: 1,
            explanation: "The only constraint is: no disk may be placed on top of a disk smaller than it.",
          },
          {
            q: "What is the time complexity of the Tower of Hanoi algorithm for n disks?",
            options: ["O(n)", "O(n²)", "O(n log n)", "O(2ⁿ)"],
            answer: 3,
            explanation: "The recurrence T(n) = 2T(n-1) + 1 solves to T(n) = 2ⁿ - 1, i.e. O(2ⁿ).",
          },
          {
            q: "In hanoi(n, src, dst, aux), what is the first recursive call?",
            options: [
              "hanoi(n-1, src, dst, aux)",
              "hanoi(n-1, src, aux, dst)",
              "hanoi(n-1, aux, dst, src)",
              "hanoi(n, src, aux, dst)",
            ],
            answer: 1,
            explanation: "First, move the top n-1 disks from src to aux (using dst as helper): hanoi(n-1, src, aux, dst).",
          },
          {
            q: "How many moves does Tower of Hanoi with 4 disks require?",
            options: ["8", "12", "15", "16"],
            answer: 2,
            explanation: "2⁴ - 1 = 15 moves.",
          },
        ],
      },
    ],
  },
  {
    id: "sorting",
    label: "Sorting Algorithms",
    icon: "📊",
    color: "#1a6fb5",
    colorLight: "rgba(26,111,181,0.12)",
    programs: [
      {
        key: "bubble_sort",
        label: "Bubble Sort",
        questions: [
          {
            q: "What is the worst-case time complexity of Bubble Sort?",
            options: ["O(n log n)", "O(n)", "O(n²)", "O(log n)"],
            answer: 2,
            explanation: "Bubble Sort compares every pair in the worst case, giving O(n²) comparisons.",
          },
          {
            q: "What happens after each full pass of Bubble Sort?",
            options: [
              "The smallest element is placed at the start",
              "The largest unsorted element reaches its final position",
              "The array is fully sorted",
              "Two elements are swapped",
            ],
            answer: 1,
            explanation: "Each pass 'bubbles' the largest remaining element to the end of the unsorted portion.",
          },
          {
            q: "Is Bubble Sort a stable sorting algorithm?",
            options: ["No", "Yes", "Only for integers", "Depends on input"],
            answer: 1,
            explanation: "Bubble Sort is stable — equal elements retain their relative order because we only swap when strictly greater than.",
          },
          {
            q: "What is the best-case time complexity of Bubble Sort (with early-exit optimization)?",
            options: ["O(n²)", "O(n log n)", "O(n)", "O(1)"],
            answer: 2,
            explanation: "With the optimization: if no swaps occur in a pass, the array is sorted. For an already-sorted array, only one pass is needed → O(n).",
          },
          {
            q: "After 2 passes of Bubble Sort on [5,3,1,4,2], which elements are definitely in their final position?",
            options: ["Only 5", "5 and 4", "5, 4, and 3", "None yet"],
            answer: 1,
            explanation: "Each pass places the next-largest element. After 2 passes, 5 (largest) and 4 (second largest) are at the end.",
          },
        ],
      },
      {
        key: "selection_sort",
        label: "Selection Sort",
        questions: [
          {
            q: "How does Selection Sort find the element to place next?",
            options: [
              "By comparing adjacent elements",
              "By finding the minimum in the unsorted portion",
              "By splitting the array in half",
              "By picking a random pivot",
            ],
            answer: 1,
            explanation: "In each iteration, Selection Sort scans the unsorted portion to find its minimum and swaps it to the front.",
          },
          {
            q: "What is the maximum number of swaps Selection Sort performs on n elements?",
            options: ["n²", "n log n", "n", "n-1"],
            answer: 3,
            explanation: "Selection Sort makes at most n-1 swaps — exactly one per outer loop iteration.",
          },
          {
            q: "Is Selection Sort stable?",
            options: ["Yes, always", "No, it is not stable", "Only with small arrays", "Yes, if no duplicates"],
            answer: 1,
            explanation: "Selection Sort is NOT stable. Swapping non-adjacent elements can change the relative order of equal elements.",
          },
          {
            q: "What is the time complexity of Selection Sort regardless of input?",
            options: ["O(n) best case", "O(n log n)", "O(n²) always", "O(n) for sorted input"],
            answer: 2,
            explanation: "Selection Sort always scans the entire remaining unsorted portion, giving O(n²) in all cases.",
          },
          {
            q: "After the 3rd pass of Selection Sort on [64, 25, 12, 22, 11], what does the array look like?",
            options: ["[11, 12, 22, 25, 64]", "[11, 12, 22, 64, 25]", "[11, 12, 25, 22, 64]", "[11, 12, 64, 22, 25]"],
            answer: 1,
            explanation: "Pass 1: 11 placed. Pass 2: 12 placed. Pass 3: 22 placed. Result: [11, 12, 22, 64, 25].",
          },
        ],
      },
      {
        key: "insertion_sort",
        label: "Insertion Sort",
        questions: [
          {
            q: "What is Insertion Sort's best-case time complexity?",
            options: ["O(n²)", "O(n log n)", "O(n)", "O(1)"],
            answer: 2,
            explanation: "For a nearly-sorted or already-sorted array, the inner loop rarely runs → O(n) comparisons.",
          },
          {
            q: "What analogy best describes Insertion Sort?",
            options: [
              "Repeatedly finding the minimum",
              "Sorting playing cards in your hand",
              "Splitting and merging arrays",
              "Partitioning around a pivot",
            ],
            answer: 1,
            explanation: "Insertion Sort works like placing each new card in the correct position among already-sorted cards in your hand.",
          },
          {
            q: "When inserting key=5 into sorted portion [1, 3, 7, 9], which elements shift right?",
            options: ["Only 7", "7 and 9", "3, 7, and 9", "None"],
            answer: 1,
            explanation: "Only elements greater than 5 shift: 7 and 9 shift right, opening a spot for 5 → [1, 3, 5, 7, 9].",
          },
          {
            q: "Is Insertion Sort stable?",
            options: ["No", "Yes", "Only for even-length arrays", "Only when sorted"],
            answer: 1,
            explanation: "Insertion Sort is stable — equal elements are never swapped past each other since we only shift when strictly greater.",
          },
          {
            q: "Which real-world sorting library uses Insertion Sort internally for small arrays?",
            options: ["Heap Sort", "Python's Timsort", "Radix Sort", "Shell Sort"],
            answer: 1,
            explanation: "Python's Timsort (and Java's Arrays.sort for objects) uses Insertion Sort for small subarrays (< 64 elements) due to its low overhead.",
          },
        ],
      },
      {
        key: "merge_sort",
        label: "Merge Sort",
        questions: [
          {
            q: "What is the time complexity of Merge Sort in all cases?",
            options: ["O(n²)", "O(n)", "O(n log n)", "O(log n)"],
            answer: 2,
            explanation: "Merge Sort always splits in half (log n levels) and merges in O(n) per level → O(n log n) guaranteed.",
          },
          {
            q: "What is the space complexity of Merge Sort?",
            options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
            answer: 2,
            explanation: "Merge Sort requires O(n) auxiliary space for the temporary arrays used during merging.",
          },
          {
            q: "What is the base case in Merge Sort?",
            options: [
              "Array length is 2",
              "Array length is 0",
              "Array length is <= 1",
              "Array is already sorted",
            ],
            answer: 2,
            explanation: "An array of length 0 or 1 is trivially sorted — no more splitting needed.",
          },
          {
            q: "How does the merge step work when combining [2,5] and [1,4]?",
            options: [
              "Pick min first: 1, then 2, then 4, then 5",
              "Concatenate then sort",
              "Pick max first: 5, then 4, then 2, then 1",
              "Randomly interleave",
            ],
            answer: 0,
            explanation: "We compare front elements: 2 vs 1 → pick 1; 2 vs 4 → pick 2; 5 vs 4 → pick 4; append 5. Result: [1,2,4,5].",
          },
          {
            q: "How many levels of recursion does Merge Sort use on an array of 8 elements?",
            options: ["2", "3", "4", "8"],
            answer: 1,
            explanation: "8 → 4 → 2 → 1. That's 3 levels of splitting (log₂(8) = 3).",
          },
        ],
      },
      {
        key: "quick_sort",
        label: "Quick Sort",
        questions: [
          {
            q: "What is the average-case time complexity of Quick Sort?",
            options: ["O(n²)", "O(n log n)", "O(n)", "O(log n)"],
            answer: 1,
            explanation: "On average, the pivot divides the array roughly in half, giving O(n log n) performance.",
          },
          {
            q: "When does Quick Sort hit its worst case O(n²)?",
            options: [
              "When the pivot is always the median",
              "When the array is already sorted and the pivot is always the last element",
              "When the array has duplicates",
              "When the array has an odd number of elements",
            ],
            answer: 1,
            explanation: "If we always pick the last element as pivot and the array is sorted, each partition produces subarrays of size n-1 and 0 → O(n²).",
          },
          {
            q: "After partitioning [10, 7, 8, 9, 1, 5] with pivot=5 (last element), where does the pivot land?",
            options: ["Index 0", "Index 1", "Index 4", "Index 5"],
            answer: 1,
            explanation: "Only 1 is ≤ 5, so after partition: pivot 5 is placed at index 1. [1, 5, 8, 9, 10, 7].",
          },
          {
            q: "What is Quick Sort's space complexity for the call stack?",
            options: ["O(n) worst case, O(log n) average", "O(1)", "O(n log n)", "O(n²)"],
            answer: 0,
            explanation: "The recursion depth is O(log n) on average, but O(n) in the worst case (degenerate pivot selection).",
          },
          {
            q: "Is Quick Sort a stable sorting algorithm?",
            options: ["Yes", "No — swapping can change relative order of equals", "Only with random pivot", "Yes if no duplicates"],
            answer: 1,
            explanation: "Quick Sort is NOT stable. The partition step swaps non-adjacent elements, which can disturb the relative order of equal elements.",
          },
        ],
      },
    ],
  },
  {
    id: "searching",
    label: "Searching Algorithms",
    icon: "🔍",
    color: "#0e8f7f",
    colorLight: "rgba(14,143,127,0.12)",
    programs: [
      {
        key: "linear_search",
        label: "Linear Search",
        questions: [
          {
            q: "What is the worst-case time complexity of Linear Search?",
            options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
            answer: 2,
            explanation: "In the worst case, the target is not in the array, so we check all n elements → O(n).",
          },
          {
            q: "Does Linear Search require the array to be sorted?",
            options: ["Yes, always", "No, it works on any array", "Only for integers", "Only for descending order"],
            answer: 1,
            explanation: "Linear Search checks each element sequentially, so sorting is not required.",
          },
          {
            q: "What does Linear Search return when the target is not found?",
            options: ["0", "null", "-1", "False"],
            answer: 2,
            explanation: "The standard convention is to return -1 to indicate the target was not found.",
          },
          {
            q: "In the best case, how many comparisons does Linear Search make?",
            options: ["n", "n/2", "log n", "1"],
            answer: 3,
            explanation: "Best case: the target is the first element → only 1 comparison.",
          },
          {
            q: "When is Linear Search better than Binary Search?",
            options: [
              "When the array is large and sorted",
              "When the array is unsorted or very small",
              "When searching for multiple values",
              "Never — Binary Search is always better",
            ],
            answer: 1,
            explanation: "Binary Search requires a sorted array. For unsorted data, Linear Search is the only option. It's also faster for tiny arrays due to lower overhead.",
          },
        ],
      },
      {
        key: "binary_search",
        label: "Binary Search",
        questions: [
          {
            q: "What is the time complexity of Binary Search?",
            options: ["O(n)", "O(n²)", "O(log n)", "O(1)"],
            answer: 2,
            explanation: "Binary Search halves the search space each step → O(log n) comparisons.",
          },
          {
            q: "What is the key precondition for Binary Search to work correctly?",
            options: ["Array must have even length", "Array must be sorted", "Array must contain no duplicates", "Array must be in descending order"],
            answer: 1,
            explanation: "Binary Search relies on the sorted order to decide which half to discard.",
          },
          {
            q: "If low=0, high=6, what is mid?",
            options: ["2", "3", "4", "3.5"],
            answer: 1,
            explanation: "mid = floor((0 + 6) / 2) = floor(3) = 3.",
          },
          {
            q: "For an array of 1024 elements, what is the maximum number of comparisons Binary Search needs?",
            options: ["512", "100", "10", "1024"],
            answer: 2,
            explanation: "log₂(1024) = 10. At most 10 comparisons are needed.",
          },
          {
            q: "If arr[mid] < target, what should happen next?",
            options: ["Set high = mid - 1", "Set low = mid + 1", "Return mid", "Start over from beginning"],
            answer: 1,
            explanation: "If arr[mid] < target, the target must be in the right half, so we move low up: low = mid + 1.",
          },
        ],
      },
      {
        key: "jump_search",
        label: "Jump Search",
        questions: [
          {
            q: "What is the optimal block size for Jump Search on an array of size n?",
            options: ["n/2", "log n", "√n", "n/4"],
            answer: 2,
            explanation: "√n is the optimal block size that minimizes the total steps (√n jumps + up to √n linear steps).",
          },
          {
            q: "What is the time complexity of Jump Search?",
            options: ["O(n)", "O(log n)", "O(√n)", "O(n log n)"],
            answer: 2,
            explanation: "Jump Search makes at most √n jumps and at most √n linear comparisons → O(√n) total.",
          },
          {
            q: "Does Jump Search require the array to be sorted?",
            options: ["No", "Yes", "Only in ascending order", "Only if no duplicates"],
            answer: 1,
            explanation: "Like Binary Search, Jump Search requires sorted data to decide when to stop jumping forward.",
          },
          {
            q: "Which phase of Jump Search finds the exact target?",
            options: ["The jump phase", "The linear search phase within the block", "A binary search phase", "A recursive phase"],
            answer: 1,
            explanation: "After jumping past the target's block, Jump Search does a linear scan backward through that block to find the exact position.",
          },
          {
            q: "For an array of 100 elements, the Jump Search block size is approximately:",
            options: ["5", "10", "25", "50"],
            answer: 1,
            explanation: "√100 = 10. So the block size is 10.",
          },
        ],
      },
    ],
  },
  {
    id: "data_structures",
    label: "Data Structures",
    icon: "🏗️",
    color: "#c05c1a",
    colorLight: "rgba(192,92,26,0.12)",
    programs: [
      {
        key: "linked_list",
        label: "Linked List",
        questions: [
          {
            q: "What does each node in a singly linked list store?",
            options: [
              "Only its value",
              "Its value and a pointer to the next node",
              "Its value, index, and previous pointer",
              "Its value and size",
            ],
            answer: 1,
            explanation: "A singly linked list node stores a value (data) and a next pointer pointing to the next node.",
          },
          {
            q: "What is the time complexity of traversing a linked list of n nodes?",
            options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
            answer: 2,
            explanation: "You must visit each node one by one → O(n) traversal.",
          },
          {
            q: "What does the last node's next pointer contain?",
            options: ["The first node", "Its own address", "None / null", "The length of the list"],
            answer: 2,
            explanation: "The last node points to None (null) to signal the end of the list.",
          },
          {
            q: "Compared to arrays, what is a key advantage of linked lists?",
            options: [
              "Random access in O(1)",
              "O(1) insertion/deletion at a known position (no shifting needed)",
              "Less memory usage",
              "Better cache performance",
            ],
            answer: 1,
            explanation: "Inserting or deleting at a known node only requires re-linking pointers — no shifting of elements needed as with arrays.",
          },
          {
            q: "What is the time complexity of accessing the k-th element in a linked list?",
            options: ["O(1)", "O(log k)", "O(k)", "O(n)"],
            answer: 2,
            explanation: "You must traverse from the head node through k nodes → O(k), which is O(n) in the worst case.",
          },
        ],
      },
      {
        key: "stack_impl",
        label: "Stack (LIFO)",
        questions: [
          {
            q: "What does LIFO stand for?",
            options: ["Last In, First Out", "Linear In, First Out", "Last Index, First Offset", "Largest Item First Out"],
            answer: 0,
            explanation: "LIFO = Last In, First Out. The most recently added item is the first one removed.",
          },
          {
            q: "Which operation adds an element to the top of a stack?",
            options: ["pop()", "enqueue()", "push() / append()", "insert()"],
            answer: 2,
            explanation: "push() (or append() in Python) adds an element to the top of the stack.",
          },
          {
            q: "What is the time complexity of push and pop on a Python list-based stack?",
            options: ["O(n)", "O(log n)", "O(1)", "O(n²)"],
            answer: 2,
            explanation: "Python's list.append() and list.pop() (from the end) are amortized O(1) operations.",
          },
          {
            q: "Which of these is NOT a common use case for a stack?",
            options: [
              "Function call stack",
              "Undo/redo history",
              "Breadth-first search",
              "Balanced parentheses checking",
            ],
            answer: 2,
            explanation: "BFS uses a queue (FIFO). DFS uses a stack. Call stacks, undo/redo, and bracket matching all use stack (LIFO) behavior.",
          },
          {
            q: "After pushing 1, 2, 3 onto a stack, what is returned by pop()?",
            options: ["1", "2", "3", "All three"],
            answer: 2,
            explanation: "3 was pushed last → LIFO means it is the first to be popped.",
          },
        ],
      },
      {
        key: "queue_impl",
        label: "Queue (FIFO)",
        questions: [
          {
            q: "What does FIFO stand for?",
            options: ["First In, First Out", "Fast Index, First Offset", "Final Insert, First Output", "First In, Final Output"],
            answer: 0,
            explanation: "FIFO = First In, First Out. The first element added is the first to be removed.",
          },
          {
            q: "Why is collections.deque preferred over a plain list for a Python queue?",
            options: [
              "deque is faster at indexing",
              "deque.popleft() is O(1), while list.pop(0) is O(n)",
              "deque uses less memory",
              "deque is built-in without imports",
            ],
            answer: 1,
            explanation: "list.pop(0) shifts all remaining elements → O(n). deque is optimized for O(1) pops from both ends.",
          },
          {
            q: "Which algorithm uses a queue as its core data structure?",
            options: ["DFS", "Merge Sort", "BFS", "Binary Search"],
            answer: 2,
            explanation: "BFS (Breadth-First Search) uses a queue to explore nodes level by level.",
          },
          {
            q: "After enqueuing A, B, C and dequeuing once, what is the front of the queue?",
            options: ["A", "B", "C", "Empty"],
            answer: 1,
            explanation: "A was enqueued first (FIFO), so A is dequeued first. B becomes the new front.",
          },
          {
            q: "Which end of a queue do you enqueue (add) to?",
            options: ["Front", "Back / rear", "Middle", "Either end"],
            answer: 1,
            explanation: "In a standard queue, elements are added (enqueued) at the back and removed (dequeued) from the front.",
          },
        ],
      },
      {
        key: "bst_insert",
        label: "Binary Search Tree",
        questions: [
          {
            q: "In a BST, where does a new value go if it is less than the current node?",
            options: ["Right subtree", "Left subtree", "Replaces current node", "Root"],
            answer: 1,
            explanation: "BST property: values less than a node go in its left subtree.",
          },
          {
            q: "What traversal of a BST always produces elements in sorted order?",
            options: ["Pre-order", "Post-order", "In-order", "Level-order"],
            answer: 2,
            explanation: "In-order traversal (left → root → right) of a BST always visits nodes in ascending sorted order.",
          },
          {
            q: "What is the average time complexity of search/insert in a balanced BST?",
            options: ["O(n)", "O(log n)", "O(1)", "O(n log n)"],
            answer: 1,
            explanation: "In a balanced BST, each comparison eliminates half the remaining nodes → O(log n).",
          },
          {
            q: "What is the worst-case shape of a BST when inserting already-sorted data?",
            options: ["A perfect binary tree", "A complete binary tree", "A linked list (degenerate tree)", "A balanced AVL tree"],
            answer: 2,
            explanation: "Inserting [1,2,3,4,5] in order creates a tree that is just a right-skewed linked list → O(n) operations.",
          },
          {
            q: "After inserting [5, 3, 7, 1, 4] into an empty BST, what is the result of in-order traversal?",
            options: ["5 3 7 1 4", "1 3 4 5 7", "1 4 3 7 5", "5 7 4 3 1"],
            answer: 1,
            explanation: "In-order traversal of any valid BST returns elements in sorted order: 1 3 4 5 7.",
          },
        ],
      },
    ],
  },
  {
    id: "graph",
    label: "Graph Algorithms",
    icon: "🕸️",
    color: "#8b3fbf",
    colorLight: "rgba(139,63,191,0.12)",
    programs: [
      {
        key: "bfs",
        label: "BFS",
        questions: [
          {
            q: "What data structure does BFS use internally?",
            options: ["Stack", "Queue", "Heap", "Linked List"],
            answer: 1,
            explanation: "BFS uses a queue (FIFO) to ensure nodes are visited in order of their distance from the start.",
          },
          {
            q: "What is the time complexity of BFS on a graph with V vertices and E edges?",
            options: ["O(V²)", "O(V × E)", "O(V + E)", "O(E log V)"],
            answer: 2,
            explanation: "BFS visits each vertex once (O(V)) and explores each edge once (O(E)) → O(V + E).",
          },
          {
            q: "What key property does BFS guarantee for unweighted graphs?",
            options: [
              "It finds the path using fewest edges (shortest path in hops)",
              "It always visits nodes alphabetically",
              "It finds the path with minimum weight",
              "It detects negative cycles",
            ],
            answer: 0,
            explanation: "BFS explores level by level, so the first time it reaches a node, it's via the shortest path (fewest hops).",
          },
          {
            q: "In BFS on graph {0:[1,2], 1:[3,4], 2:[5]} starting at 0, what is the traversal order?",
            options: ["0,1,3,4,2,5", "0,2,5,1,3,4", "0,1,2,3,4,5", "0,1,2,4,3,5"],
            answer: 2,
            explanation: "BFS visits level by level: node 0 first, then its neighbors 1 and 2, then their neighbors 3, 4, 5.",
          },
          {
            q: "Why does BFS mark nodes as visited when they are enqueued (not when dequeued)?",
            options: [
              "To save memory",
              "To prevent the same node from being added to the queue multiple times",
              "To enable backtracking",
              "BFS marks nodes when dequeued, not enqueued",
            ],
            answer: 1,
            explanation: "Marking on enqueue prevents duplicates in the queue. If we waited until dequeue, the same node could be enqueued multiple times from different neighbors.",
          },
        ],
      },
      {
        key: "dfs",
        label: "DFS",
        questions: [
          {
            q: "What data structure does recursive DFS implicitly use?",
            options: ["Queue", "Heap", "The call stack", "Array"],
            answer: 2,
            explanation: "Recursive DFS uses the program's call stack to remember where to backtrack to.",
          },
          {
            q: "In DFS on graph {0:[1,2], 1:[3,4], 2:[5]} starting at 0, what is one valid traversal order?",
            options: ["0,1,2,3,4,5", "0,1,3,4,2,5", "0,2,1,3,4,5", "0,1,2,5,3,4"],
            answer: 1,
            explanation: "DFS dives deep: 0→1→3 (backtrack)→4 (backtrack to 1, backtrack to 0)→2→5.",
          },
          {
            q: "What is DFS used for that BFS cannot easily do?",
            options: [
              "Finding shortest paths in unweighted graphs",
              "Level-order traversal",
              "Topological sort and cycle detection",
              "Finding minimum spanning trees",
            ],
            answer: 2,
            explanation: "DFS's depth-first property makes it ideal for topological sort, cycle detection, finding SCCs, and maze solving.",
          },
          {
            q: "What is the time complexity of DFS?",
            options: ["O(V²)", "O(V log V)", "O(V + E)", "O(E)"],
            answer: 2,
            explanation: "DFS visits each vertex once and traverses each edge once → O(V + E).",
          },
          {
            q: "What is 'backtracking' in the context of DFS?",
            options: [
              "Restarting the search from scratch",
              "Returning to a previous node after exhausting all unvisited neighbors",
              "Randomly jumping to another node",
              "Removing visited marks",
            ],
            answer: 1,
            explanation: "When DFS reaches a node with no unvisited neighbors, it returns (backtracks) to the previous node to try other paths.",
          },
        ],
      },
    ],
  },
  {
    id: "dynamic_programming",
    label: "Dynamic Programming",
    icon: "⚡",
    color: "#1a7a3a",
    colorLight: "rgba(26,122,58,0.12)",
    programs: [
      {
        key: "fib_dp",
        label: "Fibonacci (DP)",
        questions: [
          {
            q: "What technique does Fibonacci DP use to avoid recomputing subproblems?",
            options: ["Tabulation", "Memoization (top-down caching)", "Greedy", "Backtracking"],
            answer: 1,
            explanation: "Fibonacci DP stores computed results in a memo dictionary (top-down memoization) so each subproblem is solved only once.",
          },
          {
            q: "What is the time complexity of Fibonacci with memoization?",
            options: ["O(2ⁿ)", "O(n log n)", "O(n)", "O(log n)"],
            answer: 2,
            explanation: "With memoization, each fib(k) is computed exactly once for k from 0 to n → O(n).",
          },
          {
            q: "What is a 'cache hit' in the memoized Fibonacci?",
            options: [
              "Finding the base case",
              "When fib(n) has already been computed and is returned directly from memo",
              "When both recursive calls return the same value",
              "When n == 0",
            ],
            answer: 1,
            explanation: "A cache hit means the value is already in the memo dictionary — no further recursion needed, just return it instantly.",
          },
          {
            q: "How many unique subproblems does fib_memo(10) solve?",
            options: ["2¹⁰ = 1024", "About 50", "11 (fib(0) through fib(10))", "100"],
            answer: 2,
            explanation: "Each distinct value of n from 0 to 10 is computed exactly once = 11 unique subproblems.",
          },
          {
            q: "What is the difference between top-down (memoization) and bottom-up (tabulation) DP?",
            options: [
              "Top-down is iterative; bottom-up is recursive",
              "Top-down uses recursion + caching; bottom-up fills a table iteratively from base cases",
              "They have different time complexities",
              "Bottom-up requires more memory",
            ],
            answer: 1,
            explanation: "Memoization (top-down) is recursive with a cache. Tabulation (bottom-up) iteratively fills a table starting from the smallest subproblems.",
          },
        ],
      },
      {
        key: "knapsack",
        label: "0/1 Knapsack",
        questions: [
          {
            q: "What does '0/1' mean in the 0/1 Knapsack problem?",
            options: [
              "Items weigh 0 or 1",
              "Each item is either taken completely or not taken at all",
              "There are only 0 or 1 items",
              "The capacity is 0 or 1",
            ],
            answer: 1,
            explanation: "0/1 means each item is binary — you either include it (1) or exclude it (0). No partial fractions allowed.",
          },
          {
            q: "What does dp[i][w] represent in the Knapsack DP table?",
            options: [
              "The weight of the i-th item",
              "Maximum value using first i items with capacity exactly w",
              "Number of items with weight w",
              "Whether item i fits in capacity w",
            ],
            answer: 1,
            explanation: "dp[i][w] = maximum total value achievable using the first i items with a weight capacity of w.",
          },
          {
            q: "What is the time complexity of the 0/1 Knapsack DP solution?",
            options: ["O(n²)", "O(n × W)", "O(2ⁿ)", "O(n log W)"],
            answer: 1,
            explanation: "We fill an (n+1) × (W+1) table → O(n × W) where n is the number of items and W is the capacity.",
          },
          {
            q: "When filling dp[i][w], what are the two choices for item i?",
            options: [
              "Skip or duplicate",
              "Skip item i (dp[i-1][w]) OR include it (values[i-1] + dp[i-1][w-weights[i-1]])",
              "Include or split",
              "Use item i twice or not at all",
            ],
            answer: 1,
            explanation: "For each item, we either skip it (inherit the value without it) or include it (add its value to the best solution for the remaining capacity).",
          },
          {
            q: "For items {weight:2, value:3} and {weight:3, value:4} with capacity=4, what is the max value?",
            options: ["4", "7", "3", "6"],
            answer: 1,
            explanation: "We can fit both items: weight = 2+3 = 5 > 4, so no. Best: item 1 (value 3, weight 2) leaves cap 2, no room for item 2. Or item 2 alone (value 4, weight 3). Max = 4.",
          },
        ],
      },
      {
        key: "lcs",
        label: "Longest Common Subsequence",
        questions: [
          {
            q: "What is the LCS length of 'ABCB' and 'BCB'?",
            options: ["2", "3", "4", "1"],
            answer: 1,
            explanation: "The LCS is 'BCB' — length 3.",
          },
          {
            q: "What rule fills dp[i][j] when s1[i-1] == s2[j-1]?",
            options: [
              "dp[i][j] = dp[i-1][j-1]",
              "dp[i][j] = dp[i-1][j-1] + 1",
              "dp[i][j] = dp[i][j-1] + 1",
              "dp[i][j] = max(dp[i-1][j], dp[i][j-1])",
            ],
            answer: 1,
            explanation: "When characters match, we extend the LCS from the diagonal: dp[i][j] = dp[i-1][j-1] + 1.",
          },
          {
            q: "When s1[i-1] != s2[j-1], what is dp[i][j]?",
            options: [
              "0",
              "dp[i-1][j-1]",
              "max(dp[i-1][j], dp[i][j-1])",
              "dp[i][j-1] + 1",
            ],
            answer: 2,
            explanation: "When characters don't match, we take the best we can by skipping one character from either string.",
          },
          {
            q: "Is a subsequence required to be contiguous?",
            options: ["Yes, always", "No — characters can be non-adjacent", "Only in LCS", "Only when strings have no repeats"],
            answer: 1,
            explanation: "A subsequence preserves relative order but does NOT require the characters to be adjacent. 'AC' is a subsequence of 'ABCD'.",
          },
          {
            q: "What is the time complexity of the LCS DP algorithm for strings of length m and n?",
            options: ["O(m + n)", "O(m × n)", "O(m² × n)", "O(2^(m+n))"],
            answer: 1,
            explanation: "We fill an (m+1) × (n+1) table, each cell in O(1) → O(m × n) total.",
          },
        ],
      },
    ],
  },
];
