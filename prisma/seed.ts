import { PrismaClient } from "@prisma/client";

import { createHash } from "~/utils/encryption";
import { AppointmentStatus, UserRole } from "~/utils/enums";

const db = new PrismaClient();

async function cleanup() {
  console.time("🧹 Cleaned up the database...");

  // Delete child tables first
  await db.questionWithAnswer.deleteMany();
  await db.appointmentQuestionnaire.deleteMany();
  await db.healthMetric.deleteMany();
  await db.meal.deleteMany();
  await db.mealPlan.deleteMany();
  await db.passwordReset.deleteMany();
  await db.doctorAvailability.deleteMany();
  await db.appointment.deleteMany();
  await db.ingredient.deleteMany();
  await db.step.deleteMany();
  await db.recipes.deleteMany();
  // Delete parent table last
  await db.user.deleteMany();

  console.timeEnd("🧹 Cleaned up the database...");
}

async function createUsers() {
  console.time("👤 Created users...");

  await db.user.create({
    data: {
      firstName: "Emily",
      lastName: "Johnson",
      email: "admin@app.com",
      city: "San Francisco",
      street: "123 Main Street",
      phoneNo: "1234567890",
      state: "CA",
      zip: "94102",
      dob: new Date("1985-07-12"),
      password: await createHash("password"),
      role: UserRole.ADMIN,
    },
  });

  await db.user.create({
    data: {
      firstName: "Sophia",
      lastName: "Anderson",
      street: "123 Main Street",
      phoneNo: "1234567890",
      city: "Houston",
      state: "TX",
      zip: "77002",
      dob: new Date("1993-11-18"),
      email: "user@app.com",
      password: await createHash("password"),
      role: UserRole.USER,
      height: "170",
      weight: "60",
    },
  });

  await db.user.create({
    data: {
      firstName: "Dr. John",
      lastName: "Doe",
      street: "456 Medical Avenue",
      phoneNo: "9876543210",
      city: "New York",
      state: "NY",
      zip: "10001",
      dob: new Date("1980-03-15"),
      email: "doctor@app.com",
      password: await createHash("password"),
      role: UserRole.DOCTOR,
      speciality: "Cardiology",
    },
  });

  await db.user.create({
    data: {
      firstName: "Dr. Jane",
      lastName: "Doe",
      email: "doctor2@app.com",
      password: await createHash("password"),
      role: UserRole.DOCTOR,
      speciality: "Pediatrics",
      street: "456 Medical Avenue",
      phoneNo: "9876543210",
      city: "New York",
      state: "NY",
      zip: "10001",
      dob: new Date("1980-03-15"),
    },
  });

  console.timeEnd("👤 Created users...");
}

async function createRecipes() {
  console.time("🍽️ Created recipes...");

  const user = await db.user.findFirst({ where: { role: UserRole.ADMIN } });

  if (!user) {
    throw new Error("User not found");
  }

  const recipes = [
    {
      title: "Low-Carb Cauliflower Rice Stir-Fry",
      description: "A healthy, low-carb alternative to traditional fried rice.",
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRcJlx0_Hw3ca09XvaFpi9eFyBHCYAOGILwQ&s",
      price: 1200,
      cookingTime: "25 minutes",
      userId: user.id,
      steps: [
        {
          order: 1,
          content: "Pulse cauliflower florets in a food processor to create rice-like texture.",
        },
        { order: 2, content: "Heat oil in a large skillet and sauté vegetables." },
        { order: 3, content: "Add cauliflower rice and cook until tender." },
        { order: 4, content: "Season with soy sauce and serve." },
      ],
      ingredients: [
        { name: "Cauliflower", quantity: "1 medium head" },
        { name: "Mixed vegetables", quantity: "2 cups" },
        { name: "Soy sauce", quantity: "2 tablespoons" },
        { name: "Oil", quantity: "1 tablespoon" },
      ],
    },
    {
      title: "Greek Yogurt Chicken Salad",
      description: "A protein-packed, creamy chicken salad using Greek yogurt instead of mayo.",
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRti_FeHY5aeHGaq0DeQEKE4c8XRqGy0xuRQ&s",
      price: 1500,
      cookingTime: "20 minutes",
      userId: user.id,
      steps: [
        { order: 1, content: "Mix shredded chicken with Greek yogurt." },
        { order: 2, content: "Add diced celery, grapes, and almonds." },
        { order: 3, content: "Season with salt, pepper, and herbs." },
        { order: 4, content: "Serve on lettuce leaves or whole-grain bread." },
      ],
      ingredients: [
        { name: "Cooked chicken breast", quantity: "2 cups, shredded" },
        { name: "Greek yogurt", quantity: "1/2 cup" },
        { name: "Celery", quantity: "1/4 cup, diced" },
        { name: "Grapes", quantity: "1/4 cup, halved" },
        { name: "Almonds", quantity: "2 tablespoons, sliced" },
      ],
    },
    {
      title: "Vegetarian Lentil Soup",
      description: "A hearty, fiber-rich soup that's both nutritious and satisfying.",
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLCpN73eOijn5p_CSajghYa3TBtOrEgi_puQ&s",
      price: 1000,
      cookingTime: "40 minutes",
      userId: user.id,
      steps: [
        { order: 1, content: "Sauté onions, carrots, and celery in a large pot." },
        { order: 2, content: "Add lentils, vegetable broth, and diced tomatoes." },
        { order: 3, content: "Simmer until lentils are tender." },
        { order: 4, content: "Season with herbs and serve." },
      ],
      ingredients: [
        { name: "Lentils", quantity: "1 cup" },
        { name: "Vegetable broth", quantity: "4 cups" },
        { name: "Diced tomatoes", quantity: "1 can" },
        { name: "Onion", quantity: "1, diced" },
        { name: "Carrots", quantity: "2, diced" },
        { name: "Celery", quantity: "2 stalks, diced" },
      ],
    },
  ];

  for (const recipe of recipes) {
    await db.recipes.create({
      data: {
        ...recipe,
        steps: {
          create: recipe.steps,
        },
        ingredients: {
          create: recipe.ingredients,
        },
      },
    });
  }

  console.timeEnd("🍽️ Created recipes...");
}

