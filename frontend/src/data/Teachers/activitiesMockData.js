const activities = [
  {
    id: 1,
    title: "Bokabularyo: Buwan at Araw",
    level: "Antas Dalawa",
    categories: ["Talasalitaan", "Pagbasa ng Salita"],
    type: "template",
    status: "locked",
    createdAt: "2025-03-24T11:20:00Z",
    lastModified: "2025-03-24T15:30:00Z",
    creator: "Teacher Jaja",
    contentType: "Reading",
    description: "Pagpapayaman ng bokabularyo tungkol sa mga pangalan ng buwan at araw.",
    levels: [
      {
        id: 1,
        levelName: "Level 1",
        content: [
          {
            id: 1,
            type: "reading",
            text: "Si Mang Jose ay nagtanim ng gulay sa kanyang hardin.",
            translation: "Mr. Jose planted vegetables in his garden.",
            syllables: "Si Mang Jo-se ay nag-ta-nim ng gu-lay sa kan-yang har-din."
          }
        ],
        questions: [
          {
            id: 1,
            questionText: "Ano ang itinanim ni Mang Jose?",
            options: ["Bulaklak", "Gulay", "Puno", "Palay"],
            correctAnswer: 1,
            contentType: "reading"
          },
          {
            id: 2,
            questionText: "Saan nagtanim si Mang Jose?",
            options: ["Sa bukid", "Sa hardin", "Sa lupa", "Sa paso"],
            correctAnswer: 1,
            contentType: "reading"
          }
        ]
      },
      {
        id: 2,
        levelName: "Level 2",
        content: [
          {
            id: 1,
            type: "image",
            imageUrl: "/assets/images/garden.jpg",
            caption: "Ang hardin ni Mang Jose"
          }
        ],
        questions: [
          {
            id: 1,
            questionText: "Anong araw ngayon?",
            options: ["Lunes", "Martes", "Miyerkules", "Huwebes"],
            correctAnswer: 0,
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
    levels: [
      {
        id: 1,
        levelName: "Level 1",
        content: [
          {
            id: 1,
            type: "voice",
            text: "Bigkasin ang salitang 'bata'",
            audioUrl: "/assets/audio/bata.mp3"
          }
        ],
        questions: [
          {
            id: 1,
            questionText: "Ano ang unang tunog ng salitang 'bata'?",
            options: ["B", "A", "T", "K"],
            correctAnswer: 0,
            contentType: "voice"
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
    levels: [
      {
        id: 1,
        levelName: "Level 1",
        content: [
          {
            id: 1,
            type: "image",
            imageUrl: "/assets/images/dog.jpg",
            caption: "Aso"
          }
        ],
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
        content: [
          {
            id: 1,
            type: "image",
            imageUrl: "/assets/images/cat.jpg",
            caption: "Pusa"
          }
        ],
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
    levels: [
      {
        id: 1,
        levelName: "Level 1",
        content: [
          {
            id: 1,
            type: "reading",
            text: "Hatiin ang salitang 'kamatis' sa pantig",
            syllables: "ka-ma-tis"
          }
        ],
        questions: [
          {
            id: 1,
            questionText: "Ilan ang pantig sa salitang 'kamatis'?",
            options: ["Dalawa", "Tatlo", "Apat", "Lima"],
            correctAnswer: 1,
            contentType: "reading"
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
    levels: [
      {
        id: 1,
        levelName: "Level 1",
        content: [
          {
            id: 1,
            type: "reading",
            text: "Si Maria ay naglalaro sa parke.",
            syllables: "Si Ma-ri-a ay nag-la-la-ro sa par-ke."
          }
        ],
        questions: [
          {
            id: 1,
            questionText: "Ano ang ginagawa ni Maria?",
            options: ["Naglalaro", "Nagluluto", "Nagaaral", "Naglalakad"],
            correctAnswer: 0,
            contentType: "reading"
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
    levels: [
      {
        id: 1,
        levelName: "Level 1",
        content: [
          {
            id: 1,
            type: "reading",
            text: "Ang salitang 'masaya' ay magkasingkahulugan ng 'maligaya'.",
            syllables: "Ang sa-li-tang 'ma-sa-ya' ay mag-ka-sing-ka-hu-lu-gan ng 'ma-li-ga-ya'."
          }
        ],
        questions: [
          {
            id: 1,
            questionText: "Alin sa mga sumusunod na salita ang magkasingkahulugan ng 'masaya'?",
            options: ["Malungkot", "Maligaya", "Matapang", "Matalino"],
            correctAnswer: 1,
            contentType: "reading"
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
    levels: [
      {
        id: 1,
        levelName: "Level 1",
        content: [
          {
            id: 1,
            type: "voice",
            text: "Bigkasin ang salitang 'bahay'",
            audioUrl: "/assets/audio/bahay.mp3"
          }
        ],
        questions: [
          {
            id: 1,
            questionText: "Ano ang huling tunog ng salitang 'bahay'?",
            options: ["Y", "A", "B", "H"],
            correctAnswer: 0,
            contentType: "voice"
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
    levels: [
      {
        id: 1,
        levelName: "Level 1",
        content: [
          {
            id: 1,
            type: "reading",
            text: "Hatiin ang salitang 'kalabasa' sa pantig",
            syllables: "ka-la-ba-sa"
          }
        ],
        questions: [
          {
            id: 1,
            questionText: "Ilan ang pantig sa salitang 'kalabasa'?",
            options: ["Tatlo", "Apat", "Lima", "Anim"],
            correctAnswer: 1,
            contentType: "reading"
          }
        ]
      }
    ]
  },
  {
    id: 9,
    title: "Pagsasanay: Pag-uugnay ng Tunog at Letra",
    level: "Antas Una",
    categories: ["Pag-uugnay ng Tunog at Letra"],
    type: "practice",
    status: "locked",
    createdAt: "2025-03-20T14:30:00Z",
    creator: "Teacher Maria",
    contentType: "Voice",
    description: "Pagsasanay na tumutulong sa mga mag-aaral na iugnay ang mga tunog sa kanilang katumbas na letra.",
    levels: [
      {
        id: 1,
        levelName: "Level 1",
        content: [
          {
            id: 1,
            type: "voice",
            text: "Bigkasin ang titik 'A'",
            audioUrl: "/assets/audio/a.mp3"
          }
        ],
        questions: [
          {
            id: 1,
            questionText: "Anong letra ang may tunog na 'ah'?",
            options: ["A", "E", "I", "O"],
            correctAnswer: 0,
            contentType: "voice"
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
    levels: [
      {
        id: 1,
        levelName: "Level 1",
        content: [
          {
            id: 1,
            type: "reading",
            text: "Kumain ako ng mangga kahapon.",
            syllables: "Ku-ma-in a-ko ng mang-ga ka-ha-pon."
          }
        ],
        questions: [
          {
            id: 1,
            questionText: "Ano ang kinain ng nagsasalita?",
            options: ["Mansanas", "Mangga", "Saging", "Ubas"],
            correctAnswer: 1,
            contentType: "reading"
          }
        ]
      },
      {
        id: 2,
        levelName: "Level 2",
        content: [
          {
            id: 1,
            type: "reading",
            text: "Maglalaro kami sa parke bukas.",
            syllables: "Mag-la-la-ro ka-mi sa par-ke bu-kas."
          }
        ],
        questions: [
          {
            id: 1,
            questionText: "Saan sila maglalaro?",
            options: ["Sa bahay", "Sa paaralan", "Sa parke", "Sa beach"],
            correctAnswer: 2,
            contentType: "reading"
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
    levels: [
      {
        id: 1,
        levelName: "Level 1",
        content: [
          {
            id: 1,
            type: "reading",
            text: "Ang pandiwa ay salitang kilos.",
            syllables: "Ang pan-di-wa ay sa-li-tang ki-los."
          }
        ],
        questions: [
          {
            id: 1,
            questionText: "Alin sa mga sumusunod ang pandiwa?",
            options: ["Maganda", "Kumain", "Bahay", "Malaki"],
            correctAnswer: 1,
            contentType: "reading"
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
    levels: [
      {
        id: 1,
        levelName: "Level 1",
        content: [
          {
            id: 1,
            type: "reading",
            text: "Pumunta ako sa palengke kahapon.",
            syllables: "Pu-mun-ta a-ko sa pa-leng-ke ka-ha-pon."
          }
        ],
        questions: [
          {
            id: 1,
            questionText: "Saan pumunta ang nagsasalita?",
            options: ["Sa bahay", "Sa palengke", "Sa paaralan", "Sa parke"],
            correctAnswer: 1,
            contentType: "reading"
          }
        ]
      }
    ]
  }
];

export default activities;