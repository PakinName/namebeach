import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.quizAnswer.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.quizOption.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.lessonCompletion.deleteMany();
  await prisma.studentProgress.deleteMany();
  await prisma.classroomLesson.deleteMany();
  await prisma.classroomMember.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.fileUpload.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.contactSupport.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();
  console.log('  ✅ Cleaned existing data');

  // Create Users
  const password = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@ailms.com', password, role: 'ADMIN', bio: 'System administrator' },
  });

  const teacher = await prisma.user.create({
    data: { name: 'Dr. Sarah Chen', email: 'teacher@ailms.com', password, role: 'TEACHER', bio: 'Computer Science Professor with 10+ years of experience' },
  });

  const student1 = await prisma.user.create({
    data: { name: 'John Smith', email: 'student@ailms.com', password, role: 'STUDENT', bio: 'Eager learner' },
  });

  const student2 = await prisma.user.create({
    data: { name: 'Jane Doe', email: 'jane@ailms.com', password, role: 'STUDENT', bio: 'CS major student' },
  });

  const student3 = await prisma.user.create({
    data: { name: 'Bob Wilson', email: 'bob@ailms.com', password, role: 'STUDENT', bio: 'Self-taught developer' },
  });

  console.log('  ✅ Created 5 users (admin, teacher, 3 students)');

  // Course 1: Introduction to Programming
  const course1 = await prisma.course.create({
    data: {
      title: 'Introduction to Programming',
      description: 'Learn the fundamentals of programming with Python. This comprehensive course covers variables, data types, control structures, functions, and basic algorithms. Perfect for absolute beginners.',
      category: 'Programming',
      difficulty: 'BEGINNER',
      estimatedTime: 40,
      published: true,
      teacherId: teacher.id,
    },
  });

  const c1Chapters = [
    { title: 'Getting Started', desc: 'Introduction to programming concepts and setting up your environment' },
    { title: 'Variables & Data Types', desc: 'Understanding variables, strings, numbers, and booleans' },
    { title: 'Control Structures', desc: 'If statements, loops, and decision making' },
    { title: 'Functions', desc: 'Creating reusable code with functions and parameters' },
    { title: 'Lists & Dictionaries', desc: 'Working with collections of data' },
  ];

  for (let i = 0; i < c1Chapters.length; i++) {
    const chapter = await prisma.chapter.create({
      data: {
        courseId: course1.id,
        title: c1Chapters[i].title,
        description: c1Chapters[i].desc,
        orderIndex: i,
      },
    });

    // Create 5 lessons per chapter
    const lessons = [
      { title: `${c1Chapters[i].title} - Introduction`, content: `Welcome to the lesson on ${c1Chapters[i].title}. In this lesson, you will learn the core concepts and fundamentals.\n\nProgramming is the process of creating a set of instructions that tell a computer how to perform a task. Programming can be done using many different programming languages.`, videoUrl: 'https://youtube.com/watch?v=kqtD5dpn9C8', estimatedTime: 15, objectives: ['Understand core concepts', 'Set up development environment'], codeExample: `# Welcome to ${c1Chapters[i].title}\nprint("Hello, World!")\n\n# This is a comment\n# Comments help explain your code` },
      { title: `${c1Chapters[i].title} - Core Concepts`, content: `This lesson covers the core concepts of ${c1Chapters[i].title}. Understanding these fundamentals is crucial for your programming journey.\n\nLet's dive deep into the concepts and understand how they work together.`, estimatedTime: 20, objectives: ['Master core concepts', 'Apply knowledge practically'], codeExample: `# Core concepts example\nfor i in range(5):\n    print(f"Iteration {i}")` },
      { title: `${c1Chapters[i].title} - Practice`, content: `Time to practice! In this lesson, you'll work through exercises related to ${c1Chapters[i].title}.\n\nPractice is the key to mastering programming. Try each exercise multiple times.`, estimatedTime: 25, objectives: ['Complete practice exercises', 'Build confidence'] },
      { title: `${c1Chapters[i].title} - Advanced Topics`, content: `Now that you understand the basics, let's explore some advanced topics in ${c1Chapters[i].title}.\n\nThese concepts will help you write more efficient and elegant code.`, estimatedTime: 20, objectives: ['Explore advanced concepts', 'Write efficient code'] },
      { title: `${c1Chapters[i].title} - Summary & Review`, content: `Let's review everything we've learned about ${c1Chapters[i].title}.\n\nMake sure you understand all the key concepts before taking the quiz. You need at least 50% to pass and unlock the next chapter.`, estimatedTime: 10, objectives: ['Review all concepts', 'Prepare for quiz'], resources: ['https://docs.python.org/3/tutorial/'] },
    ];

    for (let j = 0; j < lessons.length; j++) {
      await prisma.lesson.create({
        data: {
          chapterId: chapter.id,
          title: lessons[j].title,
          description: `Lesson ${j + 1} of ${c1Chapters[i].title}`,
          content: lessons[j].content,
          videoUrl: lessons[j].videoUrl || null,
          estimatedTime: lessons[j].estimatedTime,
          objectives: lessons[j].objectives || [],
          resources: lessons[j].resources || [],
          codeExample: lessons[j].codeExample || null,
          orderIndex: j,
          imageUrls: [],
        },
      });
    }

    // Create quiz with 10 questions
    const quiz = await prisma.quiz.create({
      data: {
        chapterId: chapter.id,
        title: `${c1Chapters[i].title} Quiz`,
        description: `Test your knowledge of ${c1Chapters[i].title}. You need at least 50% to pass.`,
        passingScore: 50,
      },
    });

    const questions = getQuizQuestions(i, c1Chapters[i].title);
    for (let q = 0; q < questions.length; q++) {
      await prisma.quizQuestion.create({
        data: {
          quizId: quiz.id,
          questionText: questions[q].text,
          questionType: questions[q].type,
          explanation: questions[q].explanation,
          orderIndex: q,
          points: 1,
          options: {
            create: questions[q].options,
          },
        },
      });
    }
  }

  console.log('  ✅ Created Course 1: Introduction to Programming (5 chapters, 25 lessons, 50 quiz questions)');

  // Course 2: Web Development
  const course2 = await prisma.course.create({
    data: {
      title: 'Web Development Fundamentals',
      description: 'Build modern websites with HTML, CSS, and JavaScript. Learn responsive design, DOM manipulation, and modern web APIs. Includes hands-on projects.',
      category: 'Web Development',
      difficulty: 'INTERMEDIATE',
      estimatedTime: 60,
      published: true,
      teacherId: teacher.id,
    },
  });

  const c2Chapters = [
    { title: 'HTML Basics', desc: 'Structure of web pages with HTML5' },
    { title: 'CSS Styling', desc: 'Making websites beautiful with CSS3' },
    { title: 'JavaScript Fundamentals', desc: 'Adding interactivity with JavaScript' },
    { title: 'Responsive Design', desc: 'Building mobile-friendly websites' },
    { title: 'Modern Web APIs', desc: 'Fetch, Storage, and more' },
  ];

  for (let i = 0; i < c2Chapters.length; i++) {
    const chapter = await prisma.chapter.create({
      data: { courseId: course2.id, title: c2Chapters[i].title, description: c2Chapters[i].desc, orderIndex: i },
    });

    for (let j = 0; j < 5; j++) {
      await prisma.lesson.create({
        data: {
          chapterId: chapter.id,
          title: `${c2Chapters[i].title} - Part ${j + 1}`,
          content: `This lesson covers part ${j + 1} of ${c2Chapters[i].title}. Web development is an essential skill in today's digital world.`,
          estimatedTime: 15 + j * 5,
          objectives: [`Learn ${c2Chapters[i].title} part ${j + 1}`, 'Practice with exercises'],
          orderIndex: j,
          imageUrls: [],
          resources: [],
          codeExample: `<!-- ${c2Chapters[i].title} Example -->\n<div class="container">\n  <h1>Hello Web Dev!</h1>\n  <p>Part ${j + 1}</p>\n</div>`,
        },
      });
    }

    const quiz = await prisma.quiz.create({
      data: { chapterId: chapter.id, title: `${c2Chapters[i].title} Quiz`, passingScore: 50 },
    });

    for (let q = 0; q < 10; q++) {
      await prisma.quizQuestion.create({
        data: {
          quizId: quiz.id,
          questionText: `Web Dev Q${q + 1}: What is the correct ${c2Chapters[i].title} approach for ${['structure', 'styling', 'functionality', 'layout', 'semantics'][q % 5]}?`,
          questionType: q % 3 === 0 ? 'TRUE_FALSE' : 'MULTIPLE_CHOICE',
          explanation: `This concept is fundamental to ${c2Chapters[i].title}.`,
          orderIndex: q,
          options: {
            create: q % 3 === 0
              ? [{ optionText: 'True', isCorrect: true }, { optionText: 'False', isCorrect: false }]
              : [
                  { optionText: 'Correct approach', isCorrect: true },
                  { optionText: 'Incorrect approach A', isCorrect: false },
                  { optionText: 'Incorrect approach B', isCorrect: false },
                  { optionText: 'Incorrect approach C', isCorrect: false },
                ],
          },
        },
      });
    }
  }

  console.log('  ✅ Created Course 2: Web Development (5 chapters, 25 lessons, 50 quiz questions)');

  // Course 3: Data Science
  const course3 = await prisma.course.create({
    data: {
      title: 'Data Science with Python',
      description: 'Explore the world of data science using Python, NumPy, Pandas, and Matplotlib. Learn data analysis, visualization, and basic machine learning concepts.',
      category: 'Data Science',
      difficulty: 'ADVANCED',
      estimatedTime: 80,
      published: true,
      teacherId: teacher.id,
    },
  });

  const c3Chapters = [
    { title: 'Introduction to Data Science', desc: 'Overview of data science and its applications' },
    { title: 'NumPy & Arrays', desc: 'Numerical computing with NumPy' },
    { title: 'Pandas & DataFrames', desc: 'Data manipulation and analysis' },
    { title: 'Data Visualization', desc: 'Creating charts and plots with Matplotlib' },
    { title: 'Machine Learning Basics', desc: 'Introduction to ML algorithms' },
  ];

  for (let i = 0; i < c3Chapters.length; i++) {
    const chapter = await prisma.chapter.create({
      data: { courseId: course3.id, title: c3Chapters[i].title, description: c3Chapters[i].desc, orderIndex: i },
    });

    for (let j = 0; j < 5; j++) {
      await prisma.lesson.create({
        data: {
          chapterId: chapter.id,
          title: `${c3Chapters[i].title} - Lesson ${j + 1}`,
          content: `Deep dive into ${c3Chapters[i].title}. Data science combines domain expertise, programming, and mathematics to extract meaningful insights from data.`,
          estimatedTime: 20 + j * 5,
          objectives: [`Master ${c3Chapters[i].title}`, 'Apply to real datasets'],
          orderIndex: j,
          imageUrls: [],
          resources: [],
          codeExample: `import numpy as np\nimport pandas as pd\n\n# ${c3Chapters[i].title} - Example ${j + 1}\ndata = np.array([1, 2, 3, 4, 5])\nprint(f"Mean: {data.mean()}")`,
        },
      });
    }

    const quiz = await prisma.quiz.create({
      data: { chapterId: chapter.id, title: `${c3Chapters[i].title} Quiz`, passingScore: 50 },
    });

    for (let q = 0; q < 10; q++) {
      await prisma.quizQuestion.create({
        data: {
          quizId: quiz.id,
          questionText: `DS Q${q + 1}: In ${c3Chapters[i].title}, what is the best approach for ${['analysis', 'visualization', 'modeling', 'cleaning', 'transformation'][q % 5]}?`,
          questionType: q % 4 === 0 ? 'TRUE_FALSE' : 'MULTIPLE_CHOICE',
          explanation: `Understanding ${c3Chapters[i].title} is essential for data science.`,
          orderIndex: q,
          options: {
            create: q % 4 === 0
              ? [{ optionText: 'True', isCorrect: true }, { optionText: 'False', isCorrect: false }]
              : [
                  { optionText: 'Best practice approach', isCorrect: true },
                  { optionText: 'Suboptimal approach', isCorrect: false },
                  { optionText: 'Incorrect approach', isCorrect: false },
                  { optionText: 'Outdated approach', isCorrect: false },
                ],
          },
        },
      });
    }
  }

  console.log('  ✅ Created Course 3: Data Science (5 chapters, 25 lessons, 50 quiz questions)');

  // Create 2 Classrooms
  const classroom1 = await prisma.classroom.create({
    data: {
      name: 'CS101 — Intro to Programming',
      description: 'Fall 2024 classroom for Introduction to Programming course',
      code: 'CS101A',
      teacherId: teacher.id,
    },
  });

  const classroom2 = await prisma.classroom.create({
    data: {
      name: 'WEB201 — Web Development',
      description: 'Web Development class for intermediate students',
      code: 'WEB201',
      teacherId: teacher.id,
    },
  });

  // Add students to classrooms
  await prisma.classroomMember.createMany({
    data: [
      { classroomId: classroom1.id, studentId: student1.id },
      { classroomId: classroom1.id, studentId: student2.id },
      { classroomId: classroom1.id, studentId: student3.id },
      { classroomId: classroom2.id, studentId: student1.id },
      { classroomId: classroom2.id, studentId: student2.id },
    ],
  });

  // Create announcements
  await prisma.announcement.createMany({
    data: [
      { classroomId: classroom1.id, authorId: teacher.id, title: 'Welcome to CS101! 🎉', content: 'Welcome to Introduction to Programming! Please start with Chapter 1 and work through the lessons at your own pace. Remember, you need 50% on each quiz to unlock the next chapter.', pinned: true },
      { classroomId: classroom1.id, authorId: teacher.id, title: 'Office Hours Update', content: 'Office hours are now Mon/Wed 2-4 PM. Feel free to come by with questions about the course material.' },
      { classroomId: classroom2.id, authorId: teacher.id, title: 'Welcome to Web Development! 🌐', content: 'Excited to have you in this class! We will be building modern websites from scratch. Make sure to have a code editor installed.', pinned: true },
      { classroomId: classroom2.id, authorId: teacher.id, title: 'Project 1 Deadline', content: 'Reminder: Project 1 (Personal Portfolio) is due next Friday. Please submit through the classroom.' },
    ],
  });

  console.log('  ✅ Created 2 classrooms with members and announcements');

  // Initialize student progress for student1 on course1 (partially completed)
  const course1Chapters = await prisma.chapter.findMany({
    where: { courseId: course1.id },
    orderBy: { orderIndex: 'asc' },
  });

  if (course1Chapters.length > 0) {
    // Chapter 1: completed
    await prisma.studentProgress.create({
      data: { studentId: student1.id, courseId: course1.id, chapterId: course1Chapters[0].id, unlocked: true, completed: true, highestScore: 80, completedAt: new Date() },
    });
    // Chapter 2: unlocked
    await prisma.studentProgress.create({
      data: { studentId: student1.id, courseId: course1.id, chapterId: course1Chapters[1].id, unlocked: true, completed: false, highestScore: 0 },
    });
    // Remaining: locked
    for (let i = 2; i < course1Chapters.length; i++) {
      await prisma.studentProgress.create({
        data: { studentId: student1.id, courseId: course1.id, chapterId: course1Chapters[i].id, unlocked: false, completed: false, highestScore: 0 },
      });
    }
  }

  console.log('  ✅ Initialized student progress (student1: Chapter 1 completed, Chapter 2 unlocked)');

  // Create some notifications
  await prisma.notification.createMany({
    data: [
      { userId: student1.id, type: 'QUIZ_PASSED', title: 'Quiz Passed! ✅', message: 'You scored 80% on Getting Started Quiz', link: '/courses/' + course1.id },
      { userId: student1.id, type: 'CHAPTER_UNLOCKED', title: 'Chapter Unlocked! 🔓', message: 'You unlocked "Variables & Data Types" in Introduction to Programming', link: '/courses/' + course1.id },
      { userId: student1.id, type: 'ANNOUNCEMENT', title: 'New Announcement', message: 'Welcome to CS101!', link: '/classrooms/' + classroom1.id },
    ],
  });

  console.log('  ✅ Created sample notifications');

  console.log('\n🎉 Seeding complete!\n');
  console.log('📋 Demo Accounts:');
  console.log('  Admin:   admin@ailms.com / password123');
  console.log('  Teacher: teacher@ailms.com / password123');
  console.log('  Student: student@ailms.com / password123');
  console.log('  Student: jane@ailms.com / password123');
  console.log('  Student: bob@ailms.com / password123');
  console.log('\n📊 Data Summary:');
  console.log('  3 Courses × 5 Chapters × 5 Lessons = 75 Lessons');
  console.log('  3 Courses × 5 Chapters × 10 Questions = 150 Quiz Questions');
  console.log('  2 Classrooms with members and announcements');
}

