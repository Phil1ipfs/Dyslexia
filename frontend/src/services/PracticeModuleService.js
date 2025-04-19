// frontend/src/services/PracticeModuleService.js

class PracticeModuleService {
    static getTemplatesForConcept(concept) {
      const MOCK = {
        "Vowel Sound":          [{ id: "tpl-1", title: "Vowel Drill A‑E", itemCount: 10 }],
        "Syllable Blending":    [{ id: "tpl-2", title: "Blending Drill 1",  itemCount:  8 }],
        "Word Recognition":     [{ id: "tpl-3", title: "Word Match Set A", itemCount: 12 }],
        "Reading Comprehension":[{ id: "tpl-4", title: "Short Story Quiz", itemCount:  6 }],
      };
      return MOCK[concept] || [];
    }
  }
  
  export default PracticeModuleService;
  