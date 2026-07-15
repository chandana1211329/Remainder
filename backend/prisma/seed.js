const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Seed Achievements
  const achievements = [
    {
      code: 'STREAK_7',
      title: '7-Day Streak',
      description: 'Maintained a consistency streak for 7 consecutive days.',
      icon: 'FaFire',
      xpValue: 100
    },
    {
      code: 'STREAK_30',
      title: '30-Day Streak',
      description: 'Maintained a consistency streak for 30 consecutive days.',
      icon: 'FaFireAlt',
      xpValue: 300
    },
    {
      code: 'STREAK_100',
      title: 'Centurion Streak',
      description: 'Maintained a consistency streak for 100 consecutive days.',
      icon: 'GiFlame',
      xpValue: 1000
    },
    {
      code: 'JS_BASICS_COMPLETED',
      title: 'JS Basics Wizard',
      description: 'Completed all topics in the JavaScript Basics category.',
      icon: 'DiJavascript1',
      xpValue: 150
    },
    {
      code: 'JS_FUNCTIONS_COMPLETED',
      title: 'Functional Thinker',
      description: 'Completed all topics in the JavaScript Functions category.',
      icon: 'TbLambda',
      xpValue: 150
    },
    {
      code: 'JS_DOM_COMPLETED',
      title: 'DOM Manipulator',
      description: 'Completed all topics in the DOM category.',
      icon: 'FaCode',
      xpValue: 150
    },
    {
      code: 'DSA_100_PROBLEMS',
      title: 'DSA Grind Master',
      description: 'Solved a total of 100 or more DSA problems.',
      icon: 'GiBrain',
      xpValue: 500
    },
    {
      code: 'FIRST_ASSIGNMENT_COMPLETED',
      title: 'Initiation Done',
      description: 'Completed your very first study assignment.',
      icon: 'FaFileSignature',
      xpValue: 100
    },
    {
      code: 'PERFECT_WEEK',
      title: 'Perfect Week',
      description: 'Completed all daily required tasks for 7 consecutive days.',
      icon: 'FaCrown',
      xpValue: 250
    },
    {
      code: 'PERFECT_MONTH',
      title: 'Perfect Month',
      description: 'Completed all daily required tasks for an entire month.',
      icon: 'GiTrophy',
      xpValue: 1000
    }
  ];

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { code: ach.code },
      update: ach,
      create: ach
    });
  }
  console.log('Achievements seeded.');

  // 2. Seed JavaScript Topics
  const jsTopics = [
    // Basics
    {
      category: 'Basics',
      title: 'Introduction to JavaScript',
      description: 'Learn the history of JavaScript, how it runs on the web, and the basic console.log syntax.',
      estimatedTime: 30,
      difficulty: 'Easy',
      orderNumber: 1,
      practiceQuestions: JSON.stringify([
        'How do you write a single-line comment in JavaScript?',
        'What is the output of console.log(typeof "Hello")?',
        'How do you print a message to the browser developer console?'
      ]),
      interviewQuestions: JSON.stringify([
        'What is JavaScript and is it compiled or interpreted?',
        'Explain the difference between client-side and server-side JavaScript.',
        'How does JavaScript integrate with HTML?'
      ]),
      relatedProject: 'Hello World script that modifies HTML content on load.'
    },
    {
      category: 'Basics',
      title: 'Variables & Scope',
      description: 'Understand var, let, const, hoisting, block scope, and function scope.',
      estimatedTime: 45,
      difficulty: 'Easy',
      orderNumber: 2,
      practiceQuestions: JSON.stringify([
        'What happens when you declare a variable using var inside a loop block?',
        'Can you reassign a value to a const variable? What about mutating a const object?',
        'Create a variable that is scoped only inside an if block.'
      ]),
      interviewQuestions: JSON.stringify([
        'What are the key differences between var, let, and const?',
        'Explain temporal dead zone (TDZ) in ES6.',
        'What is hoisting in JavaScript?'
      ]),
      relatedProject: 'Variable Scope Visualizer displaying behavior of scopes.'
    },
    {
      category: 'Basics',
      title: 'Data Types & Operators',
      description: 'Deep dive into primitives (String, Number, Boolean, Null, Undefined, Symbol, BigInt), objects, arithmetic, assignment, logical, and comparison operators.',
      estimatedTime: 60,
      difficulty: 'Easy',
      orderNumber: 3,
      practiceQuestions: JSON.stringify([
        'What is the difference between == and ===?',
        'What does typeof null return and why?',
        'Show how to use logical OR (||) and nullish coalescing (??) operators.'
      ]),
      interviewQuestions: JSON.stringify([
        'How does JavaScript handle implicit type coercion?',
        'Explain the difference between primitive data types and reference data types.',
        'What are Symbol and BigInt and when should they be used?'
      ]),
      relatedProject: 'Interactive Type Converter and Calculator.'
    },
    {
      category: 'Basics',
      title: 'Control Flow & Loops',
      description: 'Master if/else conditionals, switch statements, for, while, do-while, for-of, and for-in loops.',
      estimatedTime: 60,
      difficulty: 'Easy',
      orderNumber: 4,
      practiceQuestions: JSON.stringify([
        'Write a loop that prints numbers 1 to 20, but skips multiples of 3.',
        'How does a for...in loop differ from a for...of loop?',
        'Implement a switch case that evaluates a score out of 5 into letter grades.'
      ]),
      interviewQuestions: JSON.stringify([
        'Which loops are best suited for iterating over array items vs object properties?',
        'What are break and continue statements and how do they work?'
      ]),
      relatedProject: 'FizzBuzz console printer and Prime Number Generator.'
    },

    // Functions
    {
      category: 'Functions',
      title: 'Function Declarations & Expressions',
      description: 'Understand how functions are declared, invoked, and treated as first-class citizens.',
      estimatedTime: 45,
      difficulty: 'Easy',
      orderNumber: 5,
      practiceQuestions: JSON.stringify([
        'Write a function expression that multiplies two numbers.',
        'Pass a function as an argument to another function and execute it.'
      ]),
      interviewQuestions: JSON.stringify([
        'What is the difference between a function declaration and a function expression?',
        'What does it mean that functions are "First-Class Citizens" in JavaScript?'
      ]),
      relatedProject: 'Basic math calculator engine.'
    },
    {
      category: 'Functions',
      title: 'Arrow Functions',
      description: 'Learn the syntactical differences, implicit returns, and lexical scoping of "this".',
      estimatedTime: 40,
      difficulty: 'Easy',
      orderNumber: 6,
      practiceQuestions: JSON.stringify([
        'Convert a traditional function syntax to an arrow function.',
        'Demonstrate an arrow function with implicit return.'
      ]),
      interviewQuestions: JSON.stringify([
        'How does "this" binding behave inside arrow functions compared to normal functions?',
        'Can arrow functions be used as constructors? Why or why not?'
      ]),
      relatedProject: 'Interactive object methods test using arrow functions.'
    },
    {
      category: 'Functions',
      title: 'Closures',
      description: 'Understand the concept of closures, lexical environment, and retaining outer scope variables.',
      estimatedTime: 90,
      difficulty: 'Medium',
      orderNumber: 7,
      practiceQuestions: JSON.stringify([
        'Create a function counter() that returns another function incrementing a private variable.',
        'Implement private getters/setters using closures.'
      ]),
      interviewQuestions: JSON.stringify([
        'What is a closure in JavaScript and what are some common use cases?',
        'Describe memory implications of closures.'
      ]),
      relatedProject: 'Private state store for dashboard app settings.'
    },
    {
      category: 'Functions',
      title: 'Higher Order Functions',
      description: 'Learn array iteration methods like map, filter, reduce, find, some, and every.',
      estimatedTime: 75,
      difficulty: 'Medium',
      orderNumber: 8,
      practiceQuestions: JSON.stringify([
        'Use reduce to sum an array of numbers.',
        'Filter out active users from an array of user objects, then map to their names.'
      ]),
      interviewQuestions: JSON.stringify([
        'Explain how Array.prototype.reduce() works.',
        'Compare map vs forEach.'
      ]),
      relatedProject: 'Task List filtering component.'
    },

    // Events
    {
      category: 'Events',
      title: 'Event Listeners & Delegation',
      description: 'Manage event bubbling, capturing, event object properties, and delegating handlers to parent nodes.',
      estimatedTime: 60,
      difficulty: 'Medium',
      orderNumber: 9,
      practiceQuestions: JSON.stringify([
        'Add a click listener to a list container that targets dynamically added children.',
        'Prevent a link from navigating and stop event bubbling.'
      ]),
      interviewQuestions: JSON.stringify([
        'What is the difference between event.target and event.currentTarget?',
        'Explain event propagation (bubbling vs capturing).',
        'What are the performance benefits of event delegation?'
      ]),
      relatedProject: 'Dynamic Todo List with single event listener on container.'
    },

    // Data Structures
    {
      category: 'Data Structures',
      title: 'Objects, Maps, and Sets',
      description: 'In-depth review of object properties, Map/Set structures, garbage collection, keys and iteration.',
      estimatedTime: 50,
      difficulty: 'Medium',
      orderNumber: 10,
      practiceQuestions: JSON.stringify([
        'Find unique values in an array using a Set.',
        'Store object keys in a Map and iterate through key-value pairs.'
      ]),
      interviewQuestions: JSON.stringify([
        'What are the key differences between a standard Object and a Map?',
        'How does WeakMap differ from Map?'
      ]),
      relatedProject: 'Frequency counter dashboard widget.'
    },

    // OOP
    {
      category: 'Object Oriented Programming',
      title: 'Prototypes & Classes',
      description: 'Master prototype chaining, prototype inheritance, and class structures in ES6.',
      estimatedTime: 90,
      difficulty: 'Medium',
      orderNumber: 11,
      practiceQuestions: JSON.stringify([
        'Add a method to the prototype of Array to compute average.',
        'Create a Person class and a Student class inheriting Person.'
      ]),
      interviewQuestions: JSON.stringify([
        'Explain prototypical inheritance in JavaScript.',
        'Is the ES6 class syntax purely syntactic sugar? Explain.'
      ]),
      relatedProject: 'Game character creation constructor framework.'
    },

    // DOM
    {
      category: 'DOM',
      title: 'Selecting and Modifying DOM',
      description: 'Select elements using querySelector, update attributes, modify styles, classes, and content dynamically.',
      estimatedTime: 50,
      difficulty: 'Easy',
      orderNumber: 12,
      practiceQuestions: JSON.stringify([
        'Select all elements with class "active" and change background to red.',
        'Toggle class "dark-mode" on the body element.'
      ]),
      interviewQuestions: JSON.stringify([
        'Difference between querySelectorAll and getElementsByClassName.',
        'Difference between textContent and innerHTML.'
      ]),
      relatedProject: 'Theme toggle controls.'
    },

    // Asynchronous JavaScript
    {
      category: 'Asynchronous JavaScript',
      title: 'Promises & Async/Await',
      description: 'Understand JS execution model, call stack, event loop, tasks, microtasks, Promise states, chaining, and async/await.',
      estimatedTime: 120,
      difficulty: 'Hard',
      orderNumber: 13,
      practiceQuestions: JSON.stringify([
        'Create a delay function returning a promise resolving after N ms.',
        'Fetch data from two different URLs concurrently using Promise.all().'
      ]),
      interviewQuestions: JSON.stringify([
        'How does the event loop handle the Call Stack, Web APIs, Callback Queue, and Microtask Queue?',
        'Explain Promise.all, Promise.race, Promise.allSettled, and Promise.any.'
      ]),
      relatedProject: 'Mock network requests status tracker.'
    },
    {
      category: 'Asynchronous JavaScript',
      title: 'Fetch API & AJAX',
      description: 'Learn how to make HTTP requests, post JSON data, and handle network errors.',
      estimatedTime: 60,
      difficulty: 'Medium',
      orderNumber: 14,
      practiceQuestions: JSON.stringify([
        'Fetch a list of posts from a public API and render it.',
        'Send a POST request with payload.'
      ]),
      interviewQuestions: JSON.stringify([
        'What is CORS and how do browsers handle it?',
        'Explain fetch error handling. Does it throw on 404/500 errors?'
      ]),
      relatedProject: 'Weather Forecast Dashboard module.'
    },

    // JSON & Regex
    {
      category: 'JSON',
      title: 'JSON Processing',
      description: 'Parsing, stringifying, and handling complex objects.',
      estimatedTime: 30,
      difficulty: 'Easy',
      orderNumber: 15,
      practiceQuestions: JSON.stringify([
        'Safely parse a dynamic string to JSON using try/catch.',
        'Clone an object using JSON.parse(JSON.stringify(obj)).'
      ]),
      interviewQuestions: [
        'What are the limitations of using JSON for deep copying objects?'
      ].join(''),
      relatedProject: 'Local state serialization helper.'
    },
    {
      category: 'Regular Expressions',
      title: 'Regex Patterns & Matching',
      description: 'Define regular expressions, testing strings, extracting matches, and dynamic replacing.',
      estimatedTime: 60,
      difficulty: 'Medium',
      orderNumber: 16,
      practiceQuestions: JSON.stringify([
        'Write a regex to validate an email address.',
        'Replace all occurrences of numbers in a string with a dash.'
      ]),
      interviewQuestions: JSON.stringify([
        'Difference between regex.test() and string.match() in JavaScript.'
      ]),
      relatedProject: 'Input Validator form helper.'
    },

    // Error Handling
    {
      category: 'Error Handling',
      title: 'Try/Catch & Custom Errors',
      description: 'Gracefully catch runtime exceptions, define Custom Error classes, and manage finally blocks.',
      estimatedTime: 45,
      difficulty: 'Medium',
      orderNumber: 17,
      practiceQuestions: JSON.stringify([
        'Throw a customValidationError if password is under 8 characters.',
        'Implement try/catch with a finally block executing cleanup.'
      ]),
      interviewQuestions: JSON.stringify([
        'Explain how error propagation works in JavaScript.',
        'Why would you extend the built-in Error class?'
      ]),
      relatedProject: 'Safe database connect logger.'
    },

    // Performance Optimization
    {
      category: 'Performance Optimization',
      title: 'Debounce & Throttle',
      description: 'Control frequency of function executions, optimizing search inputs and scroll events.',
      estimatedTime: 80,
      difficulty: 'Hard',
      orderNumber: 18,
      practiceQuestions: JSON.stringify([
        'Write a debounce function from scratch.',
        'Write a throttle function from scratch.'
      ]),
      interviewQuestions: JSON.stringify([
        'What is the core difference between debouncing and throttling?',
        'In what real-world scenarios would you use debounce vs throttle?'
      ]),
      relatedProject: 'Search Auto-suggest box optimizer.'
    },

    // Libraries & Frameworks
    {
      category: 'Libraries & Frameworks',
      title: 'React.js Core & Bundlers',
      description: 'Introduction to component lifecycles, states, and bundlers like Vite/Webpack.',
      estimatedTime: 90,
      difficulty: 'Medium',
      orderNumber: 19,
      practiceQuestions: JSON.stringify([
        'Explain how Virtual DOM works in React.',
        'What are the advantages of Vite over Webpack?'
      ]),
      interviewQuestions: JSON.stringify([
        'What is a single page application (SPA)?',
        'How does React reconcile state updates?'
      ]),
      relatedProject: 'A simple interactive counter widget in React.'
    }
  ];

  for (const topic of jsTopics) {
    await prisma.javaScriptTopic.upsert({
      where: { title: topic.title },
      update: topic,
      create: topic
    });
  }
  console.log('JavaScript roadmap topics seeded.');

  // 3. Seed DSA Topics
  const dsaCategories = [
    'Arrays',
    'Strings',
    'Linked Lists',
    'Stacks',
    'Queues',
    'Trees',
    'Graphs',
    'Searching',
    'Sorting'
  ];

  const difficulties = ['Easy', 'Medium', 'Hard'];

  for (const category of dsaCategories) {
    for (const diff of difficulties) {
      await prisma.dSATopic.upsert({
        where: {
          category_difficulty: {
            category: category,
            difficulty: diff
          }
        },
        update: {},
        create: {
          category: category,
          difficulty: diff,
          problemsCount: 0 // initialize
        }
      });
    }
  }
  console.log('DSA Categories & Difficulties seeded.');

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
