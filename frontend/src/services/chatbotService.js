// src/services/chatbotService.js

/**
 * Service for handling chatbot functionality with bilingual support (Filipino/English)
 * Currently using mock data, but designed to be easily replaced with OpenAI API integration
 */

// This API key is a placeholder and should be stored in environment variables in production
const OPENAI_API_KEY = 'your-api-key';

/**
 * Generate a response from the chatbot
 * @param {string} query - The user's message
 * @param {Array} conversationHistory - Previous messages for context
 * @param {string} language - The preferred language ('filipino' or 'english')
 * @returns {Promise<string>} - The chatbot's response
 */
export const generateResponse = async (query, conversationHistory = [], language = 'filipino') => {
  // If using mock data (development/testing)
  if (process.env.REACT_APP_USE_MOCK_CHATBOT === 'true') {
    return getMockResponse(query, language);
  }
  
  // For real OpenAI implementation
  try {
    // Format conversation history for OpenAI API
    const formattedHistory = conversationHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
    
    // Add system message to provide context about the assistant's role
    // Include language preference in the system message
    const systemMessage = language === 'filipino' 
      ? `Ikaw ay isang teaching assistant para sa Literexia platform, na espesyalista sa pagtulong sa mga guro na nagtuturo sa mga mag-aaral na may dyslexia.
         Magbigay ng praktikal na mga estratehiya sa pagtuturo, mga suhestiyon ng aktibidad, at mga paraan ng interbensyon.
         Maging palakaibigan, suportado, at malinaw sa iyong mga sagot. Gamitin ang malinaw na wika at istruktura ang iyong mga sagot na may bullet points o numbering kung naaangkop.
         Ang iyong expertise ay sa pagtuturo ng literasiya sa wikang Filipino, pag-unawa sa pagbasa, at pagsuporta sa mga mag-aaral na may dyslexia.
         Palaging sumagot sa Filipino.`
      : `You are a teaching assistant for the Literexia platform, specialized in helping teachers work with dyslexic students.
         Focus on providing practical teaching strategies, activity suggestions, and intervention approaches.
         Be friendly, supportive, and concise in your responses. Use clear language and structure your answers with bullet points or numbering when appropriate.
         Your expertise is in teaching Filipino language literacy, reading comprehension, and supporting students with dyslexia.
         Always respond in English.`;
    
    const messages = [
      {
        role: 'system',
        content: systemMessage
      },
      ...formattedHistory,
      { role: 'user', content: query }
    ];
    
    // Call to OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4-1106-preview', // Using GPT-4 Turbo for better multilingual support
        messages: messages,
        temperature: 0.7,
        max_tokens: 800
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating response:', error);
    return language === 'filipino'
      ? "Pasensya na, nagkaroon ng problema sa pagproseso ng iyong kahilingan. Pakisubukan muli mamaya."
      : "I'm sorry, I encountered an error processing your request. Please try again later.";
  }
};

/**
 * Mock response function for development/testing with bilingual support
 * @param {string} query - The user's message
 * @param {string} language - The preferred language ('filipino' or 'english')
 * @returns {Promise<string>} - A mock response based on the query
 */
// src/services/chatbotService.js - CONTINUED