function getQuizQuestions(chapterIndex: number, chapterTitle: string) {
  const baseQuestions = [
    {
      text: `What is the primary purpose of ${chapterTitle} in programming?`,
      type: 'MULTIPLE_CHOICE' as const,
      explanation: `${chapterTitle} is a fundamental concept that enables structured programming.`,
      options: [
        { optionText: 'To organize and structure code effectively', isCorrect: true },
        { optionText: 'To make code run slower', isCorrect: false },
        { optionText: 'To delete files from the computer', isCorrect: false },
        { optionText: 'To access the internet', isCorrect: false },
      ],
    },
    {
      text: `Python is a case-sensitive programming language.`,
      type: 'TRUE_FALSE' as const,
      explanation: 'Python is indeed case-sensitive. "Variable" and "variable" are different identifiers.',
      options: [
        { optionText: 'True', isCorrect: true },
        { optionText: 'False', isCorrect: false },
      ],
    },
    {
      text: `Which of the following is the correct way to print text in Python?`,
      type: 'MULTIPLE_CHOICE' as const,
      explanation: 'In Python, print() is the built-in function for outputting text to the console.',
      options: [
        { optionText: 'print("Hello")', isCorrect: true },
        { optionText: 'echo "Hello"', isCorrect: false },
        { optionText: 'console.log("Hello")', isCorrect: false },
        { optionText: 'System.out.println("Hello")', isCorrect: false },
      ],
    },
    {
      text: `A variable in Python must be declared with a type keyword.`,
      type: 'TRUE_FALSE' as const,
      explanation: 'Python uses dynamic typing. You do not need to declare variable types explicitly.',
      options: [
        { optionText: 'True', isCorrect: false },
        { optionText: 'False', isCorrect: true },
      ],
    },
    {
      text: `What does the len() function do in Python?`,
      type: 'MULTIPLE_CHOICE' as const,
      explanation: 'len() returns the number of items in an object, such as the number of characters in a string.',
      options: [
        { optionText: 'Returns the length/size of an object', isCorrect: true },
        { optionText: 'Creates a new list', isCorrect: false },
        { optionText: 'Converts to lowercase', isCorrect: false },
        { optionText: 'Deletes an item', isCorrect: false },
      ],
    },
    {
      text: `Which symbol is used for comments in Python?`,
      type: 'MULTIPLE_CHOICE' as const,
      explanation: 'The hash symbol (#) is used for single-line comments in Python.',
      options: [
        { optionText: '#', isCorrect: true },
        { optionText: '//', isCorrect: false },
        { optionText: '/* */', isCorrect: false },
        { optionText: '--', isCorrect: false },
      ],
    },
    {
      text: `Python supports multiple programming paradigms.`,
      type: 'TRUE_FALSE' as const,
      explanation: 'Python supports procedural, object-oriented, and functional programming paradigms.',
      options: [
        { optionText: 'True', isCorrect: true },
        { optionText: 'False', isCorrect: false },
      ],
    },
    {
      text: `What is the output of: type(42)?`,
      type: 'MULTIPLE_CHOICE' as const,
      explanation: '42 is an integer in Python, so type(42) returns <class "int">.',
      options: [
        { optionText: "<class 'int'>", isCorrect: true },
        { optionText: "<class 'str'>", isCorrect: false },
        { optionText: "<class 'float'>", isCorrect: false },
        { optionText: "<class 'number'>", isCorrect: false },
      ],
    },
    {
      text: `Indentation in Python is mandatory and affects code execution.`,
      type: 'TRUE_FALSE' as const,
      explanation: 'Unlike many languages, Python uses indentation to define code blocks. Incorrect indentation causes errors.',
      options: [
        { optionText: 'True', isCorrect: true },
        { optionText: 'False', isCorrect: false },
      ],
    },
    {
      text: `Which of these is NOT a valid Python data type?`,
      type: 'MULTIPLE_CHOICE' as const,
      explanation: 'Python has int, str, float, and bool types. "char" is not a built-in Python type.',
      options: [
        { optionText: 'char', isCorrect: true },
        { optionText: 'int', isCorrect: false },
        { optionText: 'str', isCorrect: false },
        { optionText: 'float', isCorrect: false },
      ],
    },
  ];

  return baseQuestions;
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
