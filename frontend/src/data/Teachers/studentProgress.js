// OOP-style StudentProgress model + mock data

export class StudentProgress {
    constructor({
      id,
      name,
      gradeLevel,
      readingLevel,
      activitiesCompleted,
      totalActivities,
      recentActivity,
    }) {
      this.id = id;
      this.name = name;
      this.gradeLevel = gradeLevel;
      this.readingLevel = readingLevel;
      this.activitiesCompleted = activitiesCompleted;
      this.totalActivities = totalActivities;
      this.recentActivity = recentActivity;
    }
  }
  
  export const mockStudentProgress = [
    new StudentProgress({
      id: "101",
      name: "Juan dela Cruz",
      gradeLevel: "Grade 3",
      readingLevel: "Antas 2",
      activitiesCompleted: 15,
      totalActivities: 20,
      recentActivity: "Phonics A",
    }),
    new StudentProgress({
      id: "102",
      name: "Maria Santos",
      gradeLevel: "Grade 2",
      readingLevel: "Antas 1",
      activitiesCompleted: 10,
      totalActivities: 16,
      recentActivity: "Alphabet Test",
    }),
    new StudentProgress({
      id: "103",
      name: "Pedro Ramirez",
      gradeLevel: "Grade 3",
      readingLevel: "Antas 2",
      activitiesCompleted: 28,
      totalActivities: 30,
      recentActivity: "Comprehension Set B",
    }),
    new StudentProgress({
      id: "104",
      name: "Isabella Cruz",
      gradeLevel: "Grade 1",
      readingLevel: "Antas 1",
      activitiesCompleted: 12,
      totalActivities: 15,
      recentActivity: "Letter Matching",
    }),
    new StudentProgress({
      id: "105",
      name: "Luis Mendoza",
      gradeLevel: "Grade 2",
      readingLevel: "Antas 2",
      activitiesCompleted: 8,
      totalActivities: 16,
      recentActivity: "Word Recognition",
    }),
    new StudentProgress({
      id: "106",
      name: "Sophia Reyes",
      gradeLevel: "Grade 3",
      readingLevel: "Antas 3",
      activitiesCompleted: 22,
      totalActivities: 25,
      recentActivity: "Critical Text Analysis",
    }),
    new StudentProgress({
      id: "107",
      name: "Miguel Pascual",
      gradeLevel: "Grade 2",
      readingLevel: "Antas 1",
      activitiesCompleted: 5,
      totalActivities: 10,
      recentActivity: "Syllable Drills",
    }),
    new StudentProgress({
      id: "108",
      name: "Anne Marquez",
      gradeLevel: "Grade 1",
      readingLevel: "Antas 1",
      activitiesCompleted: 9,
      totalActivities: 12,
      recentActivity: "Rhyming Words",
    }),
    new StudentProgress({
      id: "109",
      name: "Josefina Cruz",
      gradeLevel: "Grade 3",
      readingLevel: "Antas 2",
      activitiesCompleted: 18,
      totalActivities: 20,
      recentActivity: "Reading Comprehension 2",
    }),
    new StudentProgress({
      id: "110",
      name: "Diana Santos",
      gradeLevel: "Grade 3",
      readingLevel: "Antas 3",
      activitiesCompleted: 25,
      totalActivities: 30,
      recentActivity: "Spelling Test",
    }),
  ];
  