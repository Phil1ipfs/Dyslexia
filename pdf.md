ZAP by Checkmarx Scanning
Report
Site: https://literexia.com
Generated on Fri, 3 Oct 2025 10:06:39
ZAP Version: 2.16.1
ZAP by Checkmarx
Summary of Alerts
Risk Level Number of Alerts
High 0
Medium 2
Low 4
Informational 4
Alerts
Name Risk Level Number of
Instances
Content Security Policy (CSP) Header Not Set Medium 3
Missing Anti-clickjacking Header Medium 1
Server Leaks Version Information via "Server"
HTTP Response Header Field Low 12
Strict-Transport-Security Header Not Set Low 12
Timestamp Disclosure - Unix Low 235
X-Content-Type-Options Header Missing Low 10
Information Disclosure - Suspicious Comments Informational 4
Modern Web Application Informational 3
Re-examine Cache-control Directives Informational 2
Retrieved from Cache Informational 10
Alert Detail
Medium Description
Content Security Policy (CSP) Header Not Set
Content Security Policy (CSP) is an added layer of security that helps to detect and mitigate
certain types of attacks, including Cross Site Scripting (XSS) and data injection attacks.
These attacks are used for everything from data theft to site defacement or distribution of
malware. CSP provides a set of standard HTTP headers that allow website owners to
declare approved sources of content that browsers should be allowed to load on that page
— covered types are JavaScript, CSS, HTML frames, fonts, images and embeddable
objects such as Java applets, ActiveX, audio and video files.
URL https://literexia.com/
Method GET
Attack
Evidence
Other
Info
URL https://literexia.com/robots.txt
Method GET
Attack
Evidence
Other
Info
URL https://literexia.com/sitemap.xml
Method GET
Attack
Evidence
Other
Info
Instances 3
Solution Ensure that your web server, application server, load balancer, etc. is configured to set the
Content-Security-Policy header.
Reference
https://developer.mozilla.org/en-US/docs/Web/Security/CSP
/Introducing_Content_Security_Policy
https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
https://www.w3.org/TR/CSP/
https://w3c.github.io/webappsec-csp/
https://web.dev/articles/csp
https://caniuse.com/#feat=contentsecuritypolicy
https://content-security-policy.com/
CWE Id 693
WASC Id 15
Plugin Id Medium 10038
Missing Anti-clickjacking Header
Description The response does not protect against 'ClickJacking' attacks. It should include either
Content-Security-Policy with 'frame-ancestors' directive or X-Frame-Options.
URL https://literexia.com/
Method GET
Attack
Evidence
Other
Info
Instances 1
Modern Web browsers support the Content-Security-Policy and X-Frame-Options HTTP
headers. Ensure one of them is set on all web pages returned by your site/app.
Solution
If you expect the page to be framed only by pages on your server (e.g. it's part of a
FRAMESET) then you'll want to use SAMEORIGIN, otherwise if you never expect the page
to be framed, you should use DENY. Alternatively consider implementing Content Security
Policy's "frame-ancestors" directive.
Reference https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
CWE Id 1021
WASC Id 15
Plugin Id 10020
Low Server Leaks Version Information via "Server" HTTP Response Header Field
Description
The web/application server is leaking version information via the "Server" HTTP response
header. Access to such information may facilitate attackers identifying other vulnerabilities
your web/application server is subject to.
URL https://literexia.com/
Method GET
Attack
Evidence AmazonS3
Other
Info
URL https://literexia.com/assets/charts-B5WPxg-W.js
Method GET
Attack
Evidence AmazonS3
Other
Info
URL https://literexia.com/assets/cradleLogoTrans-CF8gorN5.png
Method GET
Attack
Evidence AmazonS3
Other
Info
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence AmazonS3
Other
Info
URL https://literexia.com/assets/main-CY3ytB4a.css
Method GET
Attack
Evidence AmazonS3
Other
Info
URL https://literexia.com/assets/router-BNJaP8aK.js
Method GET
Attack
Evidence AmazonS3
Other
Info
URL https://literexia.com/assets/ui-Dj6VSb9T.js
Method GET
Attack
Evidence AmazonS3
Other
Info
URL https://literexia.com/assets/utils-BLQyEm9L.js
Method GET
Attack
Evidence AmazonS3
Other
Info
URL https://literexia.com/assets/vendor-CLSbD3MO.js
Method GET
Attack
Evidence AmazonS3
Other
Info
URL https://literexia.com/manifest.json
Method GET
Attack
Evidence AmazonS3
Other
Info
URL https://literexia.com/robots.txt
Method GET
Attack
Evidence AmazonS3
Other
Info
URL https://literexia.com/sitemap.xml
Method GET
Attack
Evidence AmazonS3
Other
Info
Instances 12
Solution Ensure that your web server, application server, load balancer, etc. is configured to
suppress the "Server" header or provide generic details.
Reference
https://httpd.apache.org/docs/current/mod/core.html#servertokens
https://learn.microsoft.com/en-us/previous-versions/msp-n-p/ff648552(v=pandp.10)
https://www.troyhunt.com/shhh-dont-let-your-response-headers/
CWE Id WASC Id Plugin Id Low Description
URL Method Attack
Evidence
Other
Info
URL Method Attack
Evidence
Other
Info
URL Method Attack
Evidence
Other
Info
URL Method Attack
Evidence
Other
Info
URL Method Attack
Evidence
Other
Info
URL Method Attack
Evidence
Other
Info
497
13
10036
Strict-Transport-Security Header Not Set
HTTP Strict Transport Security (HSTS) is a web security policy mechanism whereby a web
server declares that complying user agents (such as a web browser) are to interact with it
using only secure HTTPS connections (i.e. HTTP layered over TLS/SSL). HSTS is an IETF
standards track protocol and is specified in RFC 6797.
https://literexia.com/
GET
https://literexia.com/assets/charts-B5WPxg-W.js
GET
https://literexia.com/assets/cradleLogoTrans-CF8gorN5.png
GET
https://literexia.com/assets/main-B1E3iPMa.js
GET
https://literexia.com/assets/main-CY3ytB4a.css
GET
https://literexia.com/assets/router-BNJaP8aK.js
GET
URL https://literexia.com/assets/ui-Dj6VSb9T.js
Method GET
Attack
Evidence
Other
Info
URL Method https://literexia.com/assets/utils-BLQyEm9L.js
GET
Attack
Evidence
Other
Info
URL https://literexia.com/assets/vendor-CLSbD3MO.js
Method GET
Attack
Evidence
Other
Info
URL https://literexia.com/manifest.json
Method GET
Attack
Evidence
Other
Info
URL https://literexia.com/robots.txt
Method GET
Attack
Evidence
Other
Info
URL https://literexia.com/sitemap.xml
Method GET
Attack
Evidence
Other
Info
Instances 12
Solution Ensure that your web server, application server, load balancer, etc. is configured to enforce
Strict-Transport-Security.
Reference
https://cheatsheetseries.owasp.org/cheatsheets
/HTTP_Strict_Transport_Security_Cheat_Sheet.html
https://owasp.org/www-community/Security_Headers
https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security
https://caniuse.com/stricttransportsecurity
CWE Id https://datatracker.ietf.org/doc/html/rfc6797
319
WASC Id 15
Plugin Id 10035
Low Timestamp Disclosure - Unix
Description A timestamp was disclosed by the application/web server. - Unix
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1444681467
Other
Info 1444681467, which evaluates to: 2015-10-13 04:24:27.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1449415276
Other
Info 1449415276, which evaluates to: 2015-12-06 23:21:16.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1450815602
Other
Info 1450815602, which evaluates to: 2015-12-23 04:20:02.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1452454533
Other
Info 1452454533, which evaluates to: 2016-01-11 03:35:33.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1455516326
Other
Info 1455516326, which evaluates to: 2016-02-15 14:05:26.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1456262402
Other
Info 1456262402, which evaluates to: 2016-02-24 05:20:02.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1457606340
Other
Info 1457606340, which evaluates to: 2016-03-10 18:39:00.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1461121720
Other
Info 1461121720, which evaluates to: 2016-04-20 11:08:40.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1461446943
Other
Info 1461446943, which evaluates to: 2016-04-24 05:29:03.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1463355134
Other
Info 1463355134, which evaluates to: 2016-05-16 07:32:14.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1464375394
Other
Info 1464375394, which evaluates to: 2016-05-28 02:56:34.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1464380207
Other
Info 1464380207, which evaluates to: 2016-05-28 04:16:47.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1466527264
Other
Info 1466527264, which evaluates to: 2016-06-22 00:41:04.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1467031594
Other
Info 1467031594, which evaluates to: 2016-06-27 20:46:34.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1469046755
Other
Info 1469046755, which evaluates to: 2016-07-21 04:32:35.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1471733935
Other
Info 1471733935, which evaluates to: 2016-08-21 06:58:55.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1473231341
Other
Info 1473231341, which evaluates to: 2016-09-07 14:55:41.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1475708069
Other
Info 1475708069, which evaluates to: 2016-10-06 06:54:29.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1476395008
Other
Info 1476395008, which evaluates to: 2016-10-14 05:43:28.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1476395009
Other
Info 1476395009, which evaluates to: 2016-10-14 05:43:29.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1480756522
Other
Info 1480756522, which evaluates to: 2016-12-03 17:15:22.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method GET
1483529935
1483529935, which evaluates to: 2017-01-04 19:38:55.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1491858159
1491858159, which evaluates to: 2017-04-11 05:02:39.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1495573769
1495573769, which evaluates to: 2017-05-24 05:09:29.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1495990901
1495990901, which evaluates to: 2017-05-29 01:01:41.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1501505948
1501505948, which evaluates to: 2017-07-31 20:59:08.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1502002290
1502002290, which evaluates to: 2017-08-06 14:51:30.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1507829418
1507829418, which evaluates to: 2017-10-13 01:30:18.
https://literexia.com/assets/main-B1E3iPMa.js
GET
Attack
Evidence 1508970993
Other
Info 1508970993, which evaluates to: 2017-10-26 06:36:33.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1510255612
Other
Info 1510255612, which evaluates to: 2017-11-10 03:26:52.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1514023603
Other
Info 1514023603, which evaluates to: 2017-12-23 18:06:43.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1517677493
Other
Info 1517677493, which evaluates to: 2018-02-04 01:04:53.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1518500249
Other
Info 1518500249, which evaluates to: 2018-02-13 13:37:29.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1518925132
Other
Info 1518925132, which evaluates to: 2018-02-18 11:38:52.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1522805485
Other
Info 1522805485, which evaluates to: 2018-04-04 09:31:25.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1522871579
Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info 1522871579, which evaluates to: 2018-04-05 03:52:59.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1524020338
1524020338, which evaluates to: 2018-04-18 10:58:58.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1530992060
1530992060, which evaluates to: 2018-07-08 03:34:20.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1531092325
1531092325, which evaluates to: 2018-07-09 07:25:25.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1533947780
1533947780, which evaluates to: 2018-08-11 08:36:20.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1535977030
1535977030, which evaluates to: 2018-09-03 20:17:10.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1537002063
1537002063, which evaluates to: 2018-09-15 17:01:03.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1539241949
1539241949, which evaluates to: 2018-10-11 15:12:29.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1540483477
Other
Info 1540483477, which evaluates to: 2018-10-26 00:04:37.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1541459225
Other
Info 1541459225, which evaluates to: 2018-11-06 07:07:05.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1546045734
Other
Info 1546045734, which evaluates to: 2018-12-29 09:08:54.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1548603684
Other
Info 1548603684, which evaluates to: 2019-01-27 23:41:24.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1549556828
Other
Info 1549556828, which evaluates to: 2019-02-08 00:27:08.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1555064734
Other
Info 1555064734, which evaluates to: 2019-04-12 18:25:34.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1555081692
Other
Info 1555081692, which evaluates to: 2019-04-12 23:08:12.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1560198380
Other
Info 1560198380, which evaluates to: 2019-06-11 04:26:20.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1565136089
Other
Info 1565136089, which evaluates to: 2019-08-07 08:01:29.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1569222167
Other
Info 1569222167, which evaluates to: 2019-09-23 15:02:47.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1575780402
Other
Info 1575780402, which evaluates to: 2019-12-08 12:46:42.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1575990012
Other
Info 1575990012, which evaluates to: 2019-12-10 23:00:12.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1583128258
Other
Info 1583128258, which evaluates to: 2020-03-02 13:50:58.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1593081372
Other
Info 1593081372, which evaluates to: 2020-06-25 18:36:12.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1594956187
Other
Info 1594956187, which evaluates to: 2020-07-17 11:23:07.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1595750129
Other
Info 1595750129, which evaluates to: 2020-07-26 15:55:29.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1604231423
Other
Info 1604231423, which evaluates to: 2020-11-01 19:50:23.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1607167915
Other
Info 1607167915, which evaluates to: 2020-12-05 19:31:55.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1610612736
Other
Info 1610612736, which evaluates to: 2021-01-14 16:25:36.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1610612737
Other
Info 1610612737, which evaluates to: 2021-01-14 16:25:37.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1610833997
Other
Info 1610833997, which evaluates to: 2021-01-17 05:53:17.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1613405280
Other
Info 1613405280, which evaluates to: 2021-02-16 00:08:00.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1614419982
Other
Info 1614419982, which evaluates to: 2021-02-27 17:59:42.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1617046695
Other
Info 1617046695, which evaluates to: 2021-03-30 03:38:15.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1618508792
Other
Info 1618508792, which evaluates to: 2021-04-16 01:46:32.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1628790961
Other
Info 1628790961, which evaluates to: 2021-08-13 01:56:01.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1637815568
Other
Info 1637815568, which evaluates to: 2021-11-25 12:46:08.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1638401717
Other
Info 1638401717, which evaluates to: 2021-12-02 07:35:17.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1641548236
Other
Info 1641548236, which evaluates to: 2022-01-07 17:37:16.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method GET
1641649973
1641649973, which evaluates to: 2022-01-08 21:52:53.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1648197032
1648197032, which evaluates to: 2022-03-25 16:30:32.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1653985193
1653985193, which evaluates to: 2022-05-31 16:19:53.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1654270250
1654270250, which evaluates to: 2022-06-03 23:30:50.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1655181056
1655181056, which evaluates to: 2022-06-14 12:30:56.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1660621633
1660621633, which evaluates to: 2022-08-16 11:47:13.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1661551462
1661551462, which evaluates to: 2022-08-27 06:04:22.
https://literexia.com/assets/main-B1E3iPMa.js
GET
Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence 1667834072
1667834072, which evaluates to: 2022-11-07 23:14:32.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1668267050
1668267050, which evaluates to: 2022-11-12 23:30:50.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1669523910
1669523910, which evaluates to: 2022-11-27 12:38:30.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1676153920
1676153920, which evaluates to: 2023-02-12 06:18:40.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1676643554
1676643554, which evaluates to: 2023-02-17 22:19:14.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1679025792
1679025792, which evaluates to: 2023-03-17 12:03:12.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1682292957
1682292957, which evaluates to: 2023-04-24 07:35:57.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1685915746
Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info 1685915746, which evaluates to: 2023-06-05 05:55:46.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1686838959
1686838959, which evaluates to: 2023-06-15 22:22:39.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1687547391
1687547391, which evaluates to: 2023-06-24 03:09:51.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1689216846
1689216846, which evaluates to: 2023-07-13 10:54:06.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1692713982
1692713982, which evaluates to: 2023-08-22 22:19:42.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1694076839
1694076839, which evaluates to: 2023-09-07 16:53:59.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1695183700
1695183700, which evaluates to: 2023-09-20 12:21:40.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1699332808
1699332808, which evaluates to: 2023-11-07 12:53:28.
URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method https://literexia.com/assets/main-B1E3iPMa.js
GET
1699691293
1699691293, which evaluates to: 2023-11-11 16:28:13.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1700274565
1700274565, which evaluates to: 2023-11-18 10:29:25.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1700445008
1700445008, which evaluates to: 2023-11-20 09:50:08.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1700485571
1700485571, which evaluates to: 2023-11-20 21:06:11.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1701076831
1701076831, which evaluates to: 2023-11-27 17:20:31.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1712269319
1712269319, which evaluates to: 2024-04-05 06:21:59.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1713906067
1713906067, which evaluates to: 2024-04-24 05:01:07.
https://literexia.com/assets/main-B1E3iPMa.js
GET
Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
1714227617
1714227617, which evaluates to: 2024-04-27 22:20:17.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1714657791
1714657791, which evaluates to: 2024-05-02 21:49:51.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1719377915
1719377915, which evaluates to: 2024-06-26 12:58:35.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1721773893
1721773893, which evaluates to: 2024-07-24 06:31:33.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1724537150
1724537150, which evaluates to: 2024-08-25 06:05:50.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1724754687
1724754687, which evaluates to: 2024-08-27 18:31:27.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1728879713
1728879713, which evaluates to: 2024-10-14 12:21:53.
https://literexia.com/assets/main-B1E3iPMa.js
GET
Evidence 1729034894
Other
Info 1729034894, which evaluates to: 2024-10-16 07:28:14.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1731405415
Other
Info 1731405415, which evaluates to: 2024-11-12 17:56:55.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1732584193
Other
Info 1732584193, which evaluates to: 2024-11-26 09:23:13.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1732584194
Other
Info 1732584194, which evaluates to: 2024-11-26 09:23:14.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1734335097
Other
Info 1734335097, which evaluates to: 2024-12-16 15:44:57.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1735328473
Other
Info 1735328473, which evaluates to: 2024-12-28 03:41:13.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1738483198
Other
Info 1738483198, which evaluates to: 2025-02-02 15:59:58.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1744830464
Other
Info 1744830464, which evaluates to: 2025-04-17 03:07:44.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1744830465
Other
Info 1744830465, which evaluates to: 2025-04-17 03:07:45.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1745797284
Other
Info 1745797284, which evaluates to: 2025-04-28 07:41:24.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1747873779
Other
Info 1747873779, which evaluates to: 2025-05-22 08:29:39.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1749149687
Other
Info 1749149687, which evaluates to: 2025-06-06 02:54:47.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1749200295
Other
Info 1749200295, which evaluates to: 2025-06-06 16:58:15.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1750603025
Other
Info 1750603025, which evaluates to: 2025-06-22 22:37:05.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1753167236
Other
Info 1753167236, which evaluates to: 2025-07-22 14:53:56.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method GET
1754252060
1754252060, which evaluates to: 2025-08-04 04:14:20.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1756076034
1756076034, which evaluates to: 2025-08-25 06:53:54.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1759253602
1759253602, which evaluates to: 2025-10-01 01:33:22.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1761308591
1761308591, which evaluates to: 2025-10-24 20:23:11.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1762651403
1762651403, which evaluates to: 2025-11-09 09:23:23.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1767581616
1767581616, which evaluates to: 2026-01-05 10:53:36.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1768516095
1768516095, which evaluates to: 2026-01-16 06:28:15.
https://literexia.com/assets/main-B1E3iPMa.js
GET
Attack
Evidence 1770035416
Other
Info 1770035416, which evaluates to: 2026-02-02 20:30:16.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1770335741
Other
Info 1770335741, which evaluates to: 2026-02-06 07:55:41.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1771706367
Other
Info 1771706367, which evaluates to: 2026-02-22 04:39:27.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1774776394
Other
Info 1774776394, which evaluates to: 2026-03-29 17:26:34.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1774941330
Other
Info 1774941330, which evaluates to: 2026-03-31 15:15:30.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1779033703
Other
Info 1779033703, which evaluates to: 2026-05-18 00:01:43.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1779581495
Other
Info 1779581495, which evaluates to: 2026-05-24 08:11:35.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1780907670
Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info 1780907670, which evaluates to: 2026-06-08 16:34:30.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1781354906
1781354906, which evaluates to: 2026-06-13 20:48:26.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1781952180
1781952180, which evaluates to: 2026-06-20 18:43:00.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1783734482
1783734482, which evaluates to: 2026-07-11 09:48:02.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1784335871
1784335871, which evaluates to: 2026-07-18 08:51:11.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1797494240
1797494240, which evaluates to: 2026-12-17 15:57:20.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1800124847
1800124847, which evaluates to: 2027-01-17 02:40:47.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1802137761
1802137761, which evaluates to: 2027-02-09 09:49:21.
URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method https://literexia.com/assets/main-B1E3iPMa.js
GET
1804477439
1804477439, which evaluates to: 2027-03-08 11:43:59.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1804592342
1804592342, which evaluates to: 2027-03-09 19:39:02.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1804603682
1804603682, which evaluates to: 2027-03-09 22:48:02.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1804850592
1804850592, which evaluates to: 2027-03-12 19:23:12.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1807016891
1807016891, which evaluates to: 2027-04-06 21:08:11.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1814182875
1814182875, which evaluates to: 2027-06-28 19:41:15.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1814351708
1814351708, which evaluates to: 2027-06-30 18:35:08.
https://literexia.com/assets/main-B1E3iPMa.js
GET
Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
1816402316
1816402316, which evaluates to: 2027-07-24 12:11:56.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1817252668
1817252668, which evaluates to: 2027-08-03 08:24:28.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1822297739
1822297739, which evaluates to: 2027-09-30 17:48:59.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1835478071
1835478071, which evaluates to: 2028-03-01 07:01:11.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1836072691
1836072691, which evaluates to: 2028-03-08 04:11:31.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1839030562
1839030562, which evaluates to: 2028-04-11 09:49:22.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1841049896
1841049896, which evaluates to: 2028-05-04 18:44:56.
https://literexia.com/assets/main-B1E3iPMa.js
GET
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
1845252383
1845252383, which evaluates to: 2028-06-22 10:06:23.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1846949527
1846949527, which evaluates to: 2028-07-12 01:32:07.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1854211946
1854211946, which evaluates to: 2028-10-04 02:52:26.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1856431235
1856431235, which evaluates to: 2028-10-29 19:20:35.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1859775393
1859775393, which evaluates to: 2028-12-07 12:16:33.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1861159788
1861159788, which evaluates to: 2028-12-23 12:49:48.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1862657033
1862657033, which evaluates to: 2029-01-09 20:43:53.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1866414978
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL 1866414978, which evaluates to: 2029-02-22 08:36:18.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1866599683
1866599683, which evaluates to: 2029-02-24 11:54:43.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1873313359
1873313359, which evaluates to: 2029-05-13 04:49:19.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1876281319
1876281319, which evaluates to: 2029-06-16 13:15:19.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1879048192
1879048192, which evaluates to: 2029-07-18 13:49:52.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1879048193
1879048193, which evaluates to: 2029-07-18 13:49:53.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1887473919
1887473919, which evaluates to: 2029-10-24 02:18:39.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1894007588
1894007588, which evaluates to: 2030-01-07 17:13:08.
https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1894986606
Other
Info 1894986606, which evaluates to: 2030-01-19 01:10:06.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1895095763
Other
Info 1895095763, which evaluates to: 2030-01-20 07:29:23.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1897031941
Other
Info 1897031941, which evaluates to: 2030-02-11 17:19:01.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1899447441
Other
Info 1899447441, which evaluates to: 2030-03-11 16:17:21.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1899903192
Other
Info 1899903192, which evaluates to: 2030-03-16 22:53:12.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1901547113
Other
Info 1901547113, which evaluates to: 2030-04-04 23:31:53.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1904987480
Other
Info 1904987480, which evaluates to: 2030-05-14 19:11:20.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1908823572
Other
Info 1908823572, which evaluates to: 2030-06-28 04:46:12.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1910503582
Other
Info 1910503582, which evaluates to: 2030-07-17 15:26:22.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1914138554
Other
Info 1914138554, which evaluates to: 2030-08-28 17:09:14.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1917689273
Other
Info 1917689273, which evaluates to: 2030-10-08 19:27:53.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1921955416
Other
Info 1921955416, which evaluates to: 2030-11-27 04:30:16.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1925078388
Other
Info 1925078388, which evaluates to: 2031-01-02 07:59:48.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1926607734
Other
Info 1926607734, which evaluates to: 2031-01-20 00:48:54.
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence 1927990952
Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info 1927990952, which evaluates to: 2031-02-05 01:02:32.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1946737175
1946737175, which evaluates to: 2031-09-10 00:19:35.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1947078029
1947078029, which evaluates to: 2031-09-13 23:00:29.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1947742710
1947742710, which evaluates to: 2031-09-21 15:38:30.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1955562222
1955562222, which evaluates to: 2031-12-21 03:43:42.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1958414417
1958414417, which evaluates to: 2032-01-23 04:00:17.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1963543593
1963543593, which evaluates to: 2032-03-22 12:46:33.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1966332200
1966332200, which evaluates to: 2032-04-23 19:23:20.
URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method https://literexia.com/assets/main-B1E3iPMa.js
GET
1970579870
1970579870, which evaluates to: 2032-06-11 23:17:50.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1979897079
1979897079, which evaluates to: 2032-09-27 19:24:39.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1983633131
1983633131, which evaluates to: 2032-11-10 01:12:11.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1986661051
1986661051, which evaluates to: 2032-12-15 02:17:31.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1990404162
1990404162, which evaluates to: 2033-01-27 10:02:42.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1996064986
1996064986, which evaluates to: 2033-04-02 22:29:46.
https://literexia.com/assets/main-B1E3iPMa.js
GET
1998579484
1998579484, which evaluates to: 2033-05-02 00:58:04.
https://literexia.com/assets/main-B1E3iPMa.js
GET
Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
2000651841
2000651841, which evaluates to: 2033-05-26 00:37:21.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2001055236
2001055236, which evaluates to: 2033-05-30 16:40:36.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2001714738
2001714738, which evaluates to: 2033-06-07 07:52:18.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2003034995
2003034995, which evaluates to: 2033-06-22 14:36:35.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2005441023
2005441023, which evaluates to: 2033-07-20 10:57:03.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2006996926
2006996926, which evaluates to: 2033-08-07 11:08:46.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2007800933
2007800933, which evaluates to: 2033-08-16 18:28:53.
https://literexia.com/assets/main-B1E3iPMa.js
GET
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
2007998917
2007998917, which evaluates to: 2033-08-19 01:28:37.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2008414854
2008414854, which evaluates to: 2033-08-23 21:00:54.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2012875353
2012875353, which evaluates to: 2033-10-14 12:02:33.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2013265920
2013265920, which evaluates to: 2033-10-19 00:32:00.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2013265921
2013265921, which evaluates to: 2033-10-19 00:32:01.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2016342300
2016342300, which evaluates to: 2033-11-23 15:05:00.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2019080857
2019080857, which evaluates to: 2033-12-25 07:47:37.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2019492241
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL 2019492241, which evaluates to: 2033-12-30 02:04:01.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2022574463
2022574463, which evaluates to: 2034-02-03 18:14:23.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2024104815
2024104815, which evaluates to: 2034-02-21 11:20:15.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2024746970
2024746970, which evaluates to: 2034-02-28 21:42:50.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2025931657
2025931657, which evaluates to: 2034-03-14 14:47:37.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2031300136
2031300136, which evaluates to: 2034-05-15 18:02:16.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2050118529
2050118529, which evaluates to: 2034-12-19 13:22:09.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2052605720
2052605720, which evaluates to: 2035-01-17 08:15:20.
https://literexia.com/assets/main-B1E3iPMa.js
Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method GET
2053994217
2053994217, which evaluates to: 2035-02-02 09:56:57.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2054922799
2054922799, which evaluates to: 2035-02-13 03:53:19.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2058025392
2058025392, which evaluates to: 2035-03-21 01:43:12.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2062231137
2062231137, which evaluates to: 2035-05-08 17:58:57.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2062866102
2062866102, which evaluates to: 2035-05-16 02:21:42.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2064951626
2064951626, which evaluates to: 2035-06-09 05:40:26.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2067696032
2067696032, which evaluates to: 2035-07-11 00:00:32.
https://literexia.com/assets/main-B1E3iPMa.js
GET
Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info URL Method Attack
Evidence Other
Info Instances Solution Reference CWE Id WASC Id Plugin Id Low Description
URL Method Attack
Evidence
Other
Info
URL Method Attack
Evidence
Other
Info
URL 2069144605
2069144605, which evaluates to: 2035-07-27 18:23:25.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2070474495
2070474495, which evaluates to: 2035-08-12 03:48:15.
https://literexia.com/assets/main-B1E3iPMa.js
GET
2073328063
2073328063, which evaluates to: 2035-09-14 04:27:43.
235
Manually confirm that the timestamp data is not sensitive, and that the data cannot be
aggregated to disclose exploitable patterns.
https://cwe.mitre.org/data/definitions/200.html
497
13
10096
X-Content-Type-Options Header Missing
The Anti-MIME-Sniffing header X-Content-Type-Options was not set to 'nosniff'. This allows
older versions of Internet Explorer and Chrome to perform MIME-sniffing on the response
body, potentially causing the response body to be interpreted and displayed as a content
type other than the declared content type. Current (early 2014) and legacy versions of
Firefox will use the declared content type (if one is set), rather than performing MIME-
sniffing.
https://literexia.com/
GET
This issue still applies to error type pages (401, 403, 500, etc.) as those pages are often still
affected by injection issues, in which case there is still concern for browsers sniffing pages
away from their actual content type. At "High" threshold this scan rule will not alert on client
or server error responses.
https://literexia.com/assets/charts-B5WPxg-W.js
GET
This issue still applies to error type pages (401, 403, 500, etc.) as those pages are often still
affected by injection issues, in which case there is still concern for browsers sniffing pages
away from their actual content type. At "High" threshold this scan rule will not alert on client
or server error responses.
https://literexia.com/assets/cradleLogoTrans-CF8gorN5.png
Method Attack
Evidence
Other
Info
URL Method Attack
Evidence
Other
Info
URL Method Attack
Evidence
Other
Info
URL Method Attack
Evidence
Other
Info
URL Method Attack
Evidence
Other
Info
URL Method Attack
Evidence
Other
Info
URL Method GET
This issue still applies to error type pages (401, 403, 500, etc.) as those pages are often still
affected by injection issues, in which case there is still concern for browsers sniffing pages
away from their actual content type. At "High" threshold this scan rule will not alert on client
or server error responses.
https://literexia.com/assets/main-B1E3iPMa.js
GET
This issue still applies to error type pages (401, 403, 500, etc.) as those pages are often still
affected by injection issues, in which case there is still concern for browsers sniffing pages
away from their actual content type. At "High" threshold this scan rule will not alert on client
or server error responses.
https://literexia.com/assets/main-CY3ytB4a.css
GET
This issue still applies to error type pages (401, 403, 500, etc.) as those pages are often still
affected by injection issues, in which case there is still concern for browsers sniffing pages
away from their actual content type. At "High" threshold this scan rule will not alert on client
or server error responses.
https://literexia.com/assets/router-BNJaP8aK.js
GET
This issue still applies to error type pages (401, 403, 500, etc.) as those pages are often still
affected by injection issues, in which case there is still concern for browsers sniffing pages
away from their actual content type. At "High" threshold this scan rule will not alert on client
or server error responses.
https://literexia.com/assets/ui-Dj6VSb9T.js
GET
This issue still applies to error type pages (401, 403, 500, etc.) as those pages are often still
affected by injection issues, in which case there is still concern for browsers sniffing pages
away from their actual content type. At "High" threshold this scan rule will not alert on client
or server error responses.
https://literexia.com/assets/utils-BLQyEm9L.js
GET
This issue still applies to error type pages (401, 403, 500, etc.) as those pages are often still
affected by injection issues, in which case there is still concern for browsers sniffing pages
away from their actual content type. At "High" threshold this scan rule will not alert on client
or server error responses.
https://literexia.com/assets/vendor-CLSbD3MO.js
GET
Attack
Evidence
Other
Info
URL Method Attack
Evidence
Other
Info
Instances Solution
Reference
CWE Id WASC Id Plugin Id Informational Description URL Method Attack
Evidence Other
Info
URL Method Attack
Evidence Other
Info
URL Method Attack
Evidence This issue still applies to error type pages (401, 403, 500, etc.) as those pages are often still
affected by injection issues, in which case there is still concern for browsers sniffing pages
away from their actual content type. At "High" threshold this scan rule will not alert on client
or server error responses.
https://literexia.com/manifest.json
GET
This issue still applies to error type pages (401, 403, 500, etc.) as those pages are often still
affected by injection issues, in which case there is still concern for browsers sniffing pages
away from their actual content type. At "High" threshold this scan rule will not alert on client
or server error responses.
10
Ensure that the application/web server sets the Content-Type header appropriately, and
that it sets the X-Content-Type-Options header to 'nosniff' for all web pages.
If possible, ensure that the end user uses a standards-compliant and modern web browser
that does not perform MIME-sniffing at all, or that can be directed by the web application
/web server to not perform MIME-sniffing.
https://learn.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer
/compatibility/gg622941(v=vs.85)
https://owasp.org/www-community/Security_Headers
693
15
10021
Information Disclosure - Suspicious Comments
The response appears to contain suspicious comments which may help an attacker.
https://literexia.com/assets/main-B1E3iPMa.js
GET
query
The following pattern was used: \bQUERY\b and was detected in likely comment: "
//${l}${t&&r?`:${r}`:""}@${n}${a?`:${a}`:""}/${s?`${s}/`:s}${i}`}function an(e){return{protocol:e.
protocol,publicKey:e.publicKey", see evidence field for the suspicious comment/snippet.
https://literexia.com/assets/router-BNJaP8aK.js
GET
user
The following pattern was used: \bUSER\b and was detected in likely comment: "//g,"%2F")).
join("/")}catch(t){return h(!1,`The URL path "${e}" could not be decoded because it is a
malformed URL segment. This", see evidence field for the suspicious comment/snippet.
https://literexia.com/assets/ui-Dj6VSb9T.js
GET
from
The following pattern was used: \bFROM\b and was detected in likely comment: "//www.w3.
Other
Info
org/2000/svg",viewBox:"0 0 ".concat(d," ").concat(m)})};const b=p&&!~f.classes.indexOf("fa-
fw")?{width:"".concat(d/m*16", see evidence field for the suspicious comment/snippet.
URL https://literexia.com/assets/utils-BLQyEm9L.js
Method GET
Attack
Evidence user
Other
Info
The following pattern was used: \bUSER\b and was detected in likely comment: "//localhost",
ce={...Object.freeze(Object.defineProperty({__proto__:null,hasBrowserEnv:oe,
hasStandardBrowserEnv:se,hasStandardBro", see evidence field for the suspicious
comment/snippet.
Instances 4
Solution Remove all comments that return information that may help an attacker and fix any
underlying problems they refer to.
Reference
CWE Id 615
WASC Id 13
Plugin Id 10027
Informational Modern Web Application
Description The application appears to be a modern web application. If you need to explore it
automatically then the Ajax Spider may well be more effective than the standard one.
URL https://literexia.com/
Method GET
Attack
Evidence <script type="module" crossorigin src="/assets/main-B1E3iPMa.js"></script>
Other
Info
No links have been found while there are scripts, which is an indication that this is a modern
web application.
URL https://literexia.com/robots.txt
Method GET
Attack
Evidence <script type="module" crossorigin src="/assets/main-B1E3iPMa.js"></script>
Other
Info
No links have been found while there are scripts, which is an indication that this is a modern
web application.
URL https://literexia.com/sitemap.xml
Method GET
Attack
Evidence <script type="module" crossorigin src="/assets/main-B1E3iPMa.js"></script>
Other
Info
No links have been found while there are scripts, which is an indication that this is a modern
web application.
Instances 3
Solution This is an informational alert and so no changes are required.
Reference
CWE Id
WASC Id
Plugin Id 10109
Informational Re-examine Cache-control Directives
Description
The cache-control header has not been set properly or is missing, allowing the browser and
proxies to cache content. For static assets like css, js, or image files this might be intended,
however, the resources should be reviewed to ensure that no sensitive content will be
cached.
URL https://literexia.com/
Method GET
Attack
Evidence public, max-age=0, s-maxage=31536000
Other
Info
URL https://literexia.com/manifest.json
Method GET
Attack
Evidence public, max-age=0, s-maxage=31536000
Other
Info
Instances 2
Solution
For secure content, ensure the cache-control HTTP header is set with "no-cache, no-store,
must-revalidate". If an asset should be cached consider setting the directives "public, max-
age, immutable".
Reference
https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.
html#web-content-caching
https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
https://grayduck.mn/2021/09/13/cache-control-recommendations/
CWE Id 525
WASC Id 13
Plugin Id 10015
Informational Retrieved from Cache
Description
The content was retrieved from a shared cache. If the response data is sensitive, personal
or user-specific, this may result in sensitive information being leaked. In some cases, this
may even result in a user gaining complete control of the session of another user,
depending on the configuration of the caching components in use in their environment. This
is primarily an issue where caching servers such as "proxy" caches are configured on the
local network. This configuration is typically found in corporate or educational environments,
for instance.
URL https://literexia.com/
Method GET
Attack
Evidence Hit from cloudfront
Other
Info
URL https://literexia.com/assets/charts-B5WPxg-W.js
Method GET
Attack
Evidence Hit from cloudfront
Other
Info
URL https://literexia.com/assets/cradleLogoTrans-CF8gorN5.png
Method GET
Attack
Evidence Hit from cloudfront
Other
Info
URL https://literexia.com/assets/main-B1E3iPMa.js
Method GET
Attack
Evidence Hit from cloudfront
Other
Info
URL https://literexia.com/assets/main-CY3ytB4a.css
Method GET
Attack
Evidence Hit from cloudfront
Other
Info
URL https://literexia.com/assets/router-BNJaP8aK.js
Method GET
Attack
Evidence Hit from cloudfront
Other
Info
URL https://literexia.com/assets/ui-Dj6VSb9T.js
Method GET
Attack
Evidence Hit from cloudfront
Other
Info
URL https://literexia.com/assets/utils-BLQyEm9L.js
Method GET
Attack
Evidence Hit from cloudfront
Other
Info
URL https://literexia.com/assets/vendor-CLSbD3MO.js
Method GET
Attack
Evidence Hit from cloudfront
Other
Info
URL https://literexia.com/manifest.json
Method GET
Attack
Evidence Hit from cloudfront
Other
Info
Instances 10
Solution
Validate that the response does not contain sensitive, personal or user-specific information.
If it does, consider the use of the following HTTP response headers, to limit, or prevent the
content being stored and retrieved from the cache by another user:
Cache-Control: no-cache, no-store, must-revalidate, private
Pragma: no-cache
Expires: 0
This configuration directs both HTTP 1.0 and HTTP 1.1 compliant caching servers to not
store the response, and to not retrieve the response (without validation) from the cache, in
response to a similar request.
Reference
https://tools.ietf.org/html/rfc7234
https://tools.ietf.org/html/rfc7231
https://www.rfc-editor.org/rfc/rfc9110.html
CWE Id
WASC Id
Plugin Id 10050