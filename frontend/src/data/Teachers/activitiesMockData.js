// src/data/Teachers/activitiesMockData.js

const activities = [
  {
    id: 1,
    title: "Bokabularyo: Buwan at Araw",
    level: "Antas Dalawa",
    categories: ["Talasalitaan", "Pagbasa ng Salita"],
    type: "template",
    status: "approved",
    createdAt: "2025-03-24T11:20:00Z",
    lastModified: "2025-03-24T15:30:00Z",
    creator: "Teacher Jaja",
    contentType: "Reading",
    description: "Pagpapayaman ng bokabularyo tungkol sa mga pangalan ng buwan at araw."
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
    description: "Panimulang pagsasanay sa pagkilala ng mga patinig at katinig sa Filipino."
  },
  {
    id: 3,
    title: "Pagkilala sa mga Salita: Hayop at Halaman",
    level: "Antas Dalawa",
    categories: ["Pagbasa ng Salita", "Pagpili ng Tamang Salita"],
    type: "template",
    status: "approved",
    createdAt: "2025-03-05T14:20:00Z",
    lastModified: "2025-03-07T09:45:00Z",
    creator: "Teacher Jaja",
    contentType: "Image",
    description: "Pagsasanay sa pagbasa ng mga pangalan ng hayop at halaman na may kasama pang larawan."
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
    description: "Mga pagsasanay sa pagsusuri at pagbubukod-bukod ng mga pantig sa Filipino."
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
    submittedAt: "2025-03-25T13:45:00Z"
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
    adminRemarks: "Kailangan ng mas maraming mga halimbawa. Ipakita ang ilalim na konteksto kung paano gamitin ang mga salitang magkasingkahulugan."
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
    description: "Panimulang pagtatasa sa kakayahang makilala ang mga tunog sa Filipino."
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
    description: "Komprehensibong pagtatasa ng kakayahan sa pagbasa ng pantig at salita."
  },
  {
    id: 9,
    title: "Pagsasanay: Pag-uugnay ng Tunog at Letra",
    level: "Antas Una",
    categories: ["Pag-uugnay ng Tunog at Letra"],
    type: "practice",
    status: "approved",
    createdAt: "2025-03-20T14:30:00Z",
    creator: "Teacher Maria",
    contentType: "Voice",
    description: "Pagsasanay na tumutulong sa mga mag-aaral na iugnay ang mga tunog sa kanilang katumbas na letra."
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
    description: "Pagsasanay sa pagbasa at pag-unawa ng mga simpleng pangungusap."
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
    submittedAt: "2025-03-26T11:15:00Z"
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
    submittedAt: "2025-03-27T15:00:00Z"
  }
];

export default activities;