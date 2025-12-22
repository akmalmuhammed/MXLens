
import { HeaderParser } from "../src/lib/email/HeaderParser";
import { HeaderScorer } from "../src/lib/email/scoring/HeaderScorer";
import { SignalNormalizer } from "../src/lib/email/scoring/SignalNormalizer";

const mockArcHeaders = `Authentication-Results: mx.google.com;
       dkim=fail header.i=@example.com header.s=selector1 header.b=Hz3+;
       spf=fail (google.com: domain of sender@example.com does not designate 1.2.3.4 as permitted sender) smtp.mailfrom=sender@example.com;
       dmarc=fail (p=REJECT sp=REJECT dis=NONE) header.from=example.com
ARC-Seal: i=1; a=rsa-sha256; t=123456789; cv=pass;
       d=google.com; s=arc-20160816;
       b=...
ARC-Message-Signature: i=1; a=rsa-sha256; c=relaxed/relaxed; d=google.com; s=arc-20160816;
       h=...
ARC-Authentication-Results: i=1; mx.google.com;
       dkim=pass header.i=@example.com header.s=selector1 header.b=Hz3+;
       spf=pass (google.com: domain of sender@example.com designates 8.8.8.8 as permitted sender) smtp.mailfrom=sender@example.com;
       arc=pass (i=0)
Received: from gateway.com ([1.2.3.4]) by mx.google.com ...
`;

async function runTest() {
       console.log("Analyzing ARC Headers...");
       const analysis = await HeaderParser.parse(mockArcHeaders);

       console.log("ARC Status:", analysis.arc);

       const signals = await SignalNormalizer.normalize(analysis, null, { checkBody: false, checkAttachments: false });
       console.log("Normalized Signals:", {
              spf: signals.spfResult,
              dkim: signals.dkimResult,
              arc: signals.arcResult,
              originalSpf: signals.arcOriginalSpf,
              originalDkim: signals.arcOriginalDkim
       });

       const score = HeaderScorer.score(signals);
       console.log("Final Score:", score.score);
       console.log("Penalties:", score.penalties);
}

runTest();