const getMockResponse = (query, language) => {
  return new Promise((resolve) => {
    // Simulate API delay
    setTimeout(() => {
      const lowerQuery = query.toLowerCase();
      
      // Filipino responses - continued
      if (language === 'filipino') {
        // Parent communication (completing cut-off response)
        if (lowerQuery.includes('magulang') || lowerQuery.includes('tahanan') || lowerQuery.includes('pamilya')) {
          resolve("Para sa epektibong pakikipagtulungan sa mga magulang ng mga mag-aaral na may dyslexia:\n\n1. **Malinaw na Komunikasyon** - Ipaliwanag ang dyslexia sa simple at direktang mga termino nang walang educational jargon\n\n2. **Mga Aktibidad sa Bahay** - Magmungkahi ng simple, partikular na aktibidad na maaaring gawin ng mga magulang sa bahay\n\n3. **Pagtuon sa mga Kalakasan** - Ibahagi ang positibong mga obserbasyon tungkol sa mag-aaral, hindi lamang mga hamon\n\n4. **Regular na Updates** - Magbigay ng maikling, madalas na update sa progreso sa halip na sa conference lamang\n\n5. **Pagbabahagi ng Mapagkukunan** - Gabayan ang mga magulang sa kapaki-pakinabang na libro, website, o support groups\n\n6. **Gabay sa Takdang-Aralin** - Magbigay ng malinaw na tagubilin para sa mga magulang kung paano suportahan ang takdang-aralin\n\n7. **Makinig sa mga Magulang** - Pinakanakakaalam nila ang kanilang anak at makakapagbigay ng mahahalagang pananaw\n\nAlalahanin na ang mga magulang ay maaaring may sariling emosyon tungkol sa mga kahirapan sa pag-aaral ng kanilang anak.");
        }
        
        // Default response
        else {
          resolve("Salamat sa iyong tanong tungkol sa pagtuturo sa mga mag-aaral na may dyslexia. Bilang teaching assistant na nagtutuon sa dyslexia, maari akong magbigay ng impormasyon tungkol sa:\n\n- Mga multisensory na estratehiya sa pagtuturo\n- Mga aktibidad para sa kamalayan sa ponolohiya\n- Mga paraan para mapahusay ang kasanayan sa pagbasa\n- Mga technique para sa pag-unawa\n- Mga pamamaraan ng pagtatasa\n- Mga nakaka-engganyong aktibidad sa silid-aralan\n- Mga kapaki-pakinabang na tools at teknolohiya\n- Mga konsiderasyon sa wikang Filipino\n- Pamamahala sa silid-aralan\n- Motivasyon at kumpyansa ng mag-aaral\n- Komunikasyon sa magulang\n\nMaaari mo bang ibahagi ang higit pang detalye tungkol sa anong aspeto ng pagtuturo sa mga mag-aaral na may dyslexia ang kailangan mo ng tulong?");
        }
      }
      
      // English responses
      else {
        // Responses for teaching strategies
        if (lowerQuery.includes('multisensory') || lowerQuery.includes('teaching approach')) {
          resolve("Here are some multisensory teaching strategies for dyslexic students:\n\n1. **VAKT (Visual-Auditory-Kinesthetic-Tactile)** - Engage multiple senses by having students see letters/words, hear sounds, feel textures, and trace letters\n\n2. **Sound Boxes** - Use boxes drawn on paper where students push counters into each box as they segment sounds in words\n\n3. **Letter Formation with Different Materials** - Practice forming letters using sand trays, shaving cream, or playdough\n\n4. **Tapping Method** - Tap out syllables with fingers while saying words\n\n5. **Color Coding** - Use different colors for different parts of speech or syllable types\n\nImplement these activities in short, frequent sessions (15-20 minutes) for optimal learning.");
        }
        
        // Responses for phonological awareness
        else if (lowerQuery.includes('phoneme') || lowerQuery.includes('phonological') || lowerQuery.includes('sound')) {
          resolve("To develop phonological awareness in dyslexic students, try these activities:\n\n1. **Sound Isolation** - Practice identifying beginning, middle, and ending sounds (\"What sound do you hear at the beginning of 'bahay'?\")\n\n2. **Sound Blending** - Say individual sounds and have students blend them together (\"What word do these sounds make: /b/ /a/ /t/ /a/?\")\n\n3. **Sound Segmentation** - Have students tap out or count individual sounds in words\n\n4. **Sound Manipulation** - Practice removing or adding sounds (\"Say 'ginto' without the /g/ sound\")\n\n5. **Syllable Activities** - Clap out syllables in words, starting with 2-syllable words and progressing to longer ones\n\nConsistency is key - incorporate these activities daily for 10-15 minutes.");
        }
        
        // Responses for reading fluency
        else if (lowerQuery.includes('fluency') || lowerQuery.includes('reading speed')) {
          resolve("To improve reading fluency for dyslexic students, consider these approaches:\n\n1. **Repeated Reading** - Have students read the same passage multiple times, tracking improvement in speed and accuracy\n\n2. **Choral Reading** - Read together with students, providing a model of fluent reading\n\n3. **Echo Reading** - Read a sentence aloud and have the student repeat it\n\n4. **Partner Reading** - Pair students to take turns reading to each other\n\n5. **Recorded Reading** - Record students reading and let them listen to their own voice\n\n6. **Timed Reading** - Use 1-minute reading exercises to build speed gradually\n\nFocus first on accuracy, then on speed. Start with decodable texts that match students' phonics knowledge.");
        }
        
        // Responses for reading comprehension
        else if (lowerQuery.includes('comprehension') || lowerQuery.includes('understand')) {
          resolve("To enhance reading comprehension for dyslexic students in Filipino:\n\n1. **Pre-reading Activities** - Discuss vocabulary, activate prior knowledge, and preview text structure before reading\n\n2. **Graphic Organizers** - Use visual tools like story maps, Venn diagrams, or sequence charts to organize information\n\n3. **Question Generation** - Teach students to create their own questions about the text\n\n4. **Summarization** - Practice identifying main ideas and supporting details\n\n5. **Visualization** - Encourage students to create mental images of what they're reading\n\n6. **Read-Alouds** - Read to students while they follow along to separate decoding from comprehension\n\nRemember that many dyslexic students have strong comprehension when decoding barriers are removed.");
        }
        
        // Responses for assessments
        else if (lowerQuery.includes('assessment') || lowerQuery.includes('evaluate') || lowerQuery.includes('progress')) {
          resolve("For assessing dyslexic students' reading progress, consider these approaches:\n\n1. **Informal Reading Inventories** - Use passages at various levels to determine instructional reading level\n\n2. **Curriculum-Based Measurement** - Track one-minute reading samples weekly to monitor fluency progress\n\n3. **Error Analysis** - Note specific types of reading errors to guide instruction\n\n4. **Phonological Awareness Assessments** - Regularly check skills like blending, segmenting, and manipulation\n\n5. **Formative Assessment** - Use quick checks during instruction rather than only formal tests\n\n6. **Progress Monitoring** - Set specific goals and track progress with charts or graphs\n\nAlways assess comprehension separately from decoding to understand students' true abilities.");
        }
        
        // Responses for activities
        else if (lowerQuery.includes('game') || lowerQuery.includes('activity') || lowerQuery.includes('exercise')) {
          resolve("Here are engaging activities for dyslexic students learning Filipino:\n\n1. **Word Family Dominoes** - Create cards with words from the same family to match\n\n2. **Syllable Sort** - Sort picture or word cards by number of syllables\n\n3. **Word Building with Letter Tiles** - Use magnetic letters or letter cards to build words\n\n4. **Phoneme Manipulation Games** - \"I'm thinking of a word that starts with /b/ and rhymes with 'bato'\"\n\n5. **Sentence Scramble** - Arrange word cards to form complete sentences\n\n6. **Word Hunt** - Find words in the classroom that follow a specific pattern\n\n7. **Sight Word Bingo** - Play bingo with commonly used words\n\nKeep activities short (10-15 minutes), multi-sensory, and positive to maintain engagement.");
        }
        
        // Responses for technology/tools
        else if (lowerQuery.includes('tool') || lowerQuery.includes('technology') || lowerQuery.includes('app')) {
          resolve("Helpful tools and technology for teaching dyslexic students include:\n\n1. **Text-to-Speech Software** - Lets students hear text read aloud (like ReadSpeaker or Natural Reader)\n\n2. **Speech-to-Text Tools** - Allows students to dictate their writing\n\n3. **Dyslexia-Friendly Fonts** - Use fonts like OpenDyslexic or Lexie Readable\n\n4. **Reading Rulers or Overlays** - Helps students track text while reading\n\n5. **Graphic Organizer Software** - Helps students organize their thoughts visually\n\n6. **Audiobooks** - Provides access to grade-level literature\n\n7. **Digital Manipulatives** - Virtual letter tiles or sound boxes\n\nRemember that technology should supplement rather than replace direct, explicit instruction.");
        }
        
        // Filipino language specific
        else if (lowerQuery.includes('filipino') || lowerQuery.includes('tagalog')) {
          resolve("For teaching Filipino reading to dyslexic students, remember these specific considerations:\n\n1. **Consistent Orthography** - Filipino has more consistent letter-sound correspondence than English, which can be helpful for dyslexic learners\n\n2. **Syllable Focus** - Filipino is naturally syllabic, so emphasis on syllable patterns works well\n\n3. **Linguistic Structure** - Teach the structure of Filipino words, including root words and affixes\n\n4. **Consonant Blends** - Pay special attention to teaching Filipino consonant blends like 'ng', 'sy', and 'ts'\n\n5. **Vowel Sounds** - Focus on the five vowel sounds and their consistent pronunciation\n\n6. **Sight Words** - Create Filipino sight word lists for high-frequency words\n\nExplicit, systematic instruction works in any language - adapt your multisensory techniques to Filipino linguistic patterns.");
        }
        
        // Classroom environment/management
        else if (lowerQuery.includes('classroom') || lowerQuery.includes('environment') || lowerQuery.includes('management')) {
          resolve("Creating a dyslexia-friendly classroom environment includes:\n\n1. **Structured Routine** - Maintain predictable daily routines and clear expectations\n\n2. **Visual Supports** - Use visual schedules, labeled materials, and color-coding\n\n3. **Organized Space** - Minimize visual clutter and organize materials clearly\n\n4. **Accessible Materials** - Provide handouts in dyslexia-friendly fonts with increased spacing\n\n5. **Quiet Work Areas** - Create spaces with minimal distractions for focused work\n\n6. **Accommodations Station** - Designate an area with tools like reading rulers, timers, and fidgets\n\n7. **Positive Atmosphere** - Emphasize growth and celebrate small successes\n\nRemember that what helps dyslexic students often benefits all learners in your classroom.");
        }
        
        // Behavior and motivation
        else if (lowerQuery.includes('motivation') || lowerQuery.includes('behavior') || lowerQuery.includes('confidence')) {
          resolve("To build motivation and confidence in dyslexic students:\n\n1. **Celebrate Small Wins** - Acknowledge even minor progress to build confidence\n\n2. **Provide Choice** - Allow students some control over learning activities\n\n3. **Focus on Strengths** - Identify and leverage each student's areas of strength\n\n4. **Use Interests** - Incorporate students' interests into reading materials\n\n5. **Set Achievable Goals** - Break learning into small, attainable steps\n\n6. **Positive Feedback** - Give specific, immediate praise for effort and strategies\n\n7. **Growth Mindset** - Emphasize that the brain can change and reading skills can improve with practice\n\nMany dyslexic students develop negative attitudes toward reading after experiencing failure - rebuilding confidence is essential for progress.");
        }
        
        // Parent communication
        else if (lowerQuery.includes('parent') || lowerQuery.includes('home') || lowerQuery.includes('family')) {
          resolve("For effective collaboration with parents of dyslexic students:\n\n1. **Clear Communication** - Explain dyslexia in straightforward terms without educational jargon\n\n2. **Home Activities** - Suggest simple, specific activities parents can do at home\n\n3. **Focus on Strengths** - Share positive observations about the student, not just challenges\n\n4. **Regular Updates** - Provide brief, frequent progress updates rather than only at conferences\n\n5. **Resource Sharing** - Direct parents to helpful books, websites, or support groups\n\n6. **Homework Guidance** - Give clear instructions for parents on how to support homework\n\n7. **Listen to Parents** - They know their child best and can offer valuable insights\n\nRemember that parents may be processing their own emotions about their child's learning differences.");
        }
        
        // Default response
        else {
          resolve("Thank you for your question about teaching students with dyslexia. As a teaching assistant specializing in dyslexia support, I can provide information about:\n\n- Multisensory teaching strategies\n- Phonological awareness activities\n- Reading fluency approaches\n- Comprehension techniques\n- Assessment methods\n- Engaging classroom activities\n- Helpful tools and technology\n- Filipino language considerations\n- Classroom management\n- Student motivation and confidence\n- Parent communication\n\nCould you share more details about what specific aspect of teaching dyslexic students you'd like help with?");
        }
      }
    }, 1000);
  });
};