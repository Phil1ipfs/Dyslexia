# test.templates.questions.json 

[{
  "_id": {
    "$oid": "68b8a8b8a7ce2bf3d8101027"
  },
  "category": "Alphabet Knowledge",
  "questionType": "patinig",
  "templatetext": "Anong katumbas ng maliit na letra?",
  "applicableChoiceTypes": [
    "patinigBigLetter",
    "patinigSmallLetter"
  ],
  "createdBy": {
    "$oid": "68b8a92ca7ce2bf3d8101028"
  },
  "createdAt": {
    "$date": "1999-12-31T16:00:00.000Z"
  },
  "updatedAt": {
    "$date": "1999-12-31T16:00:00.000Z"
  },
  "isActive": true
},
{
  "_id": {
    "$oid": "68b8a9bba7ce2bf3d810102b"
  },
  "category": "Alphabet Knowledge",
  "questionType": "katinig",
  "templatetext": "Anong katumbas ng maliit na letra?",
  "applicableChoiceTypes": [
    "katinigSmallLetter",
    "katinigBigLetter"
  ],
  "createdBy": {
    "$oid": "68b8a92ca7ce2bf3d8101028"
  },
  "createdAt": {
    "$date": "1999-12-31T16:00:00.000Z"
  },
  "updatedAt": {
    "$date": "1999-12-31T16:00:00.000Z"
  },
  "isActive": true
},
{
  "_id": {
    "$oid": "68b8a9bba7ce2bf3dd81002b"
  },
  "category": "Phonological Awareness",
  "questionType": "malapantig",
  "templatetext": "Pinagsama ang mga pantig, ano ang mabubuo?",
  "applicableChoiceTypes": [
    "malapantigtext"
  ],
  "matchCount": 3,
  "createdBy": {
    "$oid": "68b8a92ca7ce2bf3d8101028"
  },
  "createdAt": {
    "$date": "1999-12-31T16:00:00.000Z"
  },
  "updatedAt": {
    "$date": "1999-12-31T16:00:00.000Z"
  },
  "isActive": true
},
{
  "_id": {
    "$oid": "68b8aeb8a7ce2bf3d8101027"
  },
  "category": "Word Recognition",
  "questionType": "word",
  "templatetext": "Anong kasing tunog ng nasa letrang word",
  "applicableChoiceTypes": [
    "syllableOption"
  ],
  "createdBy": {
    "$oid": "68b8a92ca7ce2bf3d8101028"
  },
  "createdAt": {
    "$date": "1999-12-31T16:00:00.000Z"
  },
  "updatedAt": {
    "$date": "1999-12-31T16:00:00.000Z"
  },
  "isActive": true
},
{
  "_id": {
    "$oid": "68b8aeb8a7cf2bf3d8101027"
  },
  "category": "Word Recognition",
  "questionType": "word",
  "templatetext": "Basahin ang pangungusap",
  "applicableChoiceTypes": [
    "wordOption"
  ],
  "createdBy": {
    "$oid": "68b8a92ca7ce2bf3d8101028"
  },
  "createdAt": {
    "$date": "1999-12-31T16:00:00.000Z"
  },
  "updatedAt": {
    "$date": "1999-12-31T16:00:00.000Z"
  },
  "isActive": true
},
{
  "_id": {
    "$oid": "68b8aeb8a7cf9bf3d8101027"
  },
  "category": "Decoding",
  "questionType": "decode",
  "templatetext": "Tukuyin ang nasa larawan",
  "applicableChoiceTypes": [
    "letter"
  ],
  "createdBy": {
    "$oid": "68b8a92ca7ce2bf3d8101028"
  },
  "createdAt": {
    "$date": "1999-12-31T16:00:00.000Z"
  },
  "updatedAt": {
    "$date": "1999-12-31T16:00:00.000Z"
  },
  "isActive": true
},
{
  "_id": {
    "$oid": "68b1aeb8a7cf9bf3d8101027"
  },
  "category": "Decoding",
  "questionType": "decode",
  "templatetext": "Buoin ang salita",
  "applicableChoiceTypes": [
    "completeWord"
  ],
  "createdBy": {
    "$oid": "68b8a92ca7ce2bf3d8101028"
  },
  "createdAt": {
    "$date": "1999-12-31T16:00:00.000Z"
  },
  "updatedAt": {
    "$date": "1999-12-31T16:00:00.000Z"
  },
  "isActive": true
}]

# test.templates_choices.json

