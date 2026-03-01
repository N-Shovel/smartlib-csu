// Purpose: Seed catalog of books with metadata and availability state.
// Parts: book schema, category samples, exported dataset.
const books = [
  {
    id: 1,
    title: "Clean Code",
    author: "Robert C. Martin",
    category: "Book",
    keywords: ["clean code", "software engineering", "refactoring", "agile"],
    available: true,
    borrowedBy: null,
    description: "A Handbook of Agile Software Craftsmanship."
  },
  {
    id: 2,
    title: "JavaScript: The Good Parts",
    author: "Douglas Crockford",
    category: "Book",
    keywords: ["javascript", "programming", "web", "language"],
    available: false,
    borrowedBy: "borrower@library.com",
    description: "Deep dive into the core mechanisms of JavaScript."
  },
  {
    id: 3,
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen",
    category: "Book",
    keywords: ["algorithms", "data structures", "computer science"],
    available: true,
    borrowedBy: null,
    description: "Comprehensive guide to algorithms."
  },
  {
    id: 4,
    title: "AI-Based Flood Risk Mapping for Butuan City",
    author: "CSU BSCS Thesis Group 2025",
    category: "Thesis",
    keywords: ["ai", "flood", "mapping", "machine learning", "butuan city"],
    available: true,
    borrowedBy: null,
    description:
      "A machine-learning approach that predicts flood-prone zones using rainfall, elevation, and historical flood records."
  },
  {
    id: 5,
    title: "Smart IoT Irrigation Controller for Caraga Farms",
    author: "CSU BSIT Thesis Group 2024",
    category: "Thesis",
    keywords: ["iot", "irrigation", "agriculture", "sensors", "caraga"],
    available: true,
    borrowedBy: null,
    description:
      "Design and evaluation of a sensor-driven irrigation system that automates watering schedules based on soil moisture and weather data."
  },
  {
    id: 6,
    title: "Student Queue Prediction using Time-Series Analytics",
    author: "CSU BSCS Thesis Group 2026",
    category: "Thesis",
    keywords: ["prediction", "time series", "analytics", "queue", "ai"],
    available: true,
    borrowedBy: null,
    description:
      "A predictive model for registrar and library queue lengths to help optimize staffing and reduce waiting time."
  }
];

export default books;
