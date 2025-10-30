import { Assessment } from "../models/assessment.model.js";
import { User } from "../models/user.model.js";

const sampleAssessments = [
  {
    title: "JavaScript Fundamentals",
    description: "Test your knowledge of JavaScript basics including variables, functions, and control structures.",
    skill: "JavaScript",
    difficulty: "beginner",
    timeLimit: 20,
    passingScore: 70,
    questions: [
      {
        question: "What is the correct way to declare a variable in JavaScript?",
        type: "multiple-choice",
        options: [
          { text: "var myVar = 5;", isCorrect: true },
          { text: "variable myVar = 5;", isCorrect: false },
          { text: "v myVar = 5;", isCorrect: false },
          { text: "declare myVar = 5;", isCorrect: false },
        ],
        difficulty: "beginner",
        points: 1,
      },
      {
        question: "JavaScript is a compiled language.",
        type: "true-false",
        correctAnswer: "false",
        explanation: "JavaScript is an interpreted language, not compiled.",
        difficulty: "beginner",
        points: 1,
      },
      {
        question: "Write a function that returns the sum of two numbers:",
        type: "code",
        correctAnswer: "function sum(a, b) { return a + b; }",
        difficulty: "beginner",
        points: 2,
      },
    ],
    tags: ["programming", "web-development"],
  },
  {
    title: "React Hooks Advanced",
    description: "Advanced concepts in React Hooks including useEffect, useContext, and custom hooks.",
    skill: "React",
    difficulty: "advanced",
    timeLimit: 45,
    passingScore: 80,
    questions: [
      {
        question: "Which hook is used for side effects in functional components?",
        type: "multiple-choice",
        options: [
          { text: "useState", isCorrect: false },
          { text: "useEffect", isCorrect: true },
          { text: "useContext", isCorrect: false },
          { text: "useReducer", isCorrect: false },
        ],
        difficulty: "intermediate",
        points: 1,
      },
      {
        question: "useEffect runs after every render by default.",
        type: "true-false",
        correctAnswer: "true",
        explanation: "useEffect runs after every completed render unless you specify dependencies.",
        difficulty: "intermediate",
        points: 1,
      },
      {
        question: "Create a custom hook that manages a counter with increment and decrement functions:",
        type: "code",
        correctAnswer: "function useCounter(initialValue = 0) { const [count, setCount] = useState(initialValue); const increment = () => setCount(count + 1); const decrement = () => setCount(count - 1); return { count, increment, decrement }; }",
        difficulty: "advanced",
        points: 3,
      },
    ],
    tags: ["react", "hooks", "frontend"],
  },
  {
    title: "Python Data Structures",
    description: "Test your understanding of Python lists, dictionaries, sets, and tuples.",
    skill: "Python",
    difficulty: "intermediate",
    timeLimit: 30,
    passingScore: 75,
    questions: [
      {
        question: "Which data structure is ordered and mutable in Python?",
        type: "multiple-choice",
        options: [
          { text: "Tuple", isCorrect: false },
          { text: "Set", isCorrect: false },
          { text: "List", isCorrect: true },
          { text: "Dictionary", isCorrect: false },
        ],
        difficulty: "beginner",
        points: 1,
      },
      {
        question: "Sets in Python can contain duplicate values.",
        type: "true-false",
        correctAnswer: "false",
        explanation: "Sets automatically remove duplicate values.",
        difficulty: "beginner",
        points: 1,
      },
      {
        question: "Write code to create a dictionary from two lists (keys and values):",
        type: "code",
        correctAnswer: "dict(zip(keys, values))",
        difficulty: "intermediate",
        points: 2,
      },
    ],
    tags: ["python", "data-structures", "programming"],
  },
];

export const seedAssessments = async () => {
  try {
    // Find a user to be the creator (or create a system user)
    let systemUser = await User.findOne({ firstName: "System" });
    
    if (!systemUser) {
      systemUser = await User.create({
        clerkId: "system_user",
        firstName: "System",
        lastName: "Admin",
        email: "system@skillswap.com",
        isOnBoarded: true,
      });
    }

    // Clear existing assessments
    await Assessment.deleteMany({});

    // Create assessments
    const assessments = sampleAssessments.map(assessment => ({
      ...assessment,
      createdBy: systemUser._id,
    }));

    await Assessment.insertMany(assessments);
    
    console.log("✅ Sample assessments seeded successfully!");
    console.log(`Created ${assessments.length} assessments`);
  } catch (error) {
    console.error("❌ Error seeding assessments:", error);
  }
};