[{
  "_id": {
    "$oid": "68b8ad4fa7ce2bf3d810103a"
  },
  "category": "Alphabet Knowledge",
  "choiceType": "patinigSmallLetter",
  "choiceValue": "a",
  "choiceImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/",
  "isActive": true,
  "createdAt": {
    "$date": {
      "$numberLong": "-55887264232000"
    }
  }
},
{
  "_id": {
    "$oid": "68b8ad4fa9ce2bf3d810103a"
  },
  "category": "Alphabet Knowledge",
  "choiceType": "katinigBigLetter",
  "choiceValue": "B",
  "choiceImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/",
  "isActive": true,
  "createdAt": {
    "$date": {
      "$numberLong": "-55887264232000"
    }
  }
},
{
  "_id": {
    "$oid": "68b8ad8fa9ce2bf3d810103a"
  },
  "category": "Phonological Awareness",
  "choiceType": "malapantigText",
  "choiceValue": "H",
  "correctMatch": "Hh",
  "choiceImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/",
  "isActive": true,
  "createdAt": {
    "$date": {
      "$numberLong": "-55887264232000"
    }
  }
},
{
  "_id": {
    "$oid": "68b8ad8fa1ce2bf3d810103a"
  },
  "category": "Phonological Awareness",
  "choiceType": "malapantigText",
  "choiceValue": "L",
  "correctMatch": "Ll",
  "choiceImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/",
  "isActive": true,
  "createdAt": {
    "$date": {
      "$numberLong": "-55887264232000"
    }
  }
},
{
  "_id": {
    "$oid": "68b8ad8fa9ce3bf3d810103a"
  },
  "category": "Word Recognition",
  "choiceType": "wordOption",
  "choiceValue": "Bola",
  "choiceImage": "https://literexia-bucket.s3.ap-southeast-2",
  "isActive": true,
  "createdAt": {
    "$date": {
      "$numberLong": "-55887264232000"
    }
  }
},
{
  "_id": {
    "$oid": "68b8ad8fa2ce3bf3d810103a"
  },
  "category": "Word Recognition",
  "choiceType": "wordOption",
  "choiceValue": "Sumbrero",
  "choiceImage": "https://literexia-bucket.s3.ap-southeast-2",
  "correctRhyme": [
    "LIB",
    "RO"
  ],
  "isActive": true,
  "createdAt": {
    "$date": {
      "$numberLong": "-55887264232000"
    }
  }
},
{
  "_id": {
    "$oid": "61b8ad8fa2ce3bf3d810103a"
  },
  "category": "Decoding",
  "choiceType": "completeWord",
  "choiceValue": "N",
  "choiceImage": null,
  "isActive": true,
  "createdAt": {
    "$date": {
      "$numberLong": "-55887264232000"
    }
  }
},
{
  "_id": {
    "$oid": "64b8ad8fa2ce3bf3d810103a"
  },
  "category": "Decoding",
  "choiceType": "letter",
  "choiceValue": "NGIPIN",
  "choiceImage": "https://literexia-buckm/words/teeth.png",
  "correctSequence": [
    "N",
    "G",
    "I",
    "P",
    "I",
    "N"
  ],
  "isActive": true,
  "createdAt": {
    "$date": {
      "$numberLong": "-55887264232000"
    }
  }
}]


# test.sentence_templates.json 

