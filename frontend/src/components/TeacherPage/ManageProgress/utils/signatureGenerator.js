/**
 * Signature Generator Utility
 * Generates realistic SVG-based handwritten signatures for IEP reports
 */

/**
 * Generate realistic principal signature SVG path
 * "MS. JASMINE P. LIM" - Elaborate, formal signature style
 * @returns {object} SVG signature data
 */
export const generatePrincipalSignaturePath = () => {
  const width = 260;
  const height = 75;

  // Elegant, elaborate signature with distinctive flourishes
  // Represents a formal, authoritative signature style with personality
  const path = `
    M 20,42
    C 22,28 28,20 35,25
    C 40,29 42,38 48,35
    C 54,32 58,25 65,30
    C 70,34 73,42 80,40

    M 85,35
    C 88,22 95,18 102,24
    C 108,29 112,38 120,36
    C 128,34 135,25 143,30
    C 150,34 155,42 163,40
    C 170,38 175,32 183,36

    M 188,30
    C 192,20 198,16 205,22
    C 210,27 213,35 220,33
    C 227,31 232,25 238,30
    C 243,34 246,40 250,38

    M 48,37
    C 50,48 52,54 54,52
    M 80,42
    C 82,52 84,56 86,54

    M 163,42
    C 165,52 168,58 170,55

    M 238,32
    C 240,44 243,50 246,48

    M 25,50
    C 80,53 180,55 245,50

    M 35,26
    C 28,18 25,12 32,15
    C 38,18 42,22 45,20
  `;

  return {
    path: path.trim(),
    width: width,
    height: height,
    viewBox: `0 0 ${width} ${height}`
  };
};

/**
 * Generate personalized realistic signature based on actual name
 * Creates unique signature patterns for different names with natural cursive flow
 * @param {string} fullName - Full name to generate signature for
 * @returns {object} SVG signature data
 */
export const generateSignatureFromName = (fullName) => {
  const nameParts = fullName.split(' ').filter(part => part.length > 0);

  if (nameParts.length === 0) {
    return {
      path: 'M 20,40 C 30,25 45,30 60,38 C 75,35 90,42 105,40',
      width: 150,
      height: 70,
      viewBox: '0 0 150 70'
    };
  }

  const firstName = nameParts[0];
  const hasLastName = nameParts.length > 1;
  const lastName = hasLastName ? nameParts[nameParts.length - 1] : '';

  // Calculate width based on name length
  const baseWidth = 180;
  const extraWidth = (firstName.length + (lastName.length || 0)) * 8;
  const width = Math.min(baseWidth + extraWidth, 280);
  const height = 70;

  let paths = [];
  let x = 20;

  // First name - flowing cursive with natural variations
  const firstNameWidth = Math.min(firstName.length * 15, 110);
  paths.push(`
    M ${x},42
    C ${x + 3},30 ${x + 8},24 ${x + 15},28
    C ${x + 20},32 ${x + 24},40 ${x + 30},38
    C ${x + 36},36 ${x + 42},30 ${x + 50},34
    C ${x + 56},37 ${x + 62},43 ${x + 70},41
    C ${x + 76},39 ${x + 82},33 ${x + firstNameWidth},37
  `);

  // First name descender flourish (like 'g', 'j', 'y' tails)
  paths.push(`
    M ${x + 30},40
    C ${x + 32},50 ${x + 34},54 ${x + 36},52
  `);

  x += firstNameWidth + 20;

  // Last name - if exists, more elaborate with distinctive character
  if (hasLastName && lastName.length > 0) {
    const lastNameWidth = Math.min(lastName.length * 18, 130);

    paths.push(`
      M ${x},36
      C ${x + 5},22 ${x + 12},18 ${x + 20},24
      C ${x + 26},29 ${x + 32},37 ${x + 42},35
      C ${x + 50},33 ${x + 58},25 ${x + 68},30
      C ${x + 76},34 ${x + 84},42 ${x + 95},40
      C ${x + 104},38 ${x + 112},32 ${x + lastNameWidth},36
    `);

    // Last name flourish and personality
    paths.push(`
      M ${x + 68},32
      C ${x + 70},46 ${x + 73},52 ${x + 76},50
    `);

    // Signature underline with natural curve
    paths.push(`
      M 25,52
      C ${width / 3},54 ${width * 2 / 3},56 ${width - 15},52
    `);

    x += lastNameWidth;
  } else {
    // Single name underline
    paths.push(`
      M 25,50
      C ${width / 2},52 ${width - 30},53 ${width - 20},50
    `);
  }

  return {
    path: paths.join(' '),
    width: width,
    height: height,
    viewBox: `0 0 ${width} ${height}`
  };
};
