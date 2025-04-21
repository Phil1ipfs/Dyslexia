const activities = [
  {
    id: 1,
    title: "Bokabularyo: Buwan at Araw",
    level: "Antas Dalawa",
    categories: ["Talasalitaan", "Pagbasa ng Salita"],
    type: "template",
    status: "locked",
    createdAt: "2025-03-20T14:30:00Z",
    creator: "Teacher Maria",
    contentType: "Voice",
    description: "Pagsasanay na tumutulong sa mga mag-aaral na iugnay ang mga tunog sa kanilang katumbas na letra.",
    hasReadingPassage: false,
    levels: [
      {
        id: 1,
        levelName: "Level 1",
        passage: {
          text: ""
        },
        questions: [
          {
            id: 1,
            questionText: "Bigkasin ang titik 'A'",
            options: ["A", "E", "I", "O"],
            correctAnswer: 0,
            contentType: "audio"
          }
        ]
      }
    ]
  },
  {
    id: 10,
    title: "Pagsasanay: Pagbasa ng mga Simpleng Pangungusap",
    level: "Antas Tatlo",
    categories: ["Pangungusap", "Pag-unawa sa Salita"],
    type: "practice",
    status: "locked",
    createdAt: "2025-03-22T09:45:00Z",
    creator: "Teacher Jaja",
    contentType: "Reading",
    description: "Pagsasanay sa pagbasa at pag-unawa ng mga simpleng pangungusap.",
    hasReadingPassage: true,
    levels: [
      {
        id: 1,
        levelName: "Level 1",
        passage: {
          text: "Kumain ako ng mangga kahapon.",
          syllables: "Ku-ma-in a-ko ng mang-ga ka-ha-pon."
        },
        questions: [
          {
            id: 1,
            questionText: "Ano ang kinain ng nagsasalita?",
            options: ["Mansanas", "Mangga", "Saging", "Ubas"],
            correctAnswer: 1,
            contentType: "text"
          }
        ]
      },
      {
        id: 2,
        levelName: "Level 2",
        passage: {
          text: "Maglalaro kami sa parke bukas.",
          syllables: "Mag-la-la-ro ka-mi sa par-ke bu-kas."
        },
        questions: [
          {
            id: 1,
            questionText: "Saan sila maglalaro?",
            options: ["Sa bahay", "Sa paaralan", "Sa parke", "Sa beach"],
            correctAnswer: 2,
            contentType: "text"
          },
          {
            id: 2,
            questionText: "Kailan sila maglalaro?",
            options: ["Kahapon", "Ngayon", "Mamaya", "Bukas"],
            correctAnswer: 3,
            contentType: "text"
          }
        ]
      }
    ]
  },
  {
    id: 11,
    title: "Pagkilala sa mga Kilos-Salita (Pandiwa)",
    level: "Antas Apat",
    categories: ["Pangungusap", "Pagpili ng Tamang Salita"],
    type: "template",
    status: "pending",
    createdAt: "2025-03-26T10:30:00Z",
    creator: "Teacher Carlos",
    contentType: "Reading",
    description: "Masusing pag-aaral ng mga pandiwa at iba't ibang aspeto nito sa Filipino.",
    submittedAt: "2025-03-26T11:15:00Z",
    hasReadingPassage: true,
    levels: [
      {
        id: 1,
        levelName: "Level 1",
        passage: {
          text: "Ang pandiwa ay salitang kilos.",
          syllables: "Ang pan-di-wa ay sa-li-tang ki-los."
        },
        questions: [
          {
            id: 1,
            questionText: "Alin sa mga sumusunod ang pandiwa?",
            options: ["Maganda", "Kumain", "Bahay", "Malaki"],
            correctAnswer: 1,
            contentType: "text"
          },
          {
            id: 2,
            questionText: "Ano ang tawag sa salitang kilos?",
            options: ["Pangngalan", "Pang-uri", "Pandiwa", "Pang-abay"],
            correctAnswer: 2,
            contentType: "text"
          }
        ]
      }
    ]
  },
  {
    id: 12,
    title: "Pagbasa ng mga Simpleng Pangungusap",
    level: "Antas Tatlo",
    categories: ["Pangungusap", "Pag-unawa sa Salita"],
    type: "practice",
    status: "pending",
    createdAt: "2025-03-27T14:20:00Z",
    creator: "Teacher Jaja",
    contentType: "Reading",
    description: "Pagsasanay sa pagbasa at pag-unawa ng mga simpleng pangungusap sa Filipino na angkop sa Antas Tatlo.",
    submittedAt: "2025-03-27T15:00:00Z",
    hasReadingPassage: true,
    levels: [
      {
        id: 1,
        levelName: "Level 1",
        passage: {
          text: "Pumunta ako sa palengke kahapon.",
          syllables: "Pu-mun-ta a-ko sa pa-leng-ke ka-ha-pon."
        },
        questions: [
          {
            id: 1,
            questionText: "Saan pumunta ang nagsasalita?",
            options: ["Sa bahay", "Sa palengke", "Sa paaralan", "Sa parke"],
            correctAnswer: 1,
            contentType: "text"
          },
          {
            id: 2,
            questionText: "Kailan pumunta ang nagsasalita sa palengke?",
            options: ["Kahapon", "Ngayon", "Bukas", "Mamaya"],
            correctAnswer: 0,
            contentType: "text"
          }
        ]
      },
      {
        id: 2,
        levelName: "Level 2",
        passage: {
          text: "Bumili ako ng prutas tulad ng mangga, saging, at mansanas.",
          syllables: "Bu-mi-li a-ko ng pru-tas tu-lad ng mang-ga, sa-ging, at man-sa-nas."
        },
        questions: [
          {
            id: 1,
            questionText: "Ano ang binili ng nagsasalita?",
            options: ["Gulay", "Isda", "Prutas", "Karne"],
            correctAnswer: 2,
            contentType: "text"
          },
          {
            id: 2,
            questionText: "Alin sa mga sumusunod ang HINDI binili ng nagsasalita?",
            options: ["Mangga", "Ubas", "Saging", "Mansanas"],
            correctAnswer: 1,
            contentType: "text"
          },
          {
            id: 3,
            questionText: "Piliin ang larawan ng mansanas.",
            options: ["Image 1", "Image 2", "Image 3", "Image 4"],
            correctAnswer: 2,
            contentType: "image"
          }
        ]
      }
    ]
  },
  {
    id: 13,
    title: "Pagbibigkas ng mga Tunog",
    level: "Antas Una",
    categories: ["Ponetiko", "Pagtukoy ng Tunog"],
    type: "assessment",
    status: "rejected",
    createdAt: "2025-04-01T09:15:00Z",
    creator: "Teacher Ana",
    contentType: "Interactive",
    description: "Pangkabataang pagtatasa ng kakayahang bigkasin at kilalanin ang mga tunog sa Filipino.",
    adminRemarks: "Kailangan ng mas maraming mga halimbawa. Ipakita ang ilalim na konteksto kung paano gamitin ang mga salitang magkasingkahulugan.",
    submittedAt: "2025-04-01T10:30:00Z",
    hasReadingPassage: false,
    levels: [
      {
        id: 1,
        levelName: "Level 1",
        passage: {
          text: ""
        },
        questions: [
          {
            id: 1,
            questionText: "Bigkasin ang salitang 'aso'.",
            options: ["Correct", "Incorrect"],
            correctAnswer: 0,
            contentType: "audio"
          },
          {
            id: 2,
            questionText: "Anong letra ang may tunog na 'p'?",
            options: ["B", "P", "T", "D"],
            correctAnswer: 1,
            contentType: "text"
          },
          {
            id: 3,
            questionText: "Piliin ang larawan ng hayop na nagsisimula sa letrang 'P'.",
            options: ["Aso", "Pusa", "Ibon", "Daga"],
            correctAnswer: 1,
            contentType: "image"
          }
        ]
      }
    ]
  },
  {
    id: 14,
    title: "Mga Hayop sa Bukid at Bahay",
    level: "Antas Dalawa",
    categories: ["Talasalitaan", "Pagpili ng Tamang Salita"],
    type: "practice",
    status: "locked",
    createdAt: "2025-03-10T11:20:00Z",
    lastModified: "2025-03-15T14:30:00Z",
    creator: "Teacher Liza",
    contentType: "Image",
    description: "Pag-aaral ng mga hayop sa bukid at bahay, at ang kanilang mga katangian at tunog.",
    hasReadingPassage: false,
    levels: [
      {
        id: 1,
        levelName: "Level 1 - Mga Hayop sa Bahay",
        passage: {
          text: ""
        },
        questions: [
          {
            id: 1,
            questionText: "Ano ang hayop na ito?",
            options: ["Aso", "Pusa", "Ibon", "Daga"],
            correctAnswer: 0,
            contentType: "image"
          },
          {
            id: 2,
            questionText: "Anong tunog ang ginagawa ng aso?",
            options: ["Meow", "Tahol", "Tweet", "Ungol"],
            correctAnswer: 1,
            contentType: "audio"
          }
        ]
      },
      {
        id: 2,
        levelName: "Level 2 - Mga Hayop sa Bukid",
        passage: {
          text: ""
        },
        questions: [
          {
            id: 1,
            questionText: "Ano ang hayop na ito?",
            options: ["Baka", "Kabayo", "Kalabaw", "Kambing"],
            correctAnswer: 2,
            contentType: "image"
          },
          {
            id: 2,
            questionText: "Anong hayop ang gumagawa ng tunog na ito?",
            options: ["Baka", "Kabayo", "Kalabaw", "Kambing"],
            correctAnswer: 0,
            contentType: "audio"
          }
        ]
      },
  
  
      {
        id: 1,
        levelName: "Level 1",
        passage: {
          text: "Si Mang Jose ay nagtanim ng gulay sa kanyang hardin.",
          translation: "Mr. Jose planted vegetables in his garden.",
          syllables: "Si Mang Jo-se ay nag-ta-nim ng gu-lay sa kan-yang har-din."
        },
        questions: [
          {
            id: 1,
            questionText: "Ano ang itinanim ni Mang Jose?",
            options: ["Bulaklak", "Gulay", "Puno", "Palay"],
            correctAnswer: 1,
            contentType: "text"
          },
          {
            id: 2,
            questionText: "Saan nagtanim si Mang Jose?",
            options: ["Sa bukid", "Sa hardin", "Sa lupa", "Sa paso"],
            correctAnswer: 1,
            contentType: "text"
          }
        ]
      },
      {
        id: 2,
        levelName: "Level 2",
        passage: {
          text: "Maraming uri ng gulay ang kanyang itinanim tulad ng talong, kamatis, at kalabasa.",
          translation: "He planted many types of vegetables like eggplant, tomato, and squash.",
          syllables: "Ma-ra-ming u-ri ng gu-lay ang kan-yang i-ti-na-nim tu-lad ng ta-long, ka-ma-tis, at ka-la-ba-sa."
        },
        questions: [
          {
            id: 1,
            questionText: "Anong uri ng gulay ang itinanim ni Mang Jose?",
            options: ["Talong, kamatis, at kalabasa", "Sibuyas, bawang, at luya", "Patatas, repolyo, at karot", "Pipino, ampalaya, at sitaw"],
            correctAnswer: 0,
            contentType: "text"
          },
          {
            id: 2,
            questionText: "Piliin ang larawan ng talong.",
            options: ["Option 1", "Option 2", "Option 3", "Option 4"],
            correctAnswer: 1,
            contentType: "image"
          }
        ]
      }
    ]
  },
  {
    id: 2,
    title: "Ponetikong Pagsasanay: Patinig at Katinig",
    level: "Antas Una",
    categories: ["Ponetiko", "Pagtukoy ng Tunog"],
    type: "template",
    status: "locked",
    createdAt: "2025-03-15T10:15:00Z",
    creator: "Teacher Maria",
    contentType: "Voice",
    description: "Panimulang pagsasanay sa pagkilala ng mga patinig at katinig sa Filipino.",
    hasReadingPassage: false,
    levels: [
      {
        id: 1,
        levelName: "Level 1",
        passage: {
          text: ""
        },
        questions: [
          {
            id: 1,
            questionText: "Bigkasin ang salitang 'bata'",
            options: ["B", "A", "T", "K"],
            correctAnswer: 0,
            contentType: "audio"
          },
          {
            id: 2,
            questionText: "Anong tunog ang naririnig mo?",
            options: ["A", "E", "I", "O"],
            correctAnswer: 0,
            contentType: "audio"
          }
        ]
      }
    ]
  },
  {
    id: 3,
    title: "Pagkilala sa mga Salita: Hayop at Halaman",
    level: "Antas Dalawa",
    categories: ["Pagbasa ng Salita", "Pagpili ng Tamang Salita"],
    type: "template",
    status: "locked",
    createdAt: "2025-03-05T14:20:00Z",
    lastModified: "2025-03-07T09:45:00Z",
    creator: "Teacher Jaja",
    contentType: "Image",
    description: "Pagsasanay sa pagbasa ng mga pangalan ng hayop at halaman na may kasama pang larawan.",
    hasReadingPassage: false,
    levels: [
      {
        id: 1,
        levelName: "Level 1",
        passage: {
          text: ""
        },
        questions: [
          {
            id: 1,
            questionText: "Ano ang nasa larawan?",
            options: ["Pusa", "Aso", "Ibon", "Daga"],
            correctAnswer: 1,
            contentType: "image"
          }
        ]
      },
      {
        id: 2,
        levelName: "Level 2",
        passage: {
          text: ""
        },
        questions: [
          {
            id: 1,
            questionText: "Ano ang nasa larawan?",
            options: ["Pusa", "Aso", "Ibon", "Daga"],
            correctAnswer: 0,
            contentType: "image"
          }
        ]
      }
    ]
  },
  {
    id: 4,
    title: "Estruktura ng Pantig: Pagbubukod-bukod",
    level: "Antas Tatlo",
    categories: ["Pantig", "Pagsusuri ng Pantig"],
    type: "template",
    status: "locked",
    createdAt: "2025-02-20T11:30:00Z",
    lastModified: "2025-02-25T16:15:00Z",
    creator: "Teacher Carlo",
    contentType: "Text",
    description: "Mga pagsasanay sa pagsusuri at pagbubukod-bukod ng mga pantig sa Filipino.",
    hasReadingPassage: true,
    levels: [
      {
        id: 1,
        levelName: "Level 1",
        passage: {
          text: "Hatiin ang salitang 'kamatis' sa pantig",
          syllables: "ka-ma-tis"
        },
        questions: [
          {
            id: 1,
            questionText: "Ilan ang pantig sa salitang 'kamatis'?",
            options: ["Dalawa", "Tatlo", "Apat", "Lima"],
            correctAnswer: 1,
            contentType: "text"
          }
        ]
      }
    ]
  },
  {
    id: 5,
    title: "Pagkilala sa mga Kilos-Salita",
    level: "Antas Apat",
    categories: ["Pangungusap", "Pagpili ng Tamang Salita"],
    type: "template",
    status: "pending",
    createdAt: "2025-03-25T13:10:00Z",
    creator: "Teacher Jaja",
    contentType: "Reading",
    description: "Pagsasanay sa pagkilala at paggamit ng mga pandiwa sa Filipino.",
    submittedAt: "2025-03-25T13:45:00Z",
    hasReadingPassage: true,
    levels: [
      {
        id: 1,
        levelName: "Level 1",
        passage: {
          text: "Si Maria ay naglalaro sa parke.",
          syllables: "Si Ma-ri-a ay nag-la-la-ro sa par-ke."
        },
        questions: [
          {
            id: 1,
            questionText: "Ano ang ginagawa ni Maria?",
            options: ["Naglalaro", "Nagluluto", "Nagaaral", "Naglalakad"],
            correctAnswer: 0,
            contentType: "text"
          }
        ]
      }
    ]
  },
  {
    id: 6,
    title: "Mga Salitang Magkasingkahulugan",
    level: "Antas Lima",
    categories: ["Talasalitaan"],
    type: "template",
    status: "rejected",
    createdAt: "2025-03-18T09:30:00Z",
    creator: "Teacher Maria",
    contentType: "Reading",
    description: "Pagkilala sa mga salitang magkasingkahulugan sa Filipino.",
    adminRemarks: "Kailangan ng mas maraming mga halimbawa. Ipakita ang ilalim na konteksto kung paano gamitin ang mga salitang magkasingkahulugan.",
    hasReadingPassage: true,
    levels: [
      {
        id: 1,
        levelName: "Level 1",
        passage: {
          text: "Ang salitang 'masaya' ay magkasingkahulugan ng 'maligaya'.",
          syllables: "Ang sa-li-tang 'ma-sa-ya' ay mag-ka-sing-ka-hu-lu-gan ng 'ma-li-ga-ya'."
        },
        questions: [
          {
            id: 1,
            questionText: "Alin sa mga sumusunod na salita ang magkasingkahulugan ng 'masaya'?",
            options: ["Malungkot", "Maligaya", "Matapang", "Matalino"],
            correctAnswer: 1,
            contentType: "text"
          }
        ]
      }
    ]
  },
  {
    id: 7,
    title: "Pre-Assessment: Pagkilala sa Tunog",
    level: "Antas Una",
    categories: ["Pagtukoy ng Tunog", "Ponetiko"],
    type: "assessment",
    status: "locked",
    createdAt: "2025-02-15T08:20:00Z",
    lastModified: "2025-02-16T10:00:00Z",
    creator: "Teacher Jaja",
    contentType: "Voice",
    description: "Panimulang pagtatasa sa kakayahang makilala ang mga tunog sa Filipino.",
    hasReadingPassage: false,
    levels: [
      {
        id: 1,
        levelName: "Level 1",
        passage: {
          text: ""
        },
        questions: [
          {
            id: 1,
            questionText: "Ano ang huling tunog ng salitang 'bahay'?",
            options: ["Y", "A", "B", "H"],
            correctAnswer: 0,
            contentType: "audio"
          }
        ]
      }
    ]
  },
  {
    id: 8,
    title: "Pre-Assessment: Pantig at Pagbasa",
    level: "Antas Dalawa",
    categories: ["Pantig", "Pagbasa ng Salita"],
    type: "assessment",
    status: "locked",
    createdAt: "2025-02-16T13:15:00Z",
    creator: "Teacher Carlo",
    contentType: "Text",
    description: "Komprehensibong pagtatasa ng kakayahan sa pagbasa ng pantig at salita.",
    hasReadingPassage: true,
    levels: [
      {
        id: 1,
        levelName: "Level 1",
        passage: {
          text: "Hatiin ang salitang 'kalabasa' sa pantig",
          syllables: "ka-la-ba-sa"
        },
        questions: [
          {
            id: 1,
            questionText: "Ilan ang pantig sa salitang 'kalabasa'?",
            options: ["Tatlo", "Apat", "Lima", "Anim"],
            correctAnswer: 1,
            contentType: "text"
          }
        ]
      }
    ]
  },

  {
    id: 8,
    title: "Pre-Assessment: Pantig at Pagbasa",
    level: "Antas Dalawa",
    categories: ["Pantig", "Pagbasa ng Salita"],
    type: "assessment",
    status: "locked",
    createdAt: "2025-02-16T13:15:00Z",
    creator: "Teacher Carlo",
    contentType: "Text",
    description: "Komprehensibong pagtatasa ng kakayahan sa pagbasa ng pantig at salita.",
    hasReadingPassage: true,
    levels: [
      {
        id: 1,
        levelName: "Level 1",
        passage: {
          text: "Hatiin ang salitang 'kalabasa' sa pantig",
          syllables: "ka-la-ba-sa"
        },
        questions: [
          {
            id: 1,
            questionText: "Ilan ang pantig sa salitang 'kalabasa'?",
            options: ["Tatlo", "Apat", "Lima", "Anim"],
            correctAnswer: 1,
            contentType: "text"
          }
        ]
      }
      ]
    }
  ]
  
  export default activities;