[{
  "_id": {
    "$oid": "68297c4379a34741f9cd1a00"
  },
  "title": "Si Maria at ang mga Bulaklak",
  "category": "Reading Comprehension",
  "readingLevel": "Low Emerging",
  "sentenceText": [
    {
      "pageNumber": 1,
      "text": "Si Maria ay pumunta sa parke. Nakita niya ang maraming bulaklak na magaganda. Siya ay natuwa at nag-uwi ng ilang bulaklak para sa kanyang ina.aaaaaaaa",
      "image": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/passages/park_flowers.png",
      "_id": {
        "$oid": "683801ef6e580fb9a4ea88de"
      }
    }
  ],
  "sentenceQuestions": [
    {
      "questionNumber": 1,
      "questionText": "Sino ang pangunahing tauhan sa kwento?adefre",
      "sentenceCorrectAnswer": "Si Maria",
      "sentenceOptionAnswers": [
        "Si Maria",
        "Si Juan"
      ]
    },
    {
      "questionNumber": 2,
      "questionText": "Saan pumunta si Maria?",
      "sentenceCorrectAnswer": "Sa parke",
      "sentenceOptionAnswers": [
        "Sa parke",
        "Sa paaralanaaaa"
      ]
    },
    {
      "questionNumber": 3,
      "questionText": "Ano ang nakita ni Maria sa parke?",
      "sentenceCorrectAnswer": "Maraming bulaklak",
      "sentenceOptionAnswers": [
        "Maraming bulaklak",
        "Maraming bata"
      ]
    }
  ],
  "createdBy": {
    "$oid": "6813b9a2c696b8ec80f34cb1"
  },
  "createdAt": {
    "$date": "2025-05-01T10:30:00.000Z"
  },
  "updatedAt": {
    "$date": "2025-05-29T06:42:55.527Z"
  },
  "isActive": true
},
{
  "_id": {
    "$oid": "68297c4379a34741f9cd1a01"
  },
  "title": "Ang Batang Matulungin",
  "category": "Reading Comprehension",
  "readingLevel": "Transitioning",
  "sentenceText": [
    {
      "pageNumber": 1,
      "text": "Si Pedro ay isang batang matulungin. Tuwing umaga, tinutulungan niya ang kanyang ina na maglinis ng bahay. Siya ay nagwawalis ng sahig at nagliligpit ng mga laruan.",
      "image": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/passages/boy_cleaning.png"
    },
    {
      "pageNumber": 2,
      "text": "Pagkatapos maglinis, tinutulungan din niya ang kanyang ama sa hardin. Nagdidilig siya ng mga halaman at namimitas ng mga gulay. Ang kanyang mga magulang ay masaya dahil si Pedro ay isang mabuting anak.",
      "image": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/passages/boy_garden.png"
    }
  ],
  "sentenceQuestions": [
    {
      "questionNumber": 1,
      "questionText": "Sino ang batang matulungin?",
      "sentenceCorrectAnswer": "Si Pedro",
      "sentenceAcceptableAnswer": [
        "Si Pedro",
        "Si Maria",
        "Si Juan",
        "Si Ana"
      ]
    },
    {
      "questionNumber": 2,
      "questionText": "Paano tinutulungan ni Pedro ang kanyang ina?",
      "sentenceCorrectAnswer": "Nagwawalis ng sahig at nagliligpit ng mga laruan",
      "sentenceAcceptableAnswer": [
        "Nagwawalis ng sahig at nagliligpit ng mga laruan",
        "Nagluluto ng pagkain",
        "Naglalaba ng damit",
        "Naghuhugas ng pinggan"
      ]
    },
    {
      "questionNumber": 3,
      "questionText": "Bakit masaya ang mga magulang ni Pedro?",
      "sentenceCorrectAnswer": "Dahil si Pedro ay isang mabuting anak",
      "sentenceAcceptableAnswer": [
        "Dahil si Pedro ay isang mabuting anak",
        "Dahil matalino si Pedro",
        "Dahil magaling kumanta si Pedro",
        "Dahil mahilig maglaro si Pedro"
      ]
    }
  ],
  "createdBy": {
    "$oid": "6813b9a2c696b8ec80f34cb1"
  },
  "createdAt": {
    "$date": "2025-05-01T11:00:00.000Z"
  },
  "updatedAt": {
    "$date": "2025-05-01T11:00:00.000Z"
  },
  "isActive": true
},
{
  "_id": {
    "$oid": "68297c4379a34741f9cd1a02"
  },
  "title": "Si Lino at ang Kanyang Alagang Isda",
  "category": "Reading Comprehension",
  "readingLevel": "Developing",
  "sentenceText": [
    {
      "pageNumber": 1,
      "text": "Si Lino ay may maliit na akwaryum sa kanyang kuwarto. Sa loob nito ay may isang magandang isda na kulay bughaw. Binigay ito ng kanyang lolo noong kanyang kaarawan.",
      "image": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/passages/boy_aquarium.png"
    },
    {
      "pageNumber": 2,
      "text": "Araw-araw, binibigyan ni Lino ng pagkain ang kanyang isda. Nililinis din niya ang akwaryum tuwing Sabado. Masaya si Lino kapag pinapanood niya ang kanyang isda na lumalangoy sa malinis na tubig.",
      "image": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/passages/boy_feeding_fish.png"
    }
  ],
  "sentenceQuestions": [
    {
      "questionNumber": 1,
      "questionText": "Ano ang alaga ni Lino?",
      "sentenceCorrectAnswer": "Isda",
      "sentenceOptionAnswers": [
        "Isda",
        "Pusa",
        "Aso",
        "Ibon"
      ]
    },
    {
      "questionNumber": 2,
      "questionText": "Sino ang nagbigay ng isda kay Lino?",
      "sentenceCorrectAnswer": "Ang kanyang lolo",
      "sentenceOptionAnswers": [
        "Ang kanyang lolo",
        "Ang kanyang ina",
        "Ang kanyang ama",
        "Ang kanyang kapatid"
      ]
    },
    {
      "questionNumber": 3,
      "questionText": "Kailan nililinis ni Lino ang akwaryum?",
      "sentenceCorrectAnswer": "Tuwing Sabado",
      "sentenceOptionAnswers": [
        "Tuwing Sabado",
        "Tuwing Linggo",
        "Tuwing Lunes",
        "Araw-araw"
      ]
    }
  ],
  "createdBy": {
    "$oid": "6813b9a2c696b8ec80f34cb1"
  },
  "createdAt": {
    "$date": "2025-05-01T11:30:00.000Z"
  },
  "updatedAt": {
    "$date": "2025-05-01T11:30:00.000Z"
  },
  "isActive": true
}]