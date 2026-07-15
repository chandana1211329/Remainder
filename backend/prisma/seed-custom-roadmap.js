const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old JavaScript topics...');
  
  // Disable foreign key checks temporarily to clear cleanly if needed
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
  await prisma.userJavaScriptProgress.deleteMany({});
  await prisma.javaScriptTopic.deleteMany({});
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');

  console.log('Seeding custom 30-Day JavaScript Roadmap...');

  const customRoadmap = [
    {
      orderNumber: 1,
      category: 'Basics',
      title: 'Day 1: Intro, Browser Console & Variables',
      description: 'Introduction, Using JS in HTML, Browser Console, Variables, Data Types',
      estimatedTime: 60,
      difficulty: 'Easy',
      practiceQuestions: [
        'Print a welcome message and your age to the console.',
        'Declare variables using let, const, and var. Reassign them and observe errors.',
        'Write a script that alerts your name when loaded in HTML.'
      ],
      interviewQuestions: [
        'Explain the difference between let, const, and var.',
        'What are the 7 primitive data types in JavaScript?',
        'How does JavaScript run inside the browser?'
      ],
      relatedProject: 'HTML card that loads dynamic user profile stats via Console inputs.'
    },
    {
      orderNumber: 2,
      category: 'Basics',
      title: 'Day 2: Coercion, Operators & Control Flow',
      description: 'Type Conversion & Coercion, Operators, Control Flow Statements',
      estimatedTime: 60,
      difficulty: 'Easy',
      practiceQuestions: [
        'Add a string "5" to a number 10 and predict the output.',
        'Write an if-else statement checking if a number is positive, negative, or zero.',
        'Write a loop that prints only even numbers from 1 to 20.'
      ],
      interviewQuestions: [
        'What is type coercion? Give examples of implicit coercion.',
        'Difference between strict equality (===) and loose equality (==).',
        'What are truthy and falsy values?'
      ],
      relatedProject: 'Grade Calculator and leap year evaluator script.'
    },
    {
      orderNumber: 3,
      category: 'Functions',
      title: 'Day 3: Scope, Functions & Hoisting',
      description: 'Scope (Global, Block, Function), Functions (Declarations vs Expressions), Hoisting',
      estimatedTime: 75,
      difficulty: 'Easy',
      practiceQuestions: [
        'Create a function that calculates the area of a rectangle.',
        'Demonstrate how a variable declared in block scope cannot be accessed globally.',
        'Write a function and call it before its declaration to observe hoisting.'
      ],
      interviewQuestions: [
        'Explain variable hoisting and function hoisting in JavaScript.',
        'What is block scope vs function scope?',
        'How do function declarations differ from function expressions?'
      ],
      relatedProject: 'Math formula library containing basic geometric calculation helpers.'
    },
    {
      orderNumber: 4,
      category: 'Functions',
      title: 'Day 4: Closures & Higher-Order Functions',
      description: 'Function Binding (call, apply, bind), Closures, Higher-Order Functions',
      estimatedTime: 90,
      difficulty: 'Medium',
      practiceQuestions: [
        'Create a function makeMultiplier(x) that returns a function multiplying its input by x.',
        'Borrow a method from one object and apply it to another using call().',
        'Use map, filter, and reduce on an array of objects representing products.'
      ],
      interviewQuestions: [
        'What is a closure and what are private variables?',
        'Explain the difference between call(), apply(), and bind().',
        'What makes a function a Higher-Order Function?'
      ],
      relatedProject: 'E-commerce cart filter and discount aggregator.'
    },
    {
      orderNumber: 5,
      category: 'Advanced Logic',
      title: 'Day 5: Iterators, Generators & Event Loop',
      description: 'Custom Iterators, Generators, Event Loop execution model',
      estimatedTime: 90,
      difficulty: 'Medium',
      practiceQuestions: [
        'Write a generator function that yields Fibonacci numbers.',
        'Create a custom iterator that iterates over an object properties values.',
        'Write a console script with setTimeout(0) and predict the output sequence.'
      ],
      interviewQuestions: [
        'How does the JavaScript Event Loop handle callbacks vs microtasks?',
        'What is a generator function and how do you use yield?',
        'What is the Call Stack and Task Queue?'
      ],
      relatedProject: 'Visual simulator of Call Stack and Callback Queue.'
    },
    {
      orderNumber: 6,
      category: 'Events',
      title: 'Day 6: Events, Bubbling & delegation',
      description: 'Events, Event Listener, Event Propagation (Bubbling/Capturing), Event Delegation, preventDefault()',
      estimatedTime: 75,
      difficulty: 'Medium',
      practiceQuestions: [
        'Add a submit listener to a form and stop reload using preventDefault().',
        'Create a nested div hierarchy and stop event bubbling on click.',
        'Add one click handler to a ul element that tracks clicks on dynamic li items.'
      ],
      interviewQuestions: [
        'Explain event bubbling vs event capturing.',
        'What is event delegation and why is it good for performance?',
        'What is the purpose of event.stopPropagation()?'
      ],
      relatedProject: 'Interactive Grid where clicking cells triggers individual highlights.'
    },
    {
      orderNumber: 7,
      category: 'Beginner Projects',
      title: 'Day 7: Counter, Generator & Prime Checker',
      description: 'Beginner Projects: Counter App, Random Number Generator, Prime Number Checker',
      estimatedTime: 90,
      difficulty: 'Easy',
      practiceQuestions: [
        'Create a simple counter with Increment, Decrement, and Reset buttons.',
        'Write a function checking if a number is prime and display the result.',
        'Build a random number generator within a user-defined range.'
      ],
      interviewQuestions: [
        'How does DOM manipulation affect page rendering?',
        'What is the difference between innerText and textContent?'
      ],
      relatedProject: 'Interactive prime calculator and game score counter page.'
    },
    {
      orderNumber: 8,
      category: 'Beginner Projects',
      title: 'Day 8: Unicode, Palindrome & Show/Hide Password',
      description: 'Beginner Projects: Unicode Character Value, Palindrome Checker, Show/Hide Password',
      estimatedTime: 90,
      difficulty: 'Easy',
      practiceQuestions: [
        'Write a program returning the ASCII/Unicode code of an input character.',
        'Write a palindrome checker ignoring spaces and capital letters.',
        'Create a password input field with a toggle eye button.'
      ],
      interviewQuestions: [
        'How do you change input attributes dynamically in JavaScript?',
        'How do you handle string characters using charCodeAt()?'
      ],
      relatedProject: 'Form credential helper page containing validators and palindrome checks.'
    },
    {
      orderNumber: 9,
      category: 'Beginner Projects',
      title: 'Day 9: Email Validator, Password Generator & Carousel',
      description: 'Beginner Projects: Email Validator, Random Password Generator, JavaScript Carousel',
      estimatedTime: 120,
      difficulty: 'Medium',
      practiceQuestions: [
        'Generate a random string of length N containing numbers, capitals, and symbols.',
        'Build a carousel that transitions slides on previous/next buttons.',
        'Validate an email string using basic string splitting (@ and .).'
      ],
      interviewQuestions: [
        'How do arrays or objects help in rotating carousel images?',
        'What are some basic string validation techniques?'
      ],
      relatedProject: 'Mini Landing registration form with carousel banner.'
    },
    {
      orderNumber: 10,
      category: 'Data Structures',
      title: 'Day 10: Numbers, Strings & Arrays',
      description: 'Numbers methods, Strings manipulation, Array iterations',
      estimatedTime: 60,
      difficulty: 'Easy',
      practiceQuestions: [
        'Perform string splitting, joining, slice, and indexOf operations.',
        'Convert strings to numbers using parseInt() and unary operators.',
        'Sort an array of strings alphabetically and array of numbers ascending.'
      ],
      interviewQuestions: [
        'Why are arrays reference types in JavaScript?',
        'Explain the difference between slice() and splice() on arrays.'
      ],
      relatedProject: 'Text statistics analyzer counting words, characters, and spaces.'
    },
    {
      orderNumber: 11,
      category: 'Data Structures',
      title: 'Day 11: Maps, Sets & Typed Arrays',
      description: 'Map, WeakMap, Set, WeakSet, Typed Arrays',
      estimatedTime: 75,
      difficulty: 'Medium',
      practiceQuestions: [
        'Create a Set of unique usernames from an array of logins.',
        'Use Map to count the occurrences of words in a sentence.',
        'Declare a 16-bit signed integer Typed Array and write values.'
      ],
      interviewQuestions: [
        'How does WeakMap differ from standard Map? Explain garbage collection.',
        'Why would you use a Set instead of an Array?',
        'What are Typed Arrays and when are they used?'
      ],
      relatedProject: 'Unique logs registry and image pixel buffer reader mock.'
    },
    {
      orderNumber: 12,
      category: 'DSA & Algorithms',
      title: 'Day 12: Lists, Stacks, Queues & Priority Queues',
      description: 'Data Structures implementation: Linked List, Stack, Queue, Deque, Priority Queue',
      estimatedTime: 120,
      difficulty: 'Hard',
      practiceQuestions: [
        'Implement a Stack class from scratch using arrays.',
        'Write a Linked List structure with insertHead, insertTail, and delete methods.',
        'Create a Priority Queue where elements are sorted by priority.'
      ],
      interviewQuestions: [
        'Explain the Stack (LIFO) and Queue (FIFO) structures.',
        'Compare performance (Big O) of array operations vs linked lists.'
      ],
      relatedProject: 'Print queue simulator with priority levels.'
    },
    {
      orderNumber: 13,
      category: 'DSA & Algorithms',
      title: 'Day 13: Sorting Algorithms + Practice',
      description: 'Sorting Algorithms (Bubble, Selection, Insertion) + DSA Practice',
      estimatedTime: 100,
      difficulty: 'Medium',
      practiceQuestions: [
        'Implement Bubble Sort from scratch.',
        'Implement Selection Sort from scratch.',
        'Sort an array of user objects based on their ages.'
      ],
      interviewQuestions: [
        'What is the time complexity (Big O) of Bubble Sort in average and worst cases?',
        'Explain stable vs unstable sorting algorithms.'
      ],
      relatedProject: 'Interactive Sorting Visualizer displaying step-by-step bars swapping.'
    },
    {
      orderNumber: 14,
      category: 'Object Oriented Programming',
      title: 'Day 14: Intro to OOP, Objects & "this"',
      description: 'Introduction to OOP, Objects, "this" Keyword bindings',
      estimatedTime: 75,
      difficulty: 'Medium',
      practiceQuestions: [
        'Define an object literal and call a method referencing this.',
        'Explain what this evaluates to in global scope vs method scope.',
        'Create a constructor function using new keyword.'
      ],
      interviewQuestions: [
        'How is "this" determined in JavaScript functions?',
        'What is the default global object in browser vs Node.js?'
      ],
      relatedProject: 'Bank Account simulator managing balance using object methods.'
    },
    {
      orderNumber: 15,
      category: 'Object Oriented Programming',
      title: 'Day 15: Prototypes & ES6 Classes',
      description: 'Prototypes, Prototype Chaining, Classes, Constructor Method',
      estimatedTime: 90,
      difficulty: 'Medium',
      practiceQuestions: [
        'Add a method to the prototype of a constructor function.',
        'Declare an ES6 Class Vehicle with constructor and a drive method.',
        'Inspect prototype chain of a class instance using getPrototypeOf.'
      ],
      interviewQuestions: [
        'Explain prototypical inheritance in JavaScript.',
        'What is a constructor method and how is it called?'
      ],
      relatedProject: 'Library Catalog Management system using Classes.'
    },
    {
      orderNumber: 16,
      category: 'Object Oriented Programming',
      title: 'Day 16: Getters, Setters & Inheritance',
      description: 'Getters & Setters, Static Methods, Class Inheritance',
      estimatedTime: 75,
      difficulty: 'Medium',
      practiceQuestions: [
        'Define getter/setter properties on a class evaluating fullName.',
        'Create a class Animal with static method getCount(), and subclass Dog.',
        'Override a method in Dog class and call parent method using super.'
      ],
      interviewQuestions: [
        'What is the purpose of static methods and properties?',
        'Explain how the super keyword works.'
      ],
      relatedProject: 'School database modeling Students, Teachers, and Employees.'
    },
    {
      orderNumber: 17,
      category: 'Object Oriented Programming',
      title: 'Day 17: Core OOP Pillars',
      description: 'Encapsulation, Abstraction, Polymorphism, Abstraction details',
      estimatedTime: 90,
      difficulty: 'Hard',
      practiceQuestions: [
        'Create private class properties (#) to implement encapsulation.',
        'Write a polymorphistic method speak() in parent Animal class, overridden in Dog/Cat.',
        'Create abstract behaviors requiring subclasses to define specific methods.'
      ],
      interviewQuestions: [
        'What are the 4 pillars of Object-Oriented Programming?',
        'How does JavaScript implement private properties?'
      ],
      relatedProject: 'Payment Gateway simulation modeling CreditCard, UPI, and PayPal systems.'
    },
    {
      orderNumber: 18,
      category: 'DOM',
      title: 'Day 18: BOM, DOM & Manipulating Elements',
      description: 'Browser Object Model (BOM), Document Object Model (DOM), Manipulating DOM Elements',
      estimatedTime: 75,
      difficulty: 'Easy',
      practiceQuestions: [
        'Query DOM using querySelector and querySelectorAll.',
        'Create, append, and remove elements from the page.',
        'Read window screen details, location, and navigator variables.'
      ],
      interviewQuestions: [
        'What is the difference between BOM and DOM?',
        'Explain the difference between querySelectorAll returning NodeList vs getElementsByClassName returning HTMLCollection.'
      ],
      relatedProject: 'Dynamic grid layout with element adding and styling panels.'
    },
    {
      orderNumber: 19,
      category: 'DOM',
      title: 'Day 19: DOM Events + Practice',
      description: 'Event Handling in DOM + DOM Practice',
      estimatedTime: 75,
      difficulty: 'Easy',
      practiceQuestions: [
        'Listen for change, focus, and blur events on form inputs.',
        'Track mouse cursor coordinates on mousemove and display in screen.',
        'Listen to keydown events and move an absolute div on keys.'
      ],
      interviewQuestions: [
        'Difference between onload and DOMContentLoaded events.',
        'How do you handle keyboard inputs dynamically?'
      ],
      relatedProject: 'Mini canvas painting block or box key navigation game.'
    },
    {
      orderNumber: 20,
      category: 'Asynchronous JavaScript',
      title: 'Day 20: Callbacks & Promises',
      description: 'Callbacks, Callback Hell, Promises, Promise States',
      estimatedTime: 90,
      difficulty: 'Medium',
      practiceQuestions: [
        'Write a function that resolves a Promise after 2 seconds.',
        'Demonstrate nesting callbacks showing callback hell, then resolve using Promises.',
        'Handle Promise rejection using catch.'
      ],
      interviewQuestions: [
        'What are the three states of a Promise?',
        'Explain callback hell and how Promises solve it.'
      ],
      relatedProject: 'Simulated server fetch status loader.'
    },
    {
      orderNumber: 21,
      category: 'Asynchronous JavaScript',
      title: 'Day 21: Promise Chaining & Async/Await',
      description: 'Promise Chaining, Promise API (all, race, settled), Async/Await',
      estimatedTime: 90,
      difficulty: 'Hard',
      practiceQuestions: [
        'Chain multiple promises returning sequential math operations.',
        'Perform concurrent API queries using Promise.all().',
        'Refactor a promise chain to use async/await with try-catch blocks.'
      ],
      interviewQuestions: [
        'Why does async/await make asynchronous code read like synchronous code?',
        'What is the difference between Promise.all and Promise.allSettled?'
      ],
      relatedProject: 'Multi-source weather dashboard fetching from mocked nodes concurrently.'
    },
    {
      orderNumber: 22,
      category: 'Intermediate Projects',
      title: 'Day 22: Toast, OTP Input & Progress Bar',
      description: 'Intermediate Projects: Toast Notification, OTP Input Field, Multi-Step Progress Bar',
      estimatedTime: 120,
      difficulty: 'Medium',
      practiceQuestions: [
        'Create a toast alert manager populating alerts that slide out and fade.',
        'Build a 4-digit OTP code input focusing the next input on keypress.',
        'Create a multi-step progress bar showing Next/Prev indicator updates.'
      ],
      interviewQuestions: [
        'How do you manage input focus states dynamically?',
        'What CSS transitions work best with Framer Motion style layouts?'
      ],
      relatedProject: 'User login verification modal panel with progress.'
    },
    {
      orderNumber: 23,
      category: 'Intermediate Projects',
      title: 'Day 23: Grade Calc, Quiz App & Price Slider',
      description: 'Intermediate Projects: Student Grade Calculator, Quiz App, Price Range Slider',
      estimatedTime: 120,
      difficulty: 'Medium',
      practiceQuestions: [
        'Build a Quiz app tracking score, answers, and showing results.',
        'Create a dynamic range input showing live price tags updates.',
        'Write a script validating form inputs before calculating grades.'
      ],
      interviewQuestions: [
        'How do arrays of objects represent quiz questions, choices, and correct keys?',
        'How do input range values change target text content?'
      ],
      relatedProject: 'Grade Evaluator and Price Range slider filter engine.'
    },
    {
      orderNumber: 24,
      category: 'Intermediate Projects',
      title: 'Day 24: GitHub Search, Sortable Table & Expense Tracker',
      description: 'Intermediate Projects: GitHub Profile Search, Sortable Table, Expense Tracker',
      estimatedTime: 120,
      difficulty: 'Medium',
      practiceQuestions: [
        'Query the Github public API and render profile details.',
        'Write a function sorting a table of users by Name or Age.',
        'Create an expense tracker with items list, cost, and aggregate sum.'
      ],
      interviewQuestions: [
        'How do you render HTML lists from JSON arrays dynamically?',
        'How do you sort table arrays inside Javascript?'
      ],
      relatedProject: 'Full Expense Tracker dashboard with sortable lists.'
    },
    {
      orderNumber: 25,
      category: 'JSON & RegEx',
      title: 'Day 25: JSON Tutorial, Parse & Diff Objects',
      description: 'JSON Tutorial, JSON vs JavaScript Object, Parse JSON',
      estimatedTime: 45,
      difficulty: 'Easy',
      practiceQuestions: [
        'Parse a JSON string representing configurations safely.',
        'Convert a complex nested JS Object to JSON and back.',
        'Compare properties of JSON parsed structures.'
      ],
      interviewQuestions: [
        'What are the core differences between a JSON string and a JavaScript Object?',
        'What values cannot be represented in JSON (e.g. methods)?'
      ],
      relatedProject: 'JSON config editor and validator widget.'
    },
    {
      orderNumber: 26,
      category: 'JSON & RegEx',
      title: 'Day 26: JSON Reference & Regular Expressions',
      description: 'Read JSON Files, JSON Reference, Regular Expressions introduction',
      estimatedTime: 75,
      difficulty: 'Medium',
      practiceQuestions: [
        'Test strings for containing digits using regex.',
        'Verify user inputs for specific patterns.',
        'Read simulated local JSON files.'
      ],
      interviewQuestions: [
        'What are RegExp objects in JavaScript?',
        'How does regex.test() differ from string.match()?'
      ],
      relatedProject: 'Text pattern matcher log validator.'
    },
    {
      orderNumber: 27,
      category: 'JSON & RegEx',
      title: 'Day 27: Regex Form & Password Validation',
      description: 'Form, Email, Number, Username, Password & URL Validation',
      estimatedTime: 90,
      difficulty: 'Medium',
      practiceQuestions: [
        'Create a password regex requiring numbers, letters, and symbols.',
        'Create a regex validating URLs (http, https).',
        'Highlight invalid form inputs in real time.'
      ],
      interviewQuestions: [
        'How do you construct robust validation regex structures?',
        'What is search and replace using regex inside strings?'
      ],
      relatedProject: 'Complete Registration form validator checking username, password, URL.'
    },
    {
      orderNumber: 28,
      category: 'Error Handling',
      title: 'Day 28: Try/Catch & Custom Errors',
      description: 'Errors & Exceptions, try-catch, throw, finally, Custom Errors, Debugging',
      estimatedTime: 60,
      difficulty: 'Medium',
      practiceQuestions: [
        'Gracefully catch JSON parsing errors using try/catch.',
        'Create a custom DatabaseConnectionError class extending Error.',
        'Add a finally block completing data log cleanup.'
      ],
      interviewQuestions: [
        'Explain try-catch-finally control flow.',
        'How do you throw custom error classes in JavaScript?'
      ],
      relatedProject: 'Protected network connection simulator reporting errors.'
    },
    {
      orderNumber: 29,
      category: 'Performance',
      title: 'Day 29: Jest, Performance & Optimization',
      description: 'Unit Testing with Jest, Memory Management, Garbage Collection, Lazy Loading, Debouncing, Throttling',
      estimatedTime: 120,
      difficulty: 'Hard',
      practiceQuestions: [
        'Write a simple Jest unit test evaluating basic calculators.',
        'Write debouncing and throttling functions from scratch.',
        'Demonstrate memory leaks by failing to clear event listeners.'
      ],
      interviewQuestions: [
        'What is the difference between debouncing and throttling?',
        'How does garbage collection work in JavaScript engines?'
      ],
      relatedProject: 'Optimization dashboard testing performance logs.'
    },
    {
      orderNumber: 30,
      category: 'Advanced & Frameworks',
      title: 'Day 30: Cheat Sheets, Quizzes & Frameworks',
      description: 'Advanced Projects Overview, JavaScript Quizzes, Coding Problems, Interview Questions, JavaScript Cheat Sheet, Libraries & Frameworks',
      estimatedTime: 120,
      difficulty: 'Medium',
      practiceQuestions: [
        'Complete a Javascript Cheat Sheet containing core syntax.',
        'Verify advanced questions about closures and event loops.',
        'Examine basic React structure.'
      ],
      interviewQuestions: [
        'What is a Single Page Application (SPA)?',
        'How do modern bundlers like Vite improve development speed?'
      ],
      relatedProject: 'Full Roadmap Study Cheat Sheet reference library.'
    }
  ];

  for (const topic of customRoadmap) {
    await prisma.javaScriptTopic.upsert({
      where: { title: topic.title },
      update: {
        category: topic.category,
        description: topic.description,
        estimatedTime: topic.estimatedTime,
        difficulty: topic.difficulty,
        orderNumber: topic.orderNumber,
        practiceQuestions: JSON.stringify(topic.practiceQuestions),
        interviewQuestions: JSON.stringify(topic.interviewQuestions),
        relatedProject: topic.relatedProject
      },
      create: {
        category: topic.category,
        title: topic.title,
        description: topic.description,
        estimatedTime: topic.estimatedTime,
        difficulty: topic.difficulty,
        orderNumber: topic.orderNumber,
        practiceQuestions: JSON.stringify(topic.practiceQuestions),
        interviewQuestions: JSON.stringify(topic.interviewQuestions),
        relatedProject: topic.relatedProject
      }
    });
  }

  console.log('Custom 30-Day JavaScript Roadmap seeded.');
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