async function createAppointment() {
  console.time("📅 Created appointment...");

  const doctor = await db.user.findFirst({ where: { role: UserRole.DOCTOR } });
  const patient = await db.user.findFirst({ where: { role: UserRole.USER } });

  if (!doctor || !patient) {
    throw new Error("Doctor or patient not found");
  }

  await db.appointment.create({
    data: {
      doctorId: doctor.id,
      patientId: patient.id,
      date: new Date("2024-03-15T10:00:00Z"),
      status: AppointmentStatus.SCHEDULED,
      notes: "Initial consultation",
      startTime: new Date("2024-03-15T10:00:00Z"),
      endTime: new Date("2024-03-15T11:00:00Z"),
      doctorNotes: "Patient shows good progress",
      mealPlan: {
        create: {
          plan: JSON.stringify({
            name: "Weight Loss Meal Plan",
            description: "A balanced meal plan for healthy weight loss",
            calories: 2000,
            protein: 150,
            carbs: 200,
            fats: 67,
          }),
          userId: doctor.id,
          meal: {
            create: [
              {
                name: "Healthy Breakfast",
                type: "BREAKFAST",
                calories: 500,
                protein: 30,
                carbs: 60,
                fats: 20,
                foods: ["Oatmeal", "Banana", "Greek Yogurt"],
              },
              {
                name: "Light Lunch",
                type: "LUNCH",
                calories: 700,
                protein: 45,
                carbs: 70,
                fats: 25,
                foods: ["Grilled Chicken", "Brown Rice", "Steamed Vegetables"],
              },
              {
                name: "Nutritious Dinner",
                type: "DINNER",
                calories: 600,
                protein: 35,
                carbs: 50,
                fats: 22,
                foods: ["Salmon", "Quinoa", "Roasted Vegetables"],
              },
            ],
          },
        },
      },
    },
  });

  console.timeEnd("📅 Created appointment...");
}

async function createDoctorAvailability() {
  console.time("📅 Created doctor availability...");

  const doctor = await db.user.findFirst({ where: { role: UserRole.DOCTOR } });
  if (!doctor) {
    throw new Error("Doctor not found");
  }

  // Create weekly availability for the doctor
  for (let day = 0; day < 7; day++) {
    await db.doctorAvailability.create({
      data: {
        doctorId: doctor.id,
        dayOfWeek: day,
        startTime: new Date(2024, 0, 1, 9, 0), // 9 AM
        endTime: new Date(2024, 0, 1, 17, 0), // 5 PM
        isAvailable: true,
      },
    });
  }

  console.timeEnd("📅 Created doctor availability...");
}

async function createHealthMetrics() {
  console.time("📊 Created health metrics...");

  const patient = await db.user.findFirst({ where: { role: UserRole.USER } });
  const appointment = await db.appointment.findFirst();

  if (!patient || !appointment) {
    throw new Error("Patient or appointment not found");
  }

  await db.healthMetric.create({
    data: {
      userId: patient.id,
      appointmentId: appointment.id,
      waterIntake: 2.5,
      calories: 2000,
      notes: "Feeling good today",
    },
  });

  console.timeEnd("📊 Created health metrics...");
}

const QUESTIONS_DATA = [
  {
    question: "Have you seen a dietician before?",
  },
  {
    question: "Are you currently on any medications or supplements?",
  },
  {
    question: "What is your activity level, and do you any physical limitations?",
  },
  {
    question: "Are you currently following any specific diet plan or nutrition guidelines?",
  },
  {
    question: "What are your main health goals?",
  },
];

async function createQuestions() {
  console.time("❓ Created questions...");

  for (const q of QUESTIONS_DATA) {
    await db.questionWithAnswer.create({
      data: {
        question: q.question,
        answer: "",
      },
    });
  }

  console.timeEnd("❓ Created questions...");
}

async function seed() {
  console.log("🌱 Seeding...\n");

  console.time("🌱 Database has been seeded");
  await cleanup();
  await createUsers();
  await createRecipes();
  await createAppointment();
  await createDoctorAvailability();
  await createHealthMetrics();
  await createQuestions();

  console.timeEnd("🌱 Database has been seeded");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
