#!/usr/bin/env node

import fs from 'fs';

// Simple HTML report generator for CI/CD only
const generateHTMLReport = (auditData) => {
  const timestamp = new Date().toISOString();
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mobile Security Audit Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header .timestamp {
            opacity: 0.9;
            margin-top: 10px;
        }
        .summary {
            padding: 30px;
            border-bottom: 1px solid #eee;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .summary-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #007bff;
        }
        .summary-card.critical {
            border-left-color: #dc3545;
            background: #fff5f5;
        }
        .summary-card.warning {
            border-left-color: #ffc107;
            background: #fffbf0;
        }
        .summary-card.success {
            border-left-color: #28a745;
            background: #f0fff4;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            font-size: 2em;
            color: #333;
        }
        .summary-card p {
            margin: 0;
            color: #666;
            font-weight: 500;
        }
        .content {
            padding: 30px;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            color: #333;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .recommendations {
            background: #e3f2fd;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
        }
        .recommendations h3 {
            color: #1976d2;
            margin-top: 0;
        }
        .recommendations ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .recommendations li {
            margin-bottom: 8px;
            color: #333;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            color: #666;
            border-top: 1px solid #eee;
        }
        .risk-level {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 10px 0;
        }
        .risk-level.high {
            background: #dc3545;
            color: white;
        }
        .risk-level.medium {
            background: #ffc107;
            color: #212529;
        }
        .risk-level.low {
            background: #28a745;
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 Mobile Security Audit</h1>
            <div class="timestamp">Generated on ${timestamp}</div>
        </div>
        
        <div class="summary">
            <h2>📊 Executive Summary</h2>
            <div class="summary-grid">
                <div class="summary-card ${auditData.npmVulnerabilities > 0 ? 'critical' : 'success'}">
                    <h3>${auditData.npmVulnerabilities}</h3>
                    <p>NPM Vulnerabilities</p>
                </div>
                <div class="summary-card ${auditData.iosIssues > 0 ? 'warning' : 'success'}">
                    <h3>${auditData.iosIssues}</h3>
                    <p>iOS Issues</p>
                </div>
                <div class="summary-card ${auditData.androidIssues > 0 ? 'warning' : 'success'}">
                    <h3>${auditData.androidIssues}</h3>
                    <p>Android Issues</p>
                </div>
                <div class="summary-card ${auditData.sensitiveFiles > 0 ? 'critical' : 'success'}">
                    <h3>${auditData.sensitiveFiles}</h3>
                    <p>Sensitive Files</p>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <div class="risk-level ${auditData.npmVulnerabilities > 0 || auditData.sensitiveFiles > 0 ? 'high' : auditData.iosIssues > 0 || auditData.androidIssues > 0 ? 'medium' : 'low'}">
                    ${auditData.npmVulnerabilities > 0 || auditData.sensitiveFiles > 0 ? 'HIGH RISK' : auditData.iosIssues > 0 || auditData.androidIssues > 0 ? 'MEDIUM RISK' : 'LOW RISK'}
                </div>
                <p style="margin-top: 10px; font-size: 1.1em;">
                    ${auditData.npmVulnerabilities > 0 || auditData.sensitiveFiles > 0 ? 'Immediate action required' : auditData.iosIssues > 0 || auditData.androidIssues > 0 ? 'Review within 1 week' : 'Continue monitoring'}
                </p>
            </div>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>💡 Recommendations</h2>
                <div class="recommendations">
                    <h3>Immediate Actions</h3>
                    <ul>
                        ${auditData.npmVulnerabilities > 0 ? '<li>Run <code>npm audit fix</code> to fix non-breaking vulnerabilities</li>' : ''}
                        ${auditData.sensitiveFiles > 0 ? '<li>Remove sensitive files from repository immediately</li>' : ''}
                        ${auditData.iosIssues > 0 ? '<li>Update iOS dependencies with <code>cd ios/App && pod update</code></li>' : ''}
                        ${auditData.androidIssues > 0 ? '<li>Review Android build configuration for security settings</li>' : ''}
                        <li>Review this report with your security team</li>
                        <li>Schedule regular security audits</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>This report was generated automatically by the Mobile Dependency Security Audit system.</p>
            <p>For local development, use: <code>npm run audit:mobile</code></p>
        </div>
    </div>
</body>
</html>`;
};

// Parse audit results from the script output
const parseAuditResults = (scriptOutput) => {
  const results = {
    npmVulnerabilities: 0,
    iosIssues: 0,
    androidIssues: 0,
    sensitiveFiles: 0
  };
  
  // Parse NPM vulnerabilities
  const npmMatch = scriptOutput.match(/NPM dependencies: (\d+) vulnerabilities/);
  if (npmMatch) {
    results.npmVulnerabilities = parseInt(npmMatch[1]);
  }
  
  // Parse iOS issues
  const iosMatch = scriptOutput.match(/iOS issues: (\d+) found/);
  if (iosMatch) {
    results.iosIssues = parseInt(iosMatch[1]);
  }
  
  // Parse Android issues
  const androidMatch = scriptOutput.match(/Android issues: (\d+) found/);
  if (androidMatch) {
    results.androidIssues = parseInt(androidMatch[1]);
  }
  
  // Parse sensitive files
  const sensitiveMatch = scriptOutput.match(/Sensitive files: (\d+) found/);
  if (sensitiveMatch) {
    results.sensitiveFiles = parseInt(sensitiveMatch[1]);
  }
  
  return results;
};

// Main execution
const main = () => {
  try {
    // Read the audit script output from a file
    const auditOutput = fs.readFileSync('audit-output.txt', 'utf8');
    const auditData = parseAuditResults(auditOutput);
    
    // Generate HTML report
    const htmlReport = generateHTMLReport(auditData);
    
    // Write the report to a file
    fs.writeFileSync('mobile-security-audit-report.html', htmlReport);
    
    console.log('✅ HTML report generated: mobile-security-audit-report.html');
    console.log(`📊 Summary: ${auditData.npmVulnerabilities} NPM vulns, ${auditData.iosIssues} iOS issues, ${auditData.androidIssues} Android issues, ${auditData.sensitiveFiles} sensitive files`);
    
  } catch (error) {
    console.error('❌ Error generating HTML report:', error.message);
    process.exit(1);
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateHTMLReport, parseAuditResults };